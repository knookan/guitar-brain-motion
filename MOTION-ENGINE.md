# Guitar Brain Motion

Motion extends the existing guitar studio in an independent version. It uses its own local-storage keys, PWA identity and offline-cache prefix. The original studio is preserved.

## Harmony roles

Roles come from the selected chord's spelled intervals: root, third/seventh guide tones, perfect fifth, and extensions/alterations. Additional notes from the explicitly selected scale context are marked as context tensions. An interval label does not establish a chord's tonal function or guarantee a consonant improvisation choice.

## Voice routes

Each sounding string is an event with its actual MIDI pitch, physical string and absolute fret. Unisons on two strings remain two events. In reentrant tunings, bass and top voice are determined by pitch, not by string order. Capo establishes the lowest available physical fret; it does not transpose the same physical fret twice.

Routes use grips that pass the inherited musical and ergonomic validator. Full mode retains every chord tone; practical mode permits the existing, explicit omission policy. Omissions are shown separately from voices entering or leaving a transition.

Voice alignment anchors bass and top voice, then pairs the inner voices in pitch order. Exactly the smaller voice count is matched; extra voices are recorded as entries/exits. Common pitch means identical MIDI, not simply identical pitch class. Keeping a top voice requires exact pitch equality. Ascending/descending modes require a strict change at every chord.

The planner optimizes the complete sequence with a layered path search. Costs combine pitch travel, large leaps, string/fret travel, hand shift and ergonomic effort. Alternative weights are design choices, not music-theory laws. Candidate sampling retains every available upper-pitch register and then a diverse set of up to 120 grips per chord. Results are balanced suggestions within that bounded search, not a proof of a globally optimal fingering across all imaginable guitar grips. The inherited generator considers up to six sounding strings.

## Playback and animation

One plan supplies both route diagrams and audio events. The route audio path preserves duplicate pitches and physical positions. Visual chord changes follow the nominal Web Audio measure boundaries; sounding-note flashes follow each actual sample's duration. Pending playback requests and auditions are cancelled when superseded.

System reduced-motion preferences are respected by default. Settings can explicitly select full or reduced animation. Mobile cameras remain fixed and top-down.

Motion plans use the physical fretboard's 12-TET pitches. Existing makam/comma playback remains available in the Scale workspace; Motion does not claim microtonal frets or traditional makam harmonic grammar.

## Validation

Run `node tests/run.cjs` from this folder. The current suites cover theory, grip validity, harmony, MIDI export, makam coordinates, sample playback, PWA behavior and register-aware route matching. Old layout snapshots are retained as development references and excluded from the current runner.
