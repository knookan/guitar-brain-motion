# Orbit and first-voicing editor · Motion 1.2

Orbit lets you build a progression by selecting successive chords. The selected
chord becomes the centre; alternatives are recomputed without changing the key
or scale. Back and history buttons revisit earlier steps. **Open progression in
Motion** sends the most recent 2–8 chords to the physical guitar route engine.

## Relationships and sources

The functional lens and the directed harmonic graph follow the functional
framework in [Music Theory for the 21st-Century Classroom](https://musictheory.pugetsound.edu/mt21c/HarmonicFunctionInClassicalMusic.html).
PLR transformations use major/minor triad cores, with extended-chord projections
explicitly labelled. Their abstract pitch-class relationship is distinct from
actual voices moving through register, as discussed in
[Plotkin, Music Theory Online 25.2](https://mtosmt.org/issues/mto.19.25.2/mto.19.25.2.plotkin.php).

The application's recommendation weights are our design decisions. These sources
do **not** establish a universal progression likelihood or the numerical weights.

## Transparent priority model

In functional contexts, priority = 100 × (0.50 directed context + 0.30
pitch-class proximity + 0.20 shared-tone ratio). Directed graph connections have
different strengths: dominant resolutions 1.0, preparation 0.9, deceptive moves
0.8, and borrowed-colour edges 0.45. A few labelled context transitions supplement
the graph (I to ii/IV/V, IV to I, and leading-tone resolution). A contained
extension may inherit its matching diatonic triad core. A chromatic C7 in C major
is not labelled a stable I merely because it contains a C-major triad.

Incoming connections say **Approach to [anchor]**. They are not reversed to invent
an outgoing resolution. Contextual outgoing transitions can coexist with that
incoming label. Dominant fallback requires a major dominant triad or its actual
dominant seventh; Gmaj7 is not automatically called G7. Resolution requires a
tonic chord matching the contextual quality.

For modal, symmetrical and makam contexts, the functional component is omitted:
priority = 100 × (0.60 proximity + 0.40 shared-tone ratio). No T/PD/D certainty is
invented. These are **12-TET guitar relationships**, not a microtonal makam
harmonisation model. The existing comma-aware scale playback remains separate.

Proximity assigns distinct pitch classes to minimise circular semitone distance,
with a cost of three for each surplus class, then uses 1 / (1 + average cost).
Shared-tone ratio is 2 × shared classes / total classes. Neither metric claims
that a pitch is held in its actual register; Motion uses absolute MIDI events.

The first scene presents diatonic degrees. Expanding the centre or selecting a
degree reveals recommendations. All chords includes all 27 chord templates in
12 roots, with duplicate pitch sets/root identities removed. Up to 24 choices
remain in the list; the spatial view presents up to eight on desktop or six on
mobile, fewer on very narrow screens. Displayed card distance increases with
priority rank. Layout checks prevent card overlap. Selecting any listed chord
recentres the scene. CSS perspective, animated arrival, curved light paths and
position transitions have a reduced-motion equivalent.

## Exact first voicing and more routes

Choose **6, 12 or 24** route alternatives, default 12. The counter reports the
number actually found. Route search remains bounded to 120 diverse candidates
per chord and the requested number of prefixes per destination. The output is
deterministic; it is not an exhaustive enumeration of every possible voicing.
Candidate and transition caches avoid repeating searches when switching counts.

**Choose voicing** offers up to 48 validated grips for the first chord.
**Choose notes** opens a transactional draft. Click a fret to replace that
string's note; click it again to mute. Hover/focus does not edit the draft.
Each string also has mute, open/capo and a typed fret (Enter or blur to commit).
Apply validates required tones, excluded tones, slash bass, capo/region,
integer frets, reach and a maximum of four pressing actions. Cancel leaves the
committed first grip intact. Applying fixes the same physical starting grip in
every route; the remaining chords are optimised around it.

User-selected grips may bypass the generator's open-string/high-position and
multiple-inner-mute search preferences. They cannot bypass musical or physical
validation and are never labelled a known catalogue grip. Picking or high
position warnings remain visible. Changing tuning/capo clears the old starting
grip because its physical pitches have changed.

## Layout and recovery

Wide Motion uses two rows: sequence + first voicing, then routes + transition
inspector. Harmony uses scene + chord inspector above history + alternatives.
Workspaces are bounded to 1500 px; mobile stacks them and retains the fixed,
collapsible guitar camera. Focus restoration uses preventScroll.

The previous version is preserved as tag **motion-1.1.0**, commit
`72694b34ccb81b2534edcdba3fa3aa90ed91e4eb`, and a source ZIP checkpoint. To inspect
it without overwriting local work, clone the repo separately and check out that
tag. A future production rollback should use a new service-worker cache name
to replace a newer installed offline build safely.
