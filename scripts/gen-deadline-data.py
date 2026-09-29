"""Generate the holiday table and the parity cases for /tools/deposit-deadline.

The calculator on the site must give the same dates Occupella's chat gives.
The chat's arithmetic is AgenticHelixis src/helixis/geo/deadline_math.py,
which skips US federal + state holidays using the `holidays` package. The
browser has no such package, so this script writes:

  src/data/holidays.json          the holiday dates per state for YEARS
  src/tools/deadline-cases.json   deposit due and finish-by dates computed
                                  BY THE BACKEND'S OWN FUNCTIONS, which
                                  depositDeadline.test.ts checks the site
                                  against, date for date
  src/tools/notice-cases.json     the same for the pay-or-quit and
                                  month-to-month notice periods, as
                                  mirror_tools passes their units

Run it by hand when the rules data or the year range changes:

  pip install "holidays>=0.100"
  python scripts/gen-deadline-data.py /path/to/AgenticHelixis
"""

from __future__ import annotations

import json
import sys
from datetime import date, timedelta
from pathlib import Path

YEARS = [2026, 2027, 2028]

root = Path(__file__).resolve().parent.parent
helixis = Path(sys.argv[1]).resolve()
sys.path.insert(0, str(helixis / "src"))

import holidays  # noqa: E402

from helixis.geo import deadline_math  # noqa: E402

rules = json.loads((root / "src/data/jurisdiction_rules.json").read_text())
states = sorted(rules["states"])

# ⚠ A state's calendar is not federal + extras. The package gives each
# state its own list, and some leave federal days out (Georgia has no
# Presidents' Day), so the table records what each state adds AND drops.
federal = sorted({d.isoformat() for d in holidays.country_holidays("US", years=YEARS)})
extra: dict[str, list[str]] = {}
dropped: dict[str, list[str]] = {}
for st in states:
    try:
        cal = holidays.country_holidays("US", subdiv=st, years=YEARS)
    except Exception:  # noqa: BLE001 — same fallback as deadline_math
        cal = holidays.country_holidays("US", years=YEARS)
    days = {d.isoformat() for d in cal}
    if days - set(federal):
        extra[st] = sorted(days - set(federal))
    if set(federal) - days:
        dropped[st] = sorted(set(federal) - days)

(root / "src/data/holidays.json").write_text(
    json.dumps(
        {
            "years": YEARS,
            "generated_with": f"holidays {holidays.__version__}",
            "federal": federal,
            "state_only": extra,
            "state_drops": dropped,
        },
        indent=1,
    )
    + "\n"
)

# Triggers: every Friday and every day around each holiday in the range,
# where weekend and holiday handling actually changes the answer.
triggers: set[date] = set()
d = date(YEARS[0], 1, 1)
while d.year == YEARS[0] or (d.year == YEARS[1] and d.month <= 6):
    if d.weekday() == 4:
        triggers.add(d)
    d += timedelta(days=1)
for h in federal[:14]:
    hd = date.fromisoformat(h)
    for k in range(-3, 2):
        triggers.add(hd + timedelta(days=k))

cases = []
for st in states:
    dep = rules["states"][st]["deposit"]
    days = dep["return_deadline_days"]
    if not isinstance(days, int):
        continue
    unit = dep.get("return_deadline_unit") or "calendar"
    for t in sorted(triggers):
        c = deadline_math.compute_deadline(t, days, unit, state=st)
        done = deadline_math.compliance_completion_date(c.due_date, state=st)
        # Only cases inside the holiday table's years are comparable.
        if c.due_date.year > YEARS[-1] or done.year < YEARS[0]:
            continue
        cases.append([st, t.isoformat(), c.due_date.isoformat(), done.isoformat()])

(root / "src/tools/deadline-cases.json").write_text(json.dumps(cases) + "\n")

notice_cases = []
for st in states:
    n = rules["states"][st]["notice"]
    for kind, days, unit in (
        ("nonpay", n["nonpay_days"], n.get("nonpay_unit")),
        ("mtm", n["mtm_termination_days"], "calendar"),
    ):
        if not isinstance(days, int):
            continue
        for t in sorted(triggers):
            c = deadline_math.compute_deadline(t, days, unit, state=st)
            if c.due_date.year > YEARS[-1]:
                continue
            notice_cases.append([st, kind, t.isoformat(), c.due_date.isoformat(), c.unit_used])

(root / "src/tools/notice-cases.json").write_text(json.dumps(notice_cases) + "\n")
print(f"{len(federal)} federal dates, {len(extra)} states with extra dates, {len(cases)} deposit cases, {len(notice_cases)} notice cases")
