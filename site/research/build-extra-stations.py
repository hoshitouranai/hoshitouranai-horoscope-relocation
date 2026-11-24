"""Generate direct Swiss Ephemeris speed sign transitions for extra chart points."""
from concurrent.futures import ProcessPoolExecutor
import ctypes
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import subprocess
import sys
import tempfile

JST = timezone(timedelta(hours=9))
BODIES = (("ceres", 17, 10800), ("pallas", 18, 10800), ("juno", 19, 10800),
          ("vesta", 20, 10800), ("meanLilith", 12, 10800), ("trueLilith", 13, 900))


def collect(inputs):
    library, source, start, end = inputs
    swiss = ctypes.CDLL(library)
    swiss.swe_set_ephe_path.argtypes = [ctypes.c_char_p]
    swiss.swe_set_ephe_path.restype = None
    swiss.swe_set_ephe_path(source.encode())
    swiss.swe_calc_ut.argtypes = [
        ctypes.c_double, ctypes.c_int, ctypes.c_int,
        ctypes.POINTER(ctypes.c_double), ctypes.c_char_p,
    ]
    swiss.swe_calc_ut.restype = ctypes.c_int
    values = (ctypes.c_double * 6)()
    error = ctypes.create_string_buffer(256)

    def retrograde(second, body):
        flags = swiss.swe_calc_ut(2440587.5 + second / 86400, body, 2 | 256, values, error)
        if flags < 0 or flags & 7 != 2:
            raise RuntimeError((second, body, error.value.decode()))
        return values[3] < 0

    data = {}
    for name, body, step in BODIES:
        previous = retrograde(start, body)
        changes = [int(previous)]
        for upper in range(start + step, end + 1, step):
            current = retrograde(upper, body)
            if current != previous:
                lower, high = upper - step, upper
                while high - lower > 1:
                    middle = (lower + high) // 2
                    if retrograde(middle, body) == previous:
                        lower = middle
                    else:
                        high = middle
                changes.append(high - start)
                previous = current
        data[name] = changes
    return data


def main():
    engine, destination, workers = sys.argv[1:]
    source = Path(engine).resolve() / "research" / "swiss"
    starts = [int(datetime(y, 1, 1, tzinfo=JST).timestamp()) for y in range(1900, 2102)]
    with tempfile.TemporaryDirectory() as temporary:
        library = str(Path(temporary) / "libswe.so")
        subprocess.run(
            ["cc", "-O2", "-fPIC", "-shared", "-o", library,
             *map(str, sorted(source.glob("*.c"))), "-lm"],
            check=True,
        )
        args = [(library, str(source), first, last) for first, last in zip(starts, starts[1:])]
        with ProcessPoolExecutor(max_workers=int(workers)) as pool:
            result = dict(zip(range(1900, 2101), pool.map(collect, args)))
    Path(destination).write_text(json.dumps(result, separators=(",", ":")) + "\n")


if __name__ == "__main__":
    main()
