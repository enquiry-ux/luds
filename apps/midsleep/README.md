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

## Who can see what

The page is gated by claude.ai itself: declaring the `db` capability makes the
artifact organisation-internal, so everyone who opens it is a signed-in member
of the owner's organisation. That is real, server-enforced authentication, and
the app implements none of it.

What the app adds is **separate profiles**, so several people each keep their own
nights, habits and goals. That is data separation, not access control —
**anyone who can open the page can open any profile.** The chooser says so.

Per-viewer *private* data would need the `user` capability, which gives the page
the viewer's real identity and unlocks the store's `data/users/{self}` subtrees.
It is not enabled for this account, so it is not built. A password box checked in
client-side JavaScript against a database every viewer can read would be theatre,
not security, and is deliberately absent.

## Screens

**Entry screen.** Name, usual sleep time, usual wake time — with a dial that
previews your night live as you type it. A "see it with example data first"
route opens the app in demo mode against the example fortnight, without saving
anything.

**App shell.** Five tabs, with the last one you used remembered per browser:

| Tab | Holds |
| --- | --- |
| Today | Energy curve, live "right now" reading, peak/dip/second-wind/wind-down windows, summary tiles |
| Body clock | 24-hour dial, midsleep, chronotype, social jetlag, light timing |
| Habits | Tonight's checklist with streaks, consistency, and what moves your sleep |
| Goals | Targets on measured metrics, with progress and week-on-week trend |
| Sleep | Overnight recorder, recovery score, actogram, the night form, the full log |
| Briefing | The night read back each morning, and the day ahead |

Sleep and Briefing sit together at the end: one records the night, the other
reads it back.

## Goals

A goal is a target on something the app already measures, so progress is read
from real nights rather than ticked off by hand. Each metric computes from an
arbitrary run of nights, which is what lets the trend compare the last 7 against
the 7 before.

| Metric | Direction | Default |
| --- | --- | --- |
| Average sleep | at least | 7h 30m |
| Sleep debt | no more than | 2h |
| Sleep efficiency | at least | 85% |
| Midsleep regularity | no more than | 30 min |
| Social jetlag | no more than | 1h |
| Habit consistency | at least | 80% |
| Lights out by | no later than | 23:00 |

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

### Overnight recording

The Sleep tab can measure the night by microphone and fill the entry in itself.

**No audio is retained.** The stream is measured, never recorded: each 30-second
epoch is reduced to one peak-loudness number and the samples are discarded in the
same callback. Nothing is stored, nothing is uploaded, and there is no buffer that
could be played back. A silent gain node sits between the capture node and the
destination, so the microphone never reaches the speakers.

Scoring follows actigraphy convention on 30-second epochs (the polysomnography
standard), with a threshold set from the room's own noise floor and dynamic range
so a quiet bedroom and a noisy street both score sensibly:

| Landmark | Rule |
| --- | --- |
| Sleep onset | start of the first quiet stretch of 10 minutes or more |
| Awakening | 2 minutes or more of sustained movement between onset and wake |
| Final wake | end of the last quiet stretch of 5 minutes or more |

The scored night is written straight to the diary — lights out, sleep onset,
latency, time awake, wake time — marked `source: "recorded"` and shown with a
filled circle in the log. The epoch series is kept on the night document (about
3 KB for eight hours) to draw the strip chart.

Verified against synthetic nights with known answers: onset, wake and total
awakening minutes are recovered exactly, a +200 noise floor shifts the threshold
rather than the result, a night with no settled stretch is refused rather than
invented, and recordings under ten minutes are not scored.

Progress is written to `localStorage` every two minutes, so a crash or a closed
tab mid-night offers to score what was measured instead of losing it.

Sound is not polysomnography. A restless partner, a pet or traffic reads as
movement, so every scored night is editable in the form below it.

### The morning briefing

The Briefing tab reads the night back each morning. It has two halves, and the
split is the point:

**Measured** — renders instantly and never waits on anything: time asleep,
efficiency, sleep onset, wake, the restlessness verdict, the strip chart of the
night, and today's peak / dip / second wind / wind-down.

