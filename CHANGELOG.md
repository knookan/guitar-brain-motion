# Changelog

## 1.9.1 · 2026-10-22

- **Share links pasted into an open tab now work.** Opening a link in a new tab already showed the banner, but pasting it into a tab where the app was running only changes the address after `#`, and nothing happened. The app now notices that change, switches to Motion and offers the progression. Found by the new browser test.
- **Browser smoke test** (`tests/browser/smoke.cjs`, run by `.github/workflows/browser.yml` on every push): real Chromium checks first-load size and lazy samples, choosing notes, chord diagrams with fingers, the harmony map and every lens, Motion playback with count-in and loop, the library, share links in a new and an open tab, left-handed mirroring, no horizontal scroll on a phone in any workspace, and an axe accessibility scan of every workspace in all four themes.
- Offline cache advanced to `gb-motion-1.9.1-link-r1`.

## 1.9.0 · 2026-10-22

For guitarists.

- **Left-handed mode** (Settings → Guitar): the fretboard is mirrored with the nut on the right and every label kept readable, the camera drag follows the mirror, chord diagrams reverse their strings, and SVG, PNG and PDF exports are mirrored too. The choice is remembered.
- **Suggested fingers** on every chord diagram (Chord, Scale, Harmony inspector and the Motion grip), shown under the strings: index on the lowest fret, higher fingers for higher frets, one finger per note up to four notes, and a barre only where the shape needs one. Classic shapes come out as taught (C 3-2-1, Am 2-3-1 over the strings, E 2-3-1, F barre 1 · 3 · 4 · 2 · 1 · 1). Turn them off in Settings.
- Fingers are a suggestion from the hand model, not a promise about any one player's hand; shapes with no playable fingering show none.
- Diagram options are passed explicitly to every diagram rather than held as shared state.
- Tests: `tests/hand.test.cjs` (classic fingerings, invariants over 1890 generated voicings, diagram fingers and mirroring in 4–8 string tunings, mirrored export, saved preferences, mirror CSS contract). Current count: 274 core/audio checks + 9 voice-route checks.
- Offline cache advanced to `gb-motion-1.9.0-hand-r1`.

## 1.8.0 · 2026-10-22

Readability, themes and accessibility.

- **Text never goes below 10 px.** Eighty-one rules between 6 and 9 px now share one `--fs-xs` value, and `<small>` can no longer shrink below it.
- **Light theme finished.** The shell kept a dark gradient that overrode the light tokens, so the page header and chord title were dark on dark. The shell, camera and menu controls, legend, fret numbers, HUD, scale picker and form fields now follow the theme, and every pale text role has a readable colour in `theme-light.css`.
- **Contrast measured, not guessed.** An automated sweep of all seven views in all four themes went from 79 contrast failures in the light theme and 6 in graphite to none (only disabled controls remain). Chord-type and chord-tone captions were brightened in the dark themes. The sweep also found an unlabelled chord-size select and a nested landmark, both fixed.
- **Theme: System.** A fifth theme follows the operating system and switches live when it changes; the browser address-bar colour now matches the active theme.
- Opening a workspace is announced to screen readers; focus stays on the tab so keyboard navigation is not interrupted.
- The layout divider respects reduced motion.
- Tests: `tests/a11y.test.cjs` (text-size floor, contrast of every theme's text tokens, address-bar colour per theme, light layer registration, screen-reader hooks). Current count: 267 core/audio checks + 9 voice-route checks.
- Offline cache advanced to `gb-motion-1.8.0-access-r1`.

## 1.7.0 · 2026-10-22

Fast start.

- **First load drops from about 11.3 MB to about 1.0 MB** (measured in Chromium). The 10.7 MB `guitar-samples.js`, which every visit had to download and parse as one huge string, is now a 10 KB index; the audio is 48 raw PCM files in `assets/audio/guitar/`, bit-for-bit identical to the previous recordings.
- Samples are fetched when first played (a chord needs only a few files), shared between simultaneous requests, and checked for size. Missing or short files give a clear message and can be retried; Stop cancels a play that is still loading.
- A common guitar range is warmed up in the background shortly after start, so the first chord rarely waits on the network.
- Offline use is unchanged: the service worker caches all 48 files with the app (verified with the network cut and a reload). The single-file build embeds the same PCM and never asks the network.
- GitHub Pages now publishes only what the app serves (90 files, 9.0 MB), staged from the service worker's own list by `stage-pages.js`. Research documents, data dumps, tests and build scripts stay out.
- Tests: lazy loading (fetch once, concurrent, errors, retry, cancel, route/progression/sequence), index and offline list in step, standalone PCM, and the staging contract. Current count: 261 core/audio checks + 9 voice-route checks.
- Offline cache advanced to `gb-motion-1.7.0-fast-r1`.

## 1.6.0 · 2026-10-22

Library and sharing.

- **Library** in Motion: name and save the current progression, then open, rename or delete it later. Chords, beats, top notes, rhythm, fret region and route options are kept. Up to 50 saved progressions; damaged or incomplete entries are dropped on load.
- **16 ready-made progressions** in five groups (Pop, Jazz, Blues, Andalusian, Modal), built in the key you have selected and spelled correctly for it (F♯: F♯ – C♯ – D♯m – B).
- **Share link**: Copy link (or the system share sheet) writes the whole progression into the address after `#m=`. A visitor sees a banner, "Shared progression · Dm7 → G7 → Cmaj7", and chooses Open or Dismiss; nothing replaces their work until they open it. Custom chords that cannot be rebuilt from theory are refused instead of shared. Links are validated field by field: wrong version, too many or unknown chords, oversized or malformed data are ignored.
- **Top note per chord**: choose the exact melody note for any chord in its editor. Routes keep that note on top; the card shows it (↑D4), and Reset constraints clears it. When no playable route can reach the notes you chose, you are told so.
- Tests: `tests/library.test.cjs` covers presets in five keys, library persistence and clean-up, link round trip and rejection cases, the banner flow and top-note routing. Current count: 250 core/audio checks + 9 voice-route checks.
- Offline cache advanced to `gb-motion-1.6.0-library-r1`.

## 1.5.0 · 2026-10-22

Tonal harmony map.

- New **Map** lens in Harmony, now the default: three function regions meeting at a centre point (subdominant, dominant, tonic), the tonic I△ at the junction, and one large circle per region for borrowed, Neapolitan and leading-tone chords.
- Eight secondary-dominant groups (ii7/X, V7/X and VII°7/X, with a half-diminished ii where it applies) drawn as ring pairs with a bracket and an arrow to the target chord; dashed magenta subV7; I⁶₄ and V7sus4 beside the dominant.
- Roman numerals with △, ø, ° and ♭ (I△, ii7♭5, ♭VI△, VII°7), or chord names; the choice is remembered.
- Hover or focus a chord to bring out its arrows; click selects (fretboard and inspector follow), double-click plays; Expand gives the map the full tools area; zoom 1×–2× and a borrowed-scale selector.
- Works in major and minor keys; scales without classical function show a notice that points to the other lenses.
- Existing Orbit, Functions, Fifths and PLR lenses are unchanged. Saved projects from earlier releases open on the Map once.
- Tests: `tests/harmony-diagram.test.cjs` (labels, regions, pair spelling, bounds and overlap in four keys, arrows, rendering contract). Current count: 242 core/audio checks + 9 voice-route checks.
- Offline cache advanced to `gb-motion-1.5.0-map-r1`.

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
