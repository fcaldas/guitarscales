const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** Diagram data is always ordered from the lowest-pitched string to the highest. */
export const DIAGRAM_STRINGS = ['E', 'A', 'D', 'G', 'B', 'E'] as const;

export type ChordLike = {
  name: string;
  notes: Array<{ pitchClass: string; name: string }>;
};

export type Fingering = {
  id: string;
  label: string;
  frets: Array<number | null>;
  position: number;
  coveredNotes: number;
  source: 'curated' | 'fallback';
};

export const noteAt = (note: string, semitones: number) =>
  PITCH_CLASSES[(PITCH_CLASSES.indexOf(note) + semitones) % 12];

const qualityKey = (chord: ChordLike) => {
  const root = PITCH_CLASSES.indexOf(chord.notes[0].pitchClass);
  return [...new Set(chord.notes.map(note => (PITCH_CLASSES.indexOf(note.pitchClass) - root + 12) % 12))]
    .sort((a, b) => a - b)
    .join(',');
};

const positionFor = (frets: Array<number | null>) => {
  if (frets.includes(0)) return 0;
  return Math.min(...frets.filter((fret): fret is number => fret !== null));
};

const makeFingering = (
  id: string,
  label: string,
  frets: Array<number | null>,
  source: Fingering['source'] = 'curated',
): Fingering => ({
  id,
  label,
  frets,
  position: positionFor(frets),
  coveredNotes: new Set(
    frets.flatMap((fret, string) => fret === null ? [] : [noteAt(DIAGRAM_STRINGS[string], fret)]),
  ).size,
  source,
});

const OPEN_SHAPES: Record<string, Partial<Record<string, Array<number | null>>>> = {
  '0,4,7': {
    C: [null, 3, 2, 0, 1, 0], D: [null, null, 0, 2, 3, 2], E: [0, 2, 2, 1, 0, 0],
    G: [3, 2, 0, 0, 0, 3], A: [null, 0, 2, 2, 2, 0],
  },
  '0,3,7': {
    D: [null, null, 0, 2, 3, 1], E: [0, 2, 2, 0, 0, 0], A: [null, 0, 2, 2, 1, 0],
  },
  '0,4,7,10': {
    A: [null, 0, 2, 0, 2, 0], B: [null, 2, 1, 2, 0, 2], C: [null, 3, 2, 3, 1, 3],
    D: [null, null, 0, 2, 1, 2], E: [0, 2, 0, 1, 0, 0], G: [3, 2, 0, 0, 0, 1],
  },
  '0,4,7,11': {
    A: [null, 0, 2, 1, 2, 0], C: [null, 3, 2, 0, 0, 0], D: [null, null, 0, 2, 2, 2],
    E: [0, 2, 1, 1, 0, 0], F: [null, null, 3, 2, 1, 0], G: [3, 2, 0, 0, 0, 2],
  },
  '0,3,7,10': {
    A: [null, 0, 2, 0, 1, 0], D: [null, null, 0, 2, 1, 1], E: [0, 2, 0, 0, 0, 0],
  },
};

type ShapeTemplate = {
  id: string;
  label: string;
  rootString: 0 | 1;
  offsets: Array<number | null>;
  minRootFret?: number;
};