**Interpreted** — the *Midsleep agent* (the app's name in the interface for the
`sample` capability, which runs on the viewer's own Claude account) is handed
those figures and asked what they mean. It is told explicitly not to invent, re-derive or
estimate any number, because a language model asked for arithmetic will invent
it. Every figure it quotes is one this page computed. It returns JSON
(`headline`, `night`, `restless`, `day`, `actions[]`, `watch`) which is rendered
into the app's own components rather than dumped as prose, and is told it is not
a doctor.

Briefings are cached per morning at `profiles/<pid>/briefings/<date>`, so opening
the tab again replays the stored read rather than spending the viewer's usage
twice. Sampling costs the *viewer's* Claude allowance, so it runs on an explicit
press, never on load or a timer.

When `sample` is unavailable — outside the Claude viewer, or consent declined —
the measured half still renders in full and the read says so.

The interface calls it the Midsleep agent rather than Claude, but the card states
plainly that it runs on Claude and spends the viewer's own usage: naming the
feature is fine, hiding what it costs is not.

### Restlessness

Scored from the epoch series, and deliberately separate from duration: a night
can be long and still broken.

| Signal | Meaning |
| --- | --- |
| Stirs per hour | how often sleep was disturbed at all |
| Active share | proportion of the sleep period spent moving |
| Longest unbroken stretch | how consolidated the sleep was |

`restless` if stirs ≥ 1.2/h, or active share ≥ 12%, or nothing longer than 45
minutes unbroken; `settled` only if stirs < 0.6/h, share < 6% **and** at least 90
minutes unbroken; `unsettled` between. Consolidation carries its own weight
because five brief stirs with no block over an hour is broken sleep even though
almost no time is lost.

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

## Installable build

`dist/` is a complete PWA: manifest, service worker, icons and the app wrapped
in a head carrying the install tags. All paths are relative, so it installs from
any sub-directory. `dist/README.md` covers hosting and the iOS route.

Installation needs a secure context served top-level, which is why this is a
separate bundle rather than something the artifact can do: the artifact renders
inside an iframe on claude.ai, so installing it would install claude.ai.

Verified against a local server: the manifest parses with no errors, the service
worker activates and controls the page, all three icons serve at their declared
sizes, and with the network cut the app reloads and still works — including
creating a profile and computing a schedule.

The service worker precaches the shell and caches fonts opportunistically the
first time they load, so an installed copy keeps its real typefaces offline.
A `file://` copy cannot register a service worker, so it gets neither install
nor font caching; everything else behaves the same.

Regenerate `dist/index.html` after changing the app rather than editing it.

## Offline copy

The **Download** tab hands over the whole app as one HTML file. It is the same
code: the page captures its own served source at script start, before rendering
mutates the DOM, and strips external `<script src>` tags that could not load
from a `file://` copy.

Inside the claude.ai viewer the sandbox blocks a page from downloading anything,
so the save goes through the platform's `downloads` capability. A saved copy has
no such restriction and hands over a blob itself; both paths are implemented and
the capability path falls back to the blob on `unavailable`.

The offline copy has no artifact database, so it persists to `localStorage`
under one key (`midsleep.v1`), in the same shape as the export format. Verified
working from both `file://` and `http://`, surviving reload. Google Fonts cannot
load offline, so the declared fallback stacks take over.

**Export / Import** moves data between the hosted page and an offline copy. The
two do not sync. Import adds everyone in the file, replacing any profile whose
id already exists.

## Storage

Uses the artifact `db` capability inside the viewer, and `localStorage` everywhere else. Keyed per person:

    profiles/<pid>                      name, estimated sleep and wake times
    profiles/<pid>/nights/<YYYY-MM-DD>  one document per night
    profiles/<pid>/goals/<metric>       one document per target
    profiles/<pid>/prefs/main           sleep need

A night document may hold habits with no sleep times yet (tonight's ticks);
those are ignored by every statistic until the morning entry completes them.
Declaring `db` makes the artifact organisation-internal — it cannot be shared
publicly.

Data saved under the older single-user layout (`nights/*`, `settings/profile`,
`settings/prefs`, `goals/*`) is migrated into the first profile on load. The
originals are left in place rather than deleted, so a migration that fails
part-way costs nothing.

Until the first night is saved the page shows a clearly-marked example fortnight,
rendered client-side only and never written to storage.
