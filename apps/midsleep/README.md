# Midsleep

A sleep diary that scores recovery and estimates circadian phase. Published as a
Claude Artifact; `index.html` is the whole app.

Unrelated to the LNURL specifications in the rest of this repository — it lives
here only because this was the working tree. Moving or deleting `apps/` has no
effect on the LUD documents.

## What it computes

Every night is keyed to the **morning you woke**, and plotted on an 18:00–12:00
window so a night that crosses midnight stays one continuous bar.

| Measure | Definition |
| --- | --- |
| Time in bed | lights out → wake |
| Total sleep time | time in bed − sleep latency − time awake in the night |
| Sleep efficiency | total sleep time ÷ time in bed (85% is the clinical mark) |
| Midsleep point | midpoint of sleep onset and wake — the circadian anchor |
| Sleep debt | running 7-night deficit against your sleep need, surpluses repaying it |

### Recovery

Weighted from five components, each 0–100. A component with no data is dropped
and its weight redistributed, so the score is never penalised for something you
did not log.

- Sleep duration vs. your need — 30%
- Sleep efficiency — 20%
- Sleep debt over 7 nights — 20%
- Body clock regularity, the standard deviation of midsleep — 15%
- Resting heart rate against your own 14-night baseline — 15%

### Body clock

- **Chronotype** — sleep-corrected midsleep on free days (MSFsc), the MCTQ
  measure. Needs at least two nights ticked as free days.
- **Social jetlag** — the gap between free-day and work-day midsleep.
- **Melatonin onset (DLMO)** — about two hours before habitual sleep onset.
- **Temperature minimum (CBTmin)** — about two hours before habitual wake.
- **Morning light window** — the four hours after CBTmin, where light advances
  the clock; light before it delays.

Estimates from self-reported entries, not a medical device.

## Storage

Uses the artifact `db` capability: one document per night at `nights/<YYYY-MM-DD>`,
plus `settings/prefs` for your sleep need. Declaring `db` makes the artifact
organisation-internal — it cannot be shared publicly.

Until the first night is saved the page shows a clearly-marked example fortnight,
rendered client-side only and never written to storage.
