"""Rebuild the static relocation release from the pinned bundled inputs."""
from hashlib import file_digest
from pathlib import Path
from shutil import copy2, copytree, copyfileobj
import subprocess
import sys
import tarfile
import tempfile
import zipfile

root = Path(__file__).resolve().parent
target = Path(sys.argv[1]).resolve()


def verify(directory, manifest):
    expected = {}
    for line in manifest.read_text(encoding="utf-8").splitlines():
        digest, path = line.split("  ", 1)
        expected[path] = digest
        with (directory / path).open("rb") as file:
            if file_digest(file, "sha256").hexdigest() != digest:
                raise ValueError(f"SHA-256 mismatch: {path}")
    return expected


inputs = root / "inputs"
verify(inputs, inputs / "SHA256SUMS.txt")
if target.exists():
    raise FileExistsError(f"Choose a new output directory: {target}")
with tempfile.TemporaryDirectory() as directory:
    temporary = Path(directory)
    engine_archive = inputs / "HOSHITOURANAI_Common_Engine_v1.3.0_LOCKED.zip"
    with zipfile.ZipFile(engine_archive) as archive:
        archive.extractall(temporary / "base")
    copytree(root / "site", target)
    dist = target / "dist"
    base = temporary / "base" / "common-engine"
    copytree(base / "data", dist / "engine" / "data")
    large = dist / "engine/data/ephemeris_1900_1999_3h.bin"
    with large.open("rb") as stream:
        for index in range(2):
            large.with_suffix(f".bin.{index}").write_bytes(stream.read(16 * 1024 * 1024))
        if stream.read(1):
            raise ValueError("Unexpected size of split ephemeris")
    large.unlink()
    subprocess.run(
        [sys.executable, str(target / "research/extend-helsinki.py"),
         str(dist / "engine/data/timezones_1900_2100.json")],
        check=True,
    )
    (dist / "asteroids").mkdir()
    with zipfile.ZipFile(inputs / "HOSHITOURANAI_Chart_Points_WORKING.zip") as archive:
        for year in range(1900, 2101):
            name = f"asteroids-{year}.bin"
            with archive.open(f"data/{name}") as source, (dist / "asteroids" / name).open("wb") as out:
                copyfileobj(source, out)
    with tarfile.open(inputs / "HOSHITOURANAI_Lilith_1900-2100_WORKING.tar.xz") as archive:
        archive.extractall(temporary / "lilith", filter="data")
    (dist / "lilith").mkdir()
    for year in range(1900, 2101):
        name = f"lilith-{year}.bin"
        copy2(temporary / "lilith" / "data" / name, dist / "lilith" / name)
expected = verify(target, root / "DIST_SHA256SUMS.txt")
actual = {path.relative_to(target).as_posix() for path in dist.rglob("*") if path.is_file()}
if actual != set(expected):
    raise ValueError("Restored distribution file list differs from the release manifest")
print(f"Verified {len(expected)} static files.")
