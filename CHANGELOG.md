# Changelog

## 1.4.0 · 2026-10-18

Practice release.

- Motion practice controls: tempo field, **Loop**, **Metronome** and **Count-in** (one bar), with the whole route repeating seamlessly until stopped.
- Rhythm for route playback: Block, Strum ↓ and Strum ↓↑ (Arpeggio keeps its own button and takes priority).
- Per-chord length of 1, 2, 4 or 8 beats on every sequence card; saved with the progression and the project file.
- Keyboard: Space plays/stops, Escape stops, ← → move between chords in Motion. Controls that use these keys themselves keep them.
- MIDI export now writes the whole Motion route timed by each chord's beats; a scale exports as a sequence of notes instead of one cluster.
- Audio engine: look-ahead loop scheduling, synthetic click for the metronome, and a voice cap that only counts notes already sounding, so long patterns no longer cut off notes still waiting to play.
- Route cards show a hand-position trace per chord, scaled across all visible routes, with the fret span beside it.
- First-voicing diagram is larger on desktop; phones no longer show the side-by-side switch.
- Fixes: English text for scale chords, comma accidentals, harmony-layer tooltips and the custom-tuning message; the Application section shows the real release; exported files are named `guitar-brain-motion-*`; "Add chord" is disabled at 8 chords; removed the redundant Save button and unused handlers; the help dialog now covers Motion, Orbit and layout.
- Tests: layout controller and practice suites added, four previously skipped suites wired into the runner, dead legacy test removed, and a Tests workflow runs everything on push and pull request.
- Offline cache advanced to `gb-motion-1.4.0-practice-r1`.
- Current count: 227 core/audio checks + 9 voice-route checks.

## 1.3.0 · 2026-10-14

- One layout controller owns the guitar/tool split, independent of the selected musical workspace.
- Compact global navigation with Balanced, Guitar and Tools focus presets.
- Draggable and keyboard-accessible separator; independent saved stacked/side-by-side proportions.
- Optional side-by-side arrangement, with automatic stacking on narrow screens and a landscape arrangement on short phones.
- Compact guitar heading; always-visible playback dock and a full-width reopen strip.
- Desktop camera controls moved out of the playing surface; a tighter desktop camera fit retains the shared WebGL/SVG projection.
- Wide Notes panels place chord matches and scale results beside each other.
- Motion and Harmony layouts respond to the available panel width using container queries.
- One scrolling tool surface instead of nested route and recommendation scrollers.
- Retained 1.2 source checkpoint: `Guitar_Brain_Motion_1.2_a758007.zip`.
- No automated tests run for this layout update.

## 1.2.0 · 2026-10-14

- 6, 12 or 24 voice routes, with reusable candidate and transition caches.
- Exact first voicing: choose a catalogue grip or edit each string on the guitar.
- Transactional Apply/Cancel, required-tone/bass/region/reach validation, and clear picking warnings.
- Orbit harmony: animated diatonic entrance, recentering chord suggestions, distance by connection priority, all-chord scope, audition, back/history and transfer to Motion.
- Functional evidence remains directed; modal and makam contexts use 12-TET colour relationships without invented tonal functions.
- Two workspace tiers on wide screens; compact sequence controls and a responsive recommendation list.
- Mobile title layout, fixed-camera fit, and a visible reopen control after expanding a collapsed mobile workspace to desktop width.
- Build metadata and a complete offline cache for 1.2.0.
- 177 automated checks across theory, ergonomics, routes, Orbit, mobile camera/export, standalone HTML, audio and PWA launch behavior.

## 1.1.0

- Notes-first startup, Harmony Atlas with Functions/Fifths/PLR, compact map controls and arbitrary source/target chord editing.
- Retained as tag `motion-1.1.0` at `72694b34ccb81b2534edcdba3fa3aa90ed91e4eb`.