// These are established movable grips. Offsets are relative to the root on
// either the sixth (low E) or fifth (A) string, still stored low E -> high E.
const MOVABLE_SHAPES: Record<string, ShapeTemplate[]> = {
  '0,4,7': [
    { id: 'a-major', label: '5th-string root', rootString: 1, offsets: [null, 0, 2, 2, 2, 0] },
    { id: 'e-major', label: '6th-string root', rootString: 0, offsets: [0, 2, 2, 1, 0, 0] },
  ],
  '0,3,7': [
    { id: 'a-minor', label: '5th-string root', rootString: 1, offsets: [null, 0, 2, 2, 1, 0] },
    { id: 'e-minor', label: '6th-string root', rootString: 0, offsets: [0, 2, 2, 0, 0, 0] },
  ],
  '0,4,7,10': [
    { id: 'a-7', label: '5th-string root', rootString: 1, offsets: [null, 0, 2, 0, 2, 0] },
    { id: 'e-7', label: '6th-string root', rootString: 0, offsets: [0, 2, 0, 1, 0, 0] },
  ],
  '0,4,7,11': [
    { id: 'a-maj7', label: '5th-string root', rootString: 1, offsets: [null, 0, 2, 1, 2, 0] },
    { id: 'e-maj7', label: '6th-string root', rootString: 0, offsets: [0, null, 1, 1, 0, 0] },
  ],
  '0,3,7,10': [
    { id: 'a-m7', label: '5th-string root', rootString: 1, offsets: [null, 0, 2, 0, 1, 0] },
    { id: 'e-m7', label: '6th-string root', rootString: 0, offsets: [0, 2, 0, 0, 0, 0] },
  ],
  '0,3,6,10': [
    { id: 'a-m7b5', label: '5th-string root', rootString: 1, offsets: [null, 0, 1, 0, 1, null] },
    { id: 'e-m7b5', label: '6th-string root', rootString: 0, offsets: [0, null, 0, 0, -1, null], minRootFret: 2 },
  ],
  '0,3,7,11': [
    { id: 'a-mmaj7', label: '5th-string root', rootString: 1, offsets: [null, 0, 2, 1, 1, 0] },
    { id: 'e-mmaj7', label: '6th-string root', rootString: 0, offsets: [0, 2, 1, 0, 0, 0] },
  ],
  '0,3,6': [
    { id: 'a-dim', label: '5th-string root', rootString: 1, offsets: [null, 0, 1, 2, 1, null] },
  ],
  '0,4,8': [
    { id: 'a-aug', label: '5th-string root', rootString: 1, offsets: [null, 0, 3, 2, 2, 1] },
    { id: 'e-aug', label: '6th-string root', rootString: 0, offsets: [0, 3, 2, 1, 1, 0] },
  ],
  '0,3,6,9': [
    { id: 'a-dim7', label: 'Diminished grip', rootString: 1, offsets: [null, 0, 1, -1, 1, null], minRootFret: 2 },
  ],
  '0,4,8,11': [
    { id: 'a-maj7s5', label: '5th-string root', rootString: 1, offsets: [null, 0, 3, 1, 2, 1] },
  ],
  '0,4,8,10': [
    { id: 'a-aug7', label: 'Compact altered grip', rootString: 1, offsets: [null, 0, 3, 0, 2, null] },
  ],
};

const rootFret = (root: string, open: string, minimum: number) => {
  let fret = (PITCH_CLASSES.indexOf(root) - PITCH_CLASSES.indexOf(open) + 12) % 12;
  while (fret < minimum) fret += 12;
  return fret;
};

const usesExactlyChordNotes = (chord: ChordLike, fingering: Fingering) => {
  const target = new Set(chord.notes.map(note => note.pitchClass));
  const played = fingering.frets.flatMap((fret, string) =>
    fret === null ? [] : [noteAt(DIAGRAM_STRINGS[string], fret)],
  );
  return played.every(note => target.has(note)) && [...target].every(note => played.includes(note));
};

const movableFingering = (root: string, template: ShapeTemplate) => {
  const base = rootFret(root, DIAGRAM_STRINGS[template.rootString], template.minRootFret ?? 1);
  const frets = template.offsets.map(offset => offset === null ? null : base + offset);
  if (frets.some(fret => fret !== null && (fret < 0 || fret > 15))) return null;
  return makeFingering(`${template.id}-${base}`, template.label, frets);
};

