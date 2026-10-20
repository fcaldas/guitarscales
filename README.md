<div align="center">

# guitarScales

### Explore the neck. Shape the harmony. Write the tune.

A browser-based guitar harmony workstation for learning scales, building playable jazz and bossa nova progressions, practising solos, and composing melodies in standard notation.

[![React](https://img.shields.io/badge/React-19-7251ff?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-powered-ff3d81?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![Tests](https://img.shields.io/badge/tests-Vitest-6e9f18?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)

**[Open guitarScales →](https://fcaldas.github.io/guitarscales/)**

</div>

---

## More than a scale diagram

guitarScales connects the pieces that are often taught separately. Pick a key and scale, see it across the fretboard, turn its harmony into a progression, hear how the voices move, discover useful solo targets, and then write a melody over the result.

```text
Scale → chords → progression → voicings → solo targets → original tune
```

It is especially tuned for jazz and bossa nova practice, while remaining useful as a general guitar theory playground.

## The three workspaces

| Workspace | What it helps you do |
| --- | --- |
| **Practice** | Explore scales, diatonic triads and seventh chords; build progressions; inspect guitar voicings; loop the harmony; and follow chord-aware solo targets. |
| **Compose** | Write a melody directly into a treble-clef score, choose musical durations and rests, hear tune and chords as separate voices, and save ideas in the browser. |
| **Chord Namer** | Select notes, identify likely chord names and inversions, hear the result, and send the chord directly to the sequencer. |

## Highlights

- An interactive guitar fretboard with root, guide-tone, chord-tone, and tension overlays.
- Major, modal, natural/harmonic minor, and pentatonic scale colours.
- Diatonic triads and tetrads generated for the selected key.
- Jazz vocabulary including ii–V–I, minor iiø–V–i, turnarounds, backdoor resolutions, tritone substitutions, and circles of dominants.
- A harmony route builder that suggests functional, colourful, and adventurous next moves.
- Curated, playable guitar fingerings with switchable voicing variations.
- A voice-led chord sequencer with bossa nova, swing, samba, and straight feels.
- A Solo Coach that follows the active chord and previews the next guide-tone target.
- Standard notation rendered with VexFlow for rhythm examples and melody composition.
- Two-voice playback with chords and melody together—or the tune on its own.
- Nylon guitar, electric guitar, and organ-inspired synth settings with adjustable reverb.
- Local tune saving with no account, server, or upload required.

## A typical session

1. Choose a key centre and scale colour.
2. Load a familiar jazz progression or build one chord by chord.
3. Cycle through the chord voicings and settle on playable shapes.
4. Loop the sequence with a bossa, swing, samba, or straight feel.
5. Enable **Solo Mode** to see chord tones, tensions, and the next resolution target.
6. Open **Compose**, click an insertion point in the score, choose a duration, and enter pitches from the scale.
7. Play the full arrangement or isolate the tune, then save the idea locally.

## Run it locally

You will need [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/). With pnpm available:

```bash
git clone https://github.com/fcaldas/guitarscales.git
cd guitarscales
make install
make run
```

Open [http://127.0.0.1:5173/guitarscales/](http://127.0.0.1:5173/guitarscales/).

If pnpm is not installed yet, Node's Corepack can provide it:

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

## Commands

```bash
make help      # List available commands
make install   # Install dependencies
make run       # Start the local Vite server
make test      # Run the regression suite
make build     # Type-check and create a production build
make deploy    # Build and publish to GitHub Pages
```

The tests cover theory helpers, solo-tone roles, common chord voicings, tune editing and persistence, rhythmic scheduling, and voice-leading behaviour.

## Built with

- **React + TypeScript** for the interface and music-domain model.
- **Tone.js** for scale, chord, sequencer, and melody playback.
- **VexFlow** for engraved standard notation.
- **Vite** for development and production builds.
- **Vitest** for regression tests.
- **localStorage** for saved tune snapshots.

## Project philosophy

This is a practice instrument, not a theory textbook. The interface aims to keep every concept audible, playable, and connected to the fretboard. A scale should lead to harmony; harmony should suggest movement; movement should invite a melody.

---

<div align="center">

Built for curious guitarists, late-night changes, and the eternal search for a better voicing.

</div>
