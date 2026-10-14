# Changelog

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