/** A constrained fallback: complete chord tones, max four-fret span, no isolated string islands. */
export function suggestedFingering(chord: ChordLike, excluded: string[] = []): Fingering {
  const target = new Set(chord.notes.map(note => note.pitchClass));
  const candidates: Array<Fingering & { score: number }> = [];

  for (let position = 0; position <= 12; position += 1) {
    const available = DIAGRAM_STRINGS.map(open => {
      const values = Array.from({ length: 4 }, (_, offset) => position + offset)
        .filter(fret => fret <= 15 && target.has(noteAt(open, fret)) && (position === 0 || fret > 0));
      return [null, ...values] as Array<number | null>;
    });

    const visit = (string: number, frets: Array<number | null>) => {
      if (string < DIAGRAM_STRINGS.length) {
        available[string].forEach(fret => visit(string + 1, [...frets, fret]));
        return;
      }
      const signature = frets.map(fret => fret ?? 'x').join('-');
      if (excluded.includes(signature)) return;
      const playedStrings = frets.flatMap((fret, index) => fret === null ? [] : [index]);
      if (playedStrings.length < target.size || playedStrings.length > 5) return;
      const first = Math.min(...playedStrings); const last = Math.max(...playedStrings);
      const internalMutes = frets.slice(first, last + 1).filter(fret => fret === null).length;
      if (internalMutes > 1) return;
      const fingering = makeFingering(`compact-${signature}`, 'Compact alternative', frets, 'fallback');
      if (!usesExactlyChordNotes(chord, fingering)) return;
      const sounding = frets.map((fret, index) => fret === null ? null : noteAt(DIAGRAM_STRINGS[index], fret));
      const rootInBass = sounding[first] === chord.notes[0].pitchClass;
      const fretted = frets.filter((fret): fret is number => fret !== null && fret > 0);
      const span = fretted.length ? Math.max(...fretted) - Math.min(...fretted) : 0;
      const score = (rootInBass ? 30 : 0) + playedStrings.length * 4 - internalMutes * 8 - span * 3 - position;
      candidates.push({ ...fingering, score });
    };
    visit(0, []);
  }

  const best = candidates.sort((a, b) => b.score - a.score)[0];
  if (best) return best;
  // This should only be reachable for unusual six-note chords. It remains
  // honest by muting strings rather than adding pitches outside the chord.
  const frets = DIAGRAM_STRINGS.map(open => {
    for (let fret = 0; fret <= 12; fret += 1) if (target.has(noteAt(open, fret))) return fret;
    return null;
  });
  return makeFingering('fallback-last-resort', 'Suggested shape', frets, 'fallback');
}

export function chordVoicings(chord: ChordLike): Fingering[] {
  if (!chord.notes.length) return [];
  const quality = qualityKey(chord);
  const root = chord.notes[0].pitchClass;
  const voicings: Fingering[] = [];
  const open = OPEN_SHAPES[quality]?.[root];
  if (open) voicings.push(makeFingering(`open-${quality}-${root}`, 'Open position', open));

  for (const template of MOVABLE_SHAPES[quality] ?? []) {
    const fingering = movableFingering(root, template);
    if (fingering && usesExactlyChordNotes(chord, fingering)) voicings.push(fingering);
  }

  const unique = voicings.filter((fingering, index) =>
    voicings.findIndex(other => other.frets.join(',') === fingering.frets.join(',')) === index,
  );
  if (unique.length < 2) {
    const excluded = unique.map(fingering => fingering.frets.map(fret => fret ?? 'x').join('-'));
    const fallback = suggestedFingering(chord, excluded);
    if (!unique.some(fingering => fingering.frets.join(',') === fallback.frets.join(','))) unique.push(fallback);
  }
  return unique.sort((a, b) => {
    if (a.label === 'Open position') return -1;
    if (b.label === 'Open position') return 1;
    return a.position - b.position || b.frets.filter(fret => fret !== null).length - a.frets.filter(fret => fret !== null).length;
  }).slice(0, 3);
}

export function commonFingering(chord: ChordLike): Fingering | null {
  return chordVoicings(chord)[0] ?? null;
}

export function fingeringNotes(fingering: Fingering) {
  return fingering.frets.map((fret, string) => fret === null ? 'x' : noteAt(DIAGRAM_STRINGS[string], fret));
}
