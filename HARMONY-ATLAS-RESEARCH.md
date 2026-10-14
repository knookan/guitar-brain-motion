# Harmony Atlas: approaches and implementation

## Implemented

1. **Functional relationships.** T / PD / D / other regions organize the existing tonal graph. Third- and sixth-degree colour chords share the T region without claiming that they have the same phrase function as I. Secondary dominants keep their explicit destination; modal mixture is a possible colour relationship, not compulsory resolution. Nonfunctional scales and makam collections use membership layouts without importing classical functions. Source: [University of Puget Sound, Harmonic Function in Classical Music](https://musictheory.pugetsound.edu/mt21c/HarmonicFunctionInClassicalMusic.html).

2. **Fifths.** Chord roots are ordered by successive pitch-class fifths. The wide layout uses a ring; phones and large/doubled-root sets use a legible ordered grid. This is root organization, not a measurement of harmonic distance or a claim of modulation. Source: [University of Puget Sound, Circle of Fifths Progression](https://musictheory.pugetsound.edu/mt21c/CircleOfFifths.html).

3. **PLR neighbourhoods.** Major and minor triads connect through Parallel, Leittonwechsel and Relative transformations, preserving two pitch classes. C major connects to C minor (P), E minor (L), and A minor (R). One voice moves by one semitone for P/L, by two for R, at pitch-class level. These operations are involutions. This is a local PLR view, not a full Tonnetz. A seventh/extended chord's major/minor triad core can be projected explicitly; the display does not preserve the extensions. Diminished, augmented, suspended or ambiguous thirds do not receive an invented PLR result. See [Richard Plotkin, Chord Proximity, Parsimony, and Analysis with Filtered Point-Symmetry, MTO 25.2 (2019)](https://mtosmt.org/issues/mto.19.25.2/mto.19.25.2.plotkin.php).

The Atlas describes abstract relationships. The **Centre → this chord** action supplies two real chord records to Motion, where actual guitar registers, bass, tuning, capo, playable grips and physical travel are calculated independently. PLR and fifths use 12-TET pitch classes; makam coma playback remains in the existing Scale and Theory / commas tools.

## Researched for later work

Plotkin compares FiPS, DFT phase-space and Callender–Quinn–Tymoczko voice-leading spaces. These distinguish aspects of scalar configuration, harmonic proximity and pitch movement. They deserve separate models and validation; they are not implemented or labelled as implemented in this update. A full Tonnetz or chord-space geometry should preserve its equivalence assumptions, source context and explanatory labels before being offered as another lens.

## Interface and validation

- The map is first in the Harmony desk. A single toolbar holds the scale and three lenses. Construction, layers, chord-to-scale matching, and theory are compact disclosures.
- The source and target chord in Motion can each be edited directly using every built-in chord type, add/alter/omit modifiers, and slash bass. Changes invalidate old route/grip locks. Existing impossible constraints return an explicit empty state.
- Tests cover PLR over every major/minor root, inverse operations, retained tones, root order, destination visibility, collision-free layouts, menu order and complete offline/standalone assets. Browser checks cover the real editor, playback controls, language and responsive geometry.
