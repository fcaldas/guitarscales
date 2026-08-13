# Guitar Scale Explorer

A React/Vite guitar-harmony practice tool for bossa nova and jazz. Explore scales across the neck, identify chords, build progressions, and hear voice-led comping loops.

## Features

- Diatonic triads and tetrads for every selected scale.
- Interactive chord namer.
- Jazz and bossa nova progression presets, including ii–V–I, bossa turnarounds, backdoor resolutions, and tritone substitutions.
- Chord sequencer with full chord voicings and straight or bossa-nova feel.
- Common movable jazz-comping shapes with readable low-E-to-high-E chord diagrams.

## Local development

Install [Node.js](https://nodejs.org/) (LTS) and pnpm, then run:

```bash
make install
make run
```

Open the URL printed by Vite (normally `http://localhost:5173`).

## Quality checks

```bash
make test
make build
```

`make test` runs the regression suite covering chord-diagram string order, common chord shapes, and voice-leading output.

## Deploy

```bash
make deploy
```

This builds the app and publishes it to GitHub Pages: <https://fcaldas.github.io/guitarscales/>.
