"""Add Helsinki from the pinned IANA tzdata 2026c TZif to a derived snapshot."""
from datetime import datetime
import json
from pathlib import Path
import sys
from zoneinfo import ZoneInfo

target = Path(sys.argv[1])
db = json.loads(target.read_text())
with Path(__file__).with_name("Europe-Helsinki.tzif").open("rb") as tzif:
    zone = ZoneInfo.from_file(tzif, "Europe/Helsinki")
start, end = (int(datetime.fromisoformat(value).timestamp()) for value in db["coverageUtc"])


def offset(seconds):
    return int(datetime.fromtimestamp(seconds, zone).utcoffset().total_seconds())


previous = offset(start)
period = [[start, previous]]
for low in range(start, end - 1, 3600):
    high = min(low + 3600, end - 1)
    current = offset(high)
    if current == previous:
        continue
    while high - low > 1:
        middle = (low + high) // 2
        if offset(middle) == previous:
            low = middle
        else:
            high = middle
    period.append([high, current])
    previous = current
db["zones"]["Europe/Helsinki"] = period
if "; Europe/Helsinki: IANA tzdata 2026c" not in db["source"]:
    db["source"] += "; Europe/Helsinki: IANA tzdata 2026c"
target.write_text(json.dumps(db, separators=(",", ":")) + "\n")
