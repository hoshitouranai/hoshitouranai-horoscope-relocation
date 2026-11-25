import datetime as dt
import json
from pathlib import Path

import sys
data = Path(sys.argv[1]) / 'engine/data'
out = data / 'yearly'
out.mkdir(exist_ok=True)
for first, last in [(1900, 1999), (2000, 2050), (2051, 2100)]:
    label = f'{first}_{last}'
    planet = data / f'ephemeris_{label}_3h.bin'
    planet_bytes = planet.read_bytes() if planet.exists() else b''.join(
        Path(f'{planet}.{i}').read_bytes() for i in range(2))
    earth = (data / f'earth_orientation_{label}_3h.bin').read_bytes()
    stations = json.loads((data / ('stations.json' if first == 2000 else f'stations_{label}.json')).read_text())
    start = dt.date(first, 1, 1)
    for year in range(first, last + 1):
        offset = (dt.date(year, 1, 1) - start).days * 8
        end = (dt.date(year + 1, 1, 1) - start).days * 8
        for name, stride, source in [('positions', 96, planet_bytes), ('orientation', 8, earth)]:
            (out / f'{name}-{year}.bin').write_bytes(source[offset * stride:(end + 1) * stride])
        years = []
        for initial, *changes in stations:
            before = sum(change <= offset * 180 for change in changes)
            years.append([(initial + before) % 2, *(
                change - offset * 180 for change in changes if offset * 180 < change <= end * 180)])
        (out / f'stations-{year}.json').write_text(json.dumps(years, separators=(',', ':')))
