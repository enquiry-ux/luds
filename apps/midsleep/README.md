# Midsleep

A sleep diary that scores recovery and estimates circadian phase. Published as a
Claude Artifact; `index.html` is the whole app.

Unrelated to the LNURL specifications in the rest of this repository — it lives
here only because this was the working tree. Moving or deleting `apps/` has no
effect on the LUD documents.

## The idea

Two products, merged. A sleep/circadian tracker models your biology but knows
nothing about what you did yesterday; a habit tracker logs your behaviour but
knows nothing about your body clock. Holding both lets the app measure **which
habits actually move your sleep** — the one thing neither half can do alone.

## Getting started

The app opens on a setup card asking for a name and two estimates: roughly when
you fall asleep and when you wake. That alone is enough to place your body clock
and produce the full energy schedule — no logging required to get a useful answer.

Habitual timing resolves in this order:

1. the **median** of your last 14 logged nights, once you have any;
2. the **setup estimate**, before that.

The page says which it is using (masthead, midsleep fact, and the energy card),
and switches over automatically on your first saved night. Chronotype is marked
*provisional* until at least two free nights exist, because an alarm hides your
real phase.

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

### Today's energy

A two-process estimate (Borbely) of alertness across the waking day, anchored to
your own wake time and habitual bedtime:

- homeostatic sleep pressure rising from the moment you woke
- sleep inertia clearing over the first hour or so
- the midafternoon trough
- the evening wake-maintenance zone, tracking your bedtime
- the sleep gate opening after melatonin onset

Sleep debt raises the pressure you begin the day with, which lowers the whole
curve — that is why the ceiling drops when you are behind. Surfaced as an
**energy potential** (the day's peak) plus peak, dip, second-wind and wind-down
windows in clock time.

### Habits and their effects

Seven habits are logged per night, three that help and four that cost. Ticking
them during the day writes against tomorrow morning's entry, so the sleep they
produce is already attached when you log it.

**What moves your sleep** compares mean sleep on nights each habit happened
against nights it did not, reporting the difference in minutes and efficiency.
Three nights minimum on each side before anything is reported. These are
observed differences between your own nights, not proof of cause.

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
plus `settings/prefs` for your sleep need and `settings/profile` for your name and estimated schedule. A document may hold habits with no sleep times yet (tonight's ticks); those are ignored by every statistic until the morning entry completes them. Declaring `db` makes the artifact
organisation-internal — it cannot be shared publicly.

Until the first night is saved the page shows a clearly-marked example fortnight,
rendered client-side only and never written to storage.
