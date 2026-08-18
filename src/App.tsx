import { useMemo, useState } from 'react';
import { RhythmNotation, type Rhythm } from './RhythmNotation';
import { useToneEngine, type Instrument } from './toneEngine';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NATURAL_PITCHES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const SCALES: Record<string, number[]> = {
  'Major (Ionian)': [2, 2, 1, 2, 2, 2, 1],
  'Dorian (D)': [2, 1, 2, 2, 2, 1, 2],
  'Phrygian (E)': [1, 2, 2, 2, 1, 2, 2],
  'Lydian (F)': [2, 2, 2, 1, 2, 2, 1],
  'Mixolydian (G)': [2, 2, 1, 2, 2, 1, 2],
  'Natural Minor (Aeolian)': [2, 1, 2, 2, 1, 2, 2],
  'Locrian (B)': [1, 2, 2, 1, 2, 2, 2],
  Pentatonic: [2, 2, 3, 2, 3],
  'Minor Pentatonic': [3, 2, 2, 3, 2],
  'Harmonic Minor': [2, 1, 2, 2, 1, 3, 1],
};
const OPEN_STRINGS = ['E', 'B', 'G', 'D', 'A', 'E'];
export const DIAGRAM_STRINGS = [...OPEN_STRINGS].reverse();
const STRING_Y = [24, 54, 84, 114, 142, 170];
const FRETS = Array.from({ length: 13 }, (_, i) => i);

type ScaleNote = { pitchClass: string; name: string };
type Chord = { name: string; notes: ScaleNote[]; function?: string };
type SelectedPosition = { id: string; pitchClass: string; midi: number };
export const noteAt = (note: string, semitones: number) => NOTES[(NOTES.indexOf(note) + semitones) % 12];
const pitch = (note: string, octave: number) => 440 * 2 ** ((NOTES.indexOf(note) - 9 + (octave - 4) * 12) / 12);

function accidental(delta: number) {
  return ({ '-2': 'bb', '-1': 'b', '0': '', '1': '#', '2': '##' } as Record<string, string>)[String(delta)] ?? '';
}

export function scaleNotes(root: string, steps: number[], scaleName?: string): ScaleNote[] {
  const rootLetterIndex = LETTERS.indexOf(root[0]);
  const result: ScaleNote[] = [{ pitchClass: root, name: root }]; let current = NOTES.indexOf(root);
  const letterOffsets = scaleName === 'Pentatonic' ? [0, 1, 2, 4, 5, 7] : scaleName === 'Minor Pentatonic' ? [0, 2, 3, 4, 6, 7] : undefined;
  steps.forEach((step, index) => {
    current = (current + step) % 12;
    const letter = LETTERS[(rootLetterIndex + (letterOffsets?.[index + 1] ?? index + 1)) % LETTERS.length];
    const rawDelta = (current - NATURAL_PITCHES[letter] + 18) % 12 - 6;
    result.push({ pitchClass: NOTES[current], name: `${letter}${accidental(rawDelta)}` });
  });
  return result;
}

function chordName(notes: ScaleNote[]) {
  const intervals = notes.slice(1).map(n => (NOTES.indexOf(n.pitchClass) - NOTES.indexOf(notes[0].pitchClass) + 12) % 12);
  const labels: Record<string, string> = { '4,7': '', '3,7': 'm', '3,6': 'o', '4,8': '+', '4,7,11': 'maj7', '3,7,10': 'min7', '4,7,10': '7', '3,6,9': 'dim7', '3,6,10': 'halfdim7', '3,7,11': 'minmaj7', '4,8,11': 'maj7#5', '4,8,10': 'aug7' };
  return `${notes[0].name}${labels[intervals.join(',')] ?? ` (${intervals.join(', ')})`}`;
}

function makeChords(scale: ScaleNote[], size: number = 3): Chord[] {
  const degrees = scale.slice(0, -1);
  return degrees.map((_, degree) => {
    const notes = Array.from({ length: size }, (_, voice) => degrees[(degree + voice * 2) % degrees.length]);
    return { notes, name: chordName(notes) };
  });
}


type Fingering = { frets: Array<number | null>; position: number; coveredNotes: number };
export function commonFingering(chord: Chord): Fingering | null {
  const rootFretAtNut = (NOTES.indexOf(chord.notes[0].pitchClass) - NOTES.indexOf('A') + 12) % 12;
  const rootFret = rootFretAtNut < 2 ? rootFretAtNut + 12 : rootFretAtNut;
  const intervals = chord.notes.map(note => (NOTES.indexOf(note.pitchClass) - NOTES.indexOf(chord.notes[0].pitchClass) + 12) % 12).sort((a, b) => a - b).join(',');
  // Familiar fifth-string-root grips, written low E → high E for the diagram.
  const fullShapes: Record<string, Array<number | null>> = {
    '0,4,7,11': [null, rootFret, rootFret + 2, rootFret + 1, rootFret + 2, rootFret], // maj7
    '0,3,7,10': [null, rootFret, rootFret + 2, rootFret, rootFret + 1, rootFret], // m7
    '0,4,7,10': [null, rootFret, rootFret + 2, rootFret, rootFret + 1, rootFret], // 7
    '0,3,6,10': [null, rootFret, rootFret + 1, rootFret, rootFret + 1, null], // m7♭5
    '0,3,7,11': [null, rootFret, rootFret + 2, rootFret + 1, rootFret + 1, rootFret], // m(maj7)
    '0,4,7': [null, rootFret, rootFret + 2, rootFret + 2, rootFret + 2, rootFret], // major
    '0,3,7': [null, rootFret, rootFret + 2, rootFret + 2, rootFret + 1, rootFret], // minor
  };
  const shape = fullShapes[intervals];
  if (!shape) return null;
  return { frets: shape, position: rootFret, coveredNotes: chord.notes.length };
}
function suggestedFingering(chord: Chord): Fingering {
  const targetNotes = new Set(chord.notes.map(note => note.pitchClass));
  const candidates = Array.from({ length: 10 }, (_, position) => {
    const availableFrets = position === 0 ? [0, 1, 2, 3] : [position, position + 1, position + 2, position + 3];
    const frets = DIAGRAM_STRINGS.map(open => availableFrets.find(fret => targetNotes.has(noteAt(open, fret)) && (fret !== 0 || position === 0)) ?? null);
    const coveredNotes = new Set(frets.flatMap((fret, string) => fret === null ? [] : [noteAt(DIAGRAM_STRINGS[string], fret)])).size;
    const playedStrings = frets.filter(fret => fret !== null).length;
    return { frets, position, coveredNotes, playedStrings };
  });
  const best = candidates.sort((a, b) => b.coveredNotes * 10 + b.playedStrings - (a.coveredNotes * 10 + a.playedStrings) || a.position - b.position)[0];
  return best;
}

function ChordDiagram({ chord }: { chord: Chord }) {
  const commonShape = commonFingering(chord);
  const fingering = commonShape ?? suggestedFingering(chord);
  const startFret = fingering.position === 0 ? 1 : fingering.position;
  return <div className="chord-diagram" aria-label={`${commonShape ? 'Common' : 'Suggested compact'} ${chord.name} fingering at fret ${startFret}`}>
    <svg viewBox="0 0 112 142" role="img" aria-hidden="true">
      <text className="diagram-position" x="2" y="36">{fingering.position === 0 ? 'nut' : `${fingering.position}fr`}</text>
      {Array.from({ length: 6 }, (_, string) => <line className="diagram-string" key={`string-${string}`} x1={16 + string * 16} x2={16 + string * 16} y1="24" y2="120" />)}
      {Array.from({ length: 5 }, (_, fret) => <line className={`diagram-fret ${fingering.position === 0 && fret === 0 ? 'nut' : ''}`} key={`fret-${fret}`} x1="16" x2="96" y1={24 + fret * 24} y2={24 + fret * 24} />)}
      {fingering.frets.map((fret, string) => {
        const x = 16 + string * 16;
        if (fret === null) return <text className="diagram-muted" key={`note-${string}`} x={x} y="16">×</text>;
        if (fret === 0) return <text className="diagram-open" key={`note-${string}`} x={x} y="17">○</text>;
        const row = fingering.position === 0 ? fret - 1 : fret - fingering.position;
        return <g key={`note-${string}`}><circle className="diagram-dot" cx={x} cy={36 + row * 24} r="7" /><text className="diagram-note" x={x} y={40}>{noteAt(DIAGRAM_STRINGS[string], fret)}</text></g>;
      })}
    </svg>
    <strong>{chord.name}</strong><small>{commonShape ? 'common full grip' : 'compact full grip'} · starts at fret {startFret}</small>
  </div>;
}

function Fretboard({ scale, root, highlighted }: { scale: ScaleNote[]; root: string; highlighted: ScaleNote[] | null }) {
  const spelling = new Map(scale.map(note => [note.pitchClass, note.name]));
  const selected = new Set(scale.map(note => note.pitchClass)); const active = new Set((highlighted ?? []).map(note => note.pitchClass));
  return <div className="fretboard-wrap"><svg viewBox="0 0 1200 205" role="img" aria-label="Guitar fretboard">
    <rect className="neck" x="0" y="0" width="1200" height="184" rx="3" />
    {FRETS.map(fret => <line className="fret" key={fret} x1={fret * 100} x2={fret * 100} y1="0" y2="184" />)}
    {STRING_Y.map((y, i) => <line className="string" key={i} x1="0" x2="1200" y1={y} y2={y} />)}
    {[5, 7, 9].map(fret => <text className="fret-label" key={fret} x={fret * 100 - 8} y="202">{fret}</text>)}
    {OPEN_STRINGS.flatMap((open, stringIndex) => FRETS.map(fret => {
      const note = noteAt(open, fret); const x = fret === 0 ? 12 : fret * 100 - 35;
      const state = active.has(note) ? 'active' : note === root ? 'root' : selected.has(note) ? 'selected' : 'muted';
      return <g key={`${stringIndex}-${fret}`}><circle className={`marker ${state}`} cx={x} cy={STRING_Y[stringIndex]} r="16" /><text className={`note ${state}`} x={x} y={STRING_Y[stringIndex] + 5}>{spelling.get(note) ?? note}</text></g>;
    }))}
  </svg></div>;
}

function ChordColumn({ title, chords, onPlay, onAdd }: { title: string; chords: Chord[]; onPlay: (chord: Chord) => void; onAdd?: (chord: Chord) => void }) {
  return <section className="chord-column"><h2>{title}</h2>{chords.map(chord => <div className="chord" key={chord.name}><button onClick={() => onPlay(chord)} aria-label={`Play ${chord.name}`}>Play</button>{onAdd && <button className="add-chord" onClick={() => onAdd(chord)} aria-label={`Add ${chord.name} to sequencer`}>+</button>}<span>{chord.notes.map(note => note.name).join(', ')} – <strong>{chord.name}</strong></span></div>)}</section>;
}

const CHORD_PATTERNS: Array<[number[], string]> = [
  [[0, 7], '5'], [[0, 5, 7], 'sus4'], [[0, 2, 7], 'sus2'], [[0, 3, 6], 'dim'], [[0, 3, 7], 'm'], [[0, 4, 7], ''], [[0, 4, 8], 'aug'],
  [[0, 3, 6, 9], 'dim7'], [[0, 3, 6, 10], 'm7♭5'], [[0, 3, 7, 10], 'm7'], [[0, 3, 7, 11], 'm(maj7)'], [[0, 4, 7, 10], '7'], [[0, 4, 7, 11], 'maj7'], [[0, 4, 8, 10], 'aug7'], [[0, 4, 8, 11], 'maj7#5'],
  [[0, 3, 7, 9], 'm6'], [[0, 4, 7, 9], '6'], [[0, 2, 4, 7], 'add9'], [[0, 2, 4, 7, 10], '9'], [[0, 2, 4, 7, 11], 'maj9'], [[0, 2, 3, 7, 10], 'm9'], [[0, 3, 5, 7, 10], 'm11'], [[0, 4, 5, 7, 10], '11'], [[0, 2, 4, 5, 7, 10], '13'],
  [[0, 1, 4, 7, 10], '7♭9'], [[0, 3, 4, 7, 10], '7♯9'], [[0, 4, 6, 7, 10], '7♯11'], [[0, 4, 7, 8, 10], '7♭13'], [[0, 4, 6, 7, 11], 'maj7♯11'],
];

type ChordMatch = { primary: string; root?: string; suffix?: string; alternatives: string[] };
export function nameSelectedChord(selected: string[], bass?: string): ChordMatch {
  if (selected.length < 2) return { primary: 'Select at least two notes', alternatives: [] };
  const exactCandidates = selected.flatMap(root => {
    const intervals = selected.map(note => (NOTES.indexOf(note) - NOTES.indexOf(root) + 12) % 12).sort((a, b) => a - b);
    const suffix = CHORD_PATTERNS.find(([pattern]) => pattern.length === intervals.length && pattern.every((value, index) => value === intervals[index]))?.[1];
    return suffix === undefined ? [] : [{ root, suffix }];
  });
  if (exactCandidates.length) {
    const [match, ...alternatives] = exactCandidates;
    const primary = `${match.root}${match.suffix}${bass && bass !== match.root ? `/${bass}` : ''}`;
    return { primary, root: match.root, suffix: match.suffix, alternatives: alternatives.map(candidate => `${candidate.root}${candidate.suffix}`) };
  }
  const omittedFifthCandidates = selected.flatMap(root => {
    const intervals = selected.map(note => (NOTES.indexOf(note) - NOTES.indexOf(root) + 12) % 12).sort((a, b) => a - b);
    const suffix = CHORD_PATTERNS.find(([pattern]) => pattern.includes(7) && pattern.length === intervals.length + 1 && intervals.every(value => pattern.includes(value)) && pattern.filter(value => !intervals.includes(value)).join(',') === '7')?.[1];
    return suffix === undefined ? [] : [{ root, suffix: `${suffix}(no5)` }];
  });
  if (omittedFifthCandidates.length) {
    const [match, ...alternatives] = omittedFifthCandidates;
    return { primary: `${match.root}${match.suffix}${bass && bass !== match.root ? `/${bass}` : ''}`, root: match.root, suffix: match.suffix, alternatives: alternatives.map(candidate => `${candidate.root}${candidate.suffix}`) };
  }
  return { primary: 'No common chord match', alternatives: [] };
}

function chordRole(note: string, root?: string) {
  if (!root) return 'tone';
  return ({ 0: 'root', 1: '♭9', 2: '9', 3: '♭3', 4: '3', 5: '11', 6: '♯11', 7: '5', 8: '♭13', 9: '13', 10: '♭7', 11: '7' } as Record<number, string>)[(NOTES.indexOf(note) - NOTES.indexOf(root) + 12) % 12];
}

function ChordNamer({ onPlay, onAdd }: { onPlay: (notes: ScaleNote[]) => void; onAdd: (chord: Chord) => void }) {
  const [selected, setSelected] = useState<SelectedPosition[]>([]);
  const selectedPitchClasses = [...new Set(selected.map(position => position.pitchClass))];
  const bass = selected.length ? selected.reduce((lowest, position) => position.midi < lowest.midi ? position : lowest).pitchClass : undefined;
  const result = useMemo(() => nameSelectedChord(selectedPitchClasses, bass), [selectedPitchClasses, bass]);
  const toggle = (id: string, pitchClass: string, midi: number) => setSelected(current => current.some(position => position.id === id) ? current.filter(position => position.id !== id) : [...current, { id, pitchClass, midi }]);
  const selectedIds = new Set(selected.map(position => position.id));
  const playable = selected.map(position => ({ pitchClass: position.pitchClass, name: position.pitchClass }));
  const chordNotes = result.root ? [result.root, ...selectedPitchClasses.filter(note => note !== result.root)].map(pitchClass => ({ pitchClass, name: pitchClass })) : playable;
  return <main><h1>Chord Namer</h1><p className="intro">Click the notes you are playing. The name updates instantly in your browser.</p>
    <div className="namer-result" aria-live="polite"><span>{selected.length ? `Played: ${[...selected].sort((a, b) => a.midi - b.midi).map(position => position.pitchClass).join(', ')}` : 'No notes selected'}</span><strong>{result.primary}</strong>{bass && result.root && bass !== result.root && <small>Bass note: {bass} · inversion</small>}{selectedPitchClasses.length > 0 && <div className="tone-roles">{selectedPitchClasses.map(note => <span key={note}><b>{note}</b> {chordRole(note, result.root)}</span>)}</div>}{result.alternatives.length > 0 && <small>Also: {result.alternatives.join(' / ')}</small>}</div>
    <div className="fretboard-wrap interactive"><svg viewBox="0 0 1200 205" role="img" aria-label="Interactive guitar fretboard">
      <rect className="neck" x="0" y="0" width="1200" height="184" rx="3" />
      {FRETS.map(fret => <line className="fret" key={fret} x1={fret * 100} x2={fret * 100} y1="0" y2="184" />)}
      {STRING_Y.map((y, i) => <line className="string" key={i} x1="0" x2="1200" y1={y} y2={y} />)}
      {[5, 7, 9].map(fret => <text className="fret-label" key={fret} x={fret * 100 - 8} y="202">{fret}</text>)}
      {OPEN_STRINGS.flatMap((open, stringIndex) => FRETS.map(fret => {
        const note = noteAt(open, fret); const id = `${stringIndex}-${fret}`; const x = fret === 0 ? 12 : fret * 100 - 35; const active = selectedIds.has(id); const midi = [64, 59, 55, 50, 45, 40][stringIndex] + fret;
        return <g className="namer-note" role="button" tabIndex={0} aria-label={`${active ? 'Remove' : 'Add'} ${note}`} key={id} onClick={() => toggle(id, note, midi)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(id, note, midi); } }}><circle className={`marker ${active ? 'active' : 'muted'}`} cx={x} cy={STRING_Y[stringIndex]} r="16" /><text className={`note ${active ? 'active' : 'muted'}`} x={x} y={STRING_Y[stringIndex] + 5}>{note}</text></g>;
      }))}
    </svg></div>
    <div className="namer-actions"><button className="clear" onClick={() => setSelected([])}>Clear notes</button>{selected.length > 1 && <button className="play-selected" onClick={() => onPlay(playable)}>Play selection</button>}{result.root && <button className="add-named-chord" onClick={() => onAdd({ name: result.primary, notes: chordNotes })}>Add to sequencer</button>}</div>
  </main>;
}

function jazzChord(root: string, intervals: number[], suffix: string, harmonicFunction: string): Chord {
  return { name: `${root}${suffix}`, function: harmonicFunction, notes: intervals.map((interval, index) => ({ pitchClass: noteAt(root, interval), name: index === 0 ? root : noteAt(root, interval) })) };
}
const JAZZ_PROGRESSIONS = [
  { label: 'Major ii – V – I', description: 'Essential resolution', build: (root: string) => [jazzChord(noteAt(root, 2), [0, 3, 7, 10], 'm7', 'ii'), jazzChord(noteAt(root, 7), [0, 4, 7, 10], '7', 'V'), jazzChord(root, [0, 4, 7, 11], 'maj7', 'I')] },
  { label: 'Bossa turnaround', description: 'A Jobim-ready cycle', build: (root: string) => [jazzChord(root, [0, 4, 7, 11], 'maj7', 'I'), jazzChord(noteAt(root, 9), [0, 4, 7, 10], '7', 'VI7'), jazzChord(noteAt(root, 2), [0, 3, 7, 10], 'm7', 'ii'), jazzChord(noteAt(root, 7), [0, 4, 7, 10], '7', 'V')] },
  { label: 'Minor iiø – V – i', description: 'Minor-key cadence', build: (root: string) => [jazzChord(noteAt(root, 2), [0, 3, 6, 10], 'm7♭5', 'iiø'), jazzChord(noteAt(root, 7), [0, 4, 7, 10], '7♭9', 'V7♭9'), jazzChord(root, [0, 3, 7, 11], 'm(maj7)', 'i')] },
  { label: 'Backdoor resolution', description: 'Soulful borrowed dominant', build: (root: string) => [jazzChord(noteAt(root, 5), [0, 3, 7, 10], 'm7', 'iv'), jazzChord(noteAt(root, 10), [0, 4, 7, 10], '7', '♭VII7'), jazzChord(root, [0, 4, 7, 11], 'maj7', 'I')] },
  { label: 'Tritone ii – ♭II – I', description: 'Chromatic dominant pull', build: (root: string) => [jazzChord(noteAt(root, 2), [0, 3, 7, 10], 'm7', 'ii'), jazzChord(noteAt(root, 1), [0, 4, 7, 10], '7', 'subV'), jazzChord(root, [0, 4, 7, 11], 'maj7', 'I')] },
  { label: 'Circle of dominants', description: 'Practice the cycle', build: (root: string) => [jazzChord(noteAt(root, 9), [0, 3, 7, 10], 'm7', 'vi'), jazzChord(noteAt(root, 2), [0, 4, 7, 10], '7', 'II7'), jazzChord(noteAt(root, 7), [0, 4, 7, 10], '7', 'V7'), jazzChord(root, [0, 4, 7, 11], 'maj7', 'I')] },
];

function Progressions({ root, onLoad }: { root: string; onLoad: (chords: Chord[]) => void }) {
  return <section className="progressions"><div className="section-title"><div><p className="eyebrow">Jazz vocabulary</p><h2>Practice progressions</h2></div><p>Built in {root}</p></div><div className="progression-grid">{JAZZ_PROGRESSIONS.map(progression => {
    const sequence = progression.build(root);
    return <button className="progression" key={progression.label} onClick={() => onLoad(sequence)}><strong>{progression.label}</strong><span>{sequence.map(chord => chord.name).join('  ·  ')}</span><small>{progression.description}</small></button>;
  })}</div></section>;
}

const DIATONIC_MOVES: Record<number, Array<{ degree: number; label: string; hint: string }>> = {
  0: [{ degree: 1, label: 'ii', hint: 'set up a cadence' }, { degree: 3, label: 'IV', hint: 'open the harmony' }, { degree: 4, label: 'V', hint: 'build tension' }, { degree: 5, label: 'vi', hint: 'soft detour' }],
  1: [{ degree: 4, label: 'V', hint: 'complete ii–V' }, { degree: 0, label: 'I', hint: 'resolve home' }, { degree: 5, label: 'vi', hint: 'continue the circle' }],
  2: [{ degree: 5, label: 'vi', hint: 'circle movement' }, { degree: 3, label: 'IV', hint: 'gentle lift' }, { degree: 1, label: 'ii', hint: 'prepare V' }],
  3: [{ degree: 0, label: 'I', hint: 'plagal return' }, { degree: 1, label: 'ii', hint: 'push to V' }, { degree: 4, label: 'V', hint: 'brighten the pull' }],
  4: [{ degree: 0, label: 'I', hint: 'classic resolution' }, { degree: 5, label: 'vi', hint: 'deceptive turn' }, { degree: 1, label: 'ii', hint: 'keep the cycle moving' }],
  5: [{ degree: 1, label: 'ii', hint: 'circle progression' }, { degree: 3, label: 'IV', hint: 'warm expansion' }, { degree: 4, label: 'V', hint: 'return through tension' }],
  6: [{ degree: 0, label: 'I', hint: 'leading-tone release' }, { degree: 2, label: 'iii', hint: 'soft continuation' }],
};

type HarmonyMode = 'essential' | 'jazz' | 'adventurous';
const HARMONY_MODES: Array<{ value: HarmonyMode; label: string; description: string }> = [
  { value: 'essential', label: 'Essential', description: 'diatonic movement' },
  { value: 'jazz', label: 'Jazz', description: 'dominants & bossa colour' },
  { value: 'adventurous', label: 'Adventurous', description: 'borrowed & altered routes' },
];
const movementMood = (degree: number) => degree === 0 ? 'resolve' : degree === 4 ? 'tension' : degree === 5 ? 'surprise' : 'flow';

function HarmonicMap({ root, chords, onAdd }: { root: string; chords: Chord[]; onAdd: (chords: Chord[]) => void }) {
  const [activeDegree, setActiveDegree] = useState(0);
  const [mode, setMode] = useState<HarmonyMode>('jazz');
  const [route, setRoute] = useState<Chord[]>([]);
  if (chords.length !== 7) return <section className="harmony-map"><p className="eyebrow">Harmonic map</p><h2>Choose a seven-note scale</h2><p>Switch to a major or modal scale to explore key-aware chord paths.</p></section>;
  const moves = DIATONIC_MOVES[activeDegree];
  const colourMoves = [
    { label: 'V/ii → ii', hint: 'secondary dominant', mood: 'tension', target: 1, chords: [jazzChord(noteAt(root, 9), [0, 4, 7, 10], '7', 'V/ii'), chords[1]] },
    { label: 'V/V → V', hint: 'turn up the dominant', mood: 'tension', target: 4, chords: [jazzChord(noteAt(root, 2), [0, 4, 7, 10], '7', 'V/V'), chords[4]] },
    { label: 'iv → I', hint: 'borrowed bossa colour', mood: 'surprise', target: 0, chords: [jazzChord(noteAt(root, 5), [0, 3, 7, 10], 'm7', 'iv'), chords[0]] },
    { label: 'subV → I', hint: 'tritone substitution', mood: 'surprise', target: 0, chords: [jazzChord(noteAt(root, 1), [0, 4, 7, 10], '7', 'subV'), chords[0]] },
    { label: 'iv → ♭VII → I', hint: 'backdoor resolution', mood: 'tension', target: 0, chords: [jazzChord(noteAt(root, 5), [0, 3, 7, 10], 'm7', 'iv'), jazzChord(noteAt(root, 10), [0, 4, 7, 10], '7', '♭VII7'), chords[0]] },
  ];
  const availableColourMoves = mode === 'essential' ? [] : colourMoves.slice(0, mode === 'jazz' ? 3 : 5);
  const appendRoute = (next: Chord[], target: number) => { setRoute(current => current.length ? [...current, ...next] : [chords[activeDegree], ...next]); setActiveDegree(target); };
  return <section className="harmony-map"><div className="map-top"><div className="section-title"><div><p className="eyebrow">Harmonic map</p><h2>Follow the next chord</h2></div><p>Build a route in {root}, then send it to your sequencer.</p></div><div className="music-motif" aria-hidden="true">♪ ♫ ♪</div></div>
    <div className="harmony-modes" role="group" aria-label="Harmony complexity">{HARMONY_MODES.map(option => <button key={option.value} className={mode === option.value ? 'active' : ''} onClick={() => setMode(option.value)}><strong>{option.label}</strong><small>{option.description}</small></button>)}</div>
    <div className="degree-rail">{chords.map((chord, degree) => <button className={degree === activeDegree ? 'active' : ''} key={chord.name} onClick={() => setActiveDegree(degree)}><small>{['I', 'ii', 'iii', 'IV', 'V', 'vi', 'viiø'][degree]}</small><strong>{chord.name}</strong></button>)}</div>
    <div className="route-builder"><div><p className="eyebrow">Your route</p><div className="route-pills">{route.length ? route.map((chord, index) => <span key={`${chord.name}-${index}`}>{index > 0 && <b>→</b>}{chord.name}</span>) : <em>Select a chord above, then choose a move.</em>}</div></div><div className="route-actions"><button className="clear" disabled={!route.length} onClick={() => setRoute([])}>Clear route</button><button className="play-selected" disabled={!route.length} onClick={() => { onAdd(route); setRoute([]); }}>Add route to sequencer</button></div></div>
    <div className="map-content"><div><p className="map-label">From <strong>{chords[activeDegree].name}</strong> · diatonic choices</p><div className="move-grid">{moves.map(move => <button className={`harmonic-move ${movementMood(move.degree)}`} key={move.label} onClick={() => appendRoute([chords[move.degree]], move.degree)}><span>{chords[activeDegree].name} <b>→</b> {chords[move.degree].name}</span><small><i>{movementMood(move.degree)}</i>{move.label} · {move.hint}</small></button>)}</div></div>{availableColourMoves.length > 0 && <div><p className="map-label">Colour moves</p><div className="move-grid colour-moves">{availableColourMoves.map(move => <button className={`harmonic-move ${move.mood}`} key={move.label} onClick={() => appendRoute(move.chords, move.target)}><span>{move.chords.map(chord => chord.name).join(' → ')}</span><small><i>{move.mood}</i>{move.label} · {move.hint}</small></button>)}</div></div>}</div>
  </section>;
}

function Sequencer({ chords, bpm, isLooping, rhythm, onTempo, onRhythm, onPlay, onStop, onRemove, onClear }: { chords: Chord[]; bpm: number; isLooping: boolean; rhythm: Rhythm; onTempo: (bpm: number) => void; onRhythm: (value: Rhythm) => void; onPlay: () => void; onStop: () => void; onRemove: (index: number) => void; onClear: () => void }) {
  return <section className="sequencer"><div className="section-title sequencer-heading"><div><p className="eyebrow">Practice station</p><h2>Voice-led sequencer</h2><p>Each new chord is placed near the last one for smoother comping.</p></div><label>Tempo <output>{bpm} BPM</output><input aria-label="Tempo" type="range" min="60" max="180" value={bpm} onChange={event => onTempo(Number(event.target.value))} /></label></div>
    <div className="performance-controls"><label>Feel<select value={rhythm} onChange={event => onRhythm(event.target.value as Rhythm)}><option value="bossa">Bossa nova</option><option value="samba">Samba</option><option value="swing">Swing</option><option value="straight">Straight pulses</option></select></label><RhythmNotation rhythm={rhythm} /><span className="rhythm-note">{rhythm === 'straight' ? 'One chord per bar' : 'Syncopated chord hits + bass pulse'}</span></div>
    <div className="sequence-steps">{chords.length ? chords.map((chord, index) => <button className="sequence-step" key={`${chord.name}-${index}`} onClick={() => onRemove(index)} title="Remove chord"><span>{index + 1}</span><div><strong>{chord.name}</strong><small>{chord.function ?? 'added chord'}</small></div></button>) : <p className="sequence-empty">Load a jazz progression, or add a chord from either column above.</p>}</div>
    {chords.length > 0 && <div className="fingering-panel"><div><p className="eyebrow">Suggested shapes</p><h3>Fingerings for this loop</h3><p>Common full-chord shapes. Click a sequence step above to remove it.</p></div><div className="diagram-row">{chords.map((chord, index) => <ChordDiagram key={`${chord.name}-diagram-${index}`} chord={chord} />)}</div></div>}
    <div className="sequencer-actions"><button className="play-selected" disabled={!chords.length} onClick={onPlay}>{isLooping ? 'Restart loop' : 'Start loop'}</button><button className="clear" disabled={!isLooping} onClick={onStop}>Stop</button><button className="clear" disabled={!chords.length} onClick={onClear}>Clear</button></div>
  </section>;
}

function SoundOverlay({ instrument, reverb, onInstrument, onReverb, onClose }: { instrument: Instrument; reverb: number; onInstrument: (instrument: Instrument) => void; onReverb: (amount: number) => void; onClose: () => void }) {
  return <div className="sound-backdrop" role="presentation" onMouseDown={onClose}><section className="sound-overlay" role="dialog" aria-modal="true" aria-label="Sound settings" onMouseDown={event => event.stopPropagation()}><button className="sound-close" onClick={onClose} aria-label="Close sound settings">×</button><p className="eyebrow">Sound settings</p><h2>Shape the accompaniment</h2><label>Instrument<select value={instrument} onChange={event => onInstrument(event.target.value as Instrument)}><option value="nylon">Nylon guitar</option><option value="electric">Electric guitar</option><option value="organ">Jazz organ</option></select></label><label>Reverb <output>{Math.round(reverb * 100)}%</output><input aria-label="Reverb mix" type="range" min="0" max="0.75" step="0.05" value={reverb} onChange={event => onReverb(Number(event.target.value))} /></label><p className="sound-hint">Applies to scales, chords, and sequencer playback.</p></section></div>;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'scales' | 'namer'>('scales');
  const [root, setRoot] = useState('C'); const [scaleName, setScaleName] = useState('Major (Ionian)'); const [highlighted, setHighlighted] = useState<ScaleNote[] | null>(null);
  const [sequence, setSequence] = useState<Chord[]>([]); const [bpm, setBpm] = useState(96); const [isLooping, setIsLooping] = useState(false); const [rhythm, setRhythm] = useState<Rhythm>('bossa'); const [instrument, setInstrument] = useState<Instrument>('nylon'); const [reverb, setReverb] = useState(0.2); const [soundOpen, setSoundOpen] = useState(false);
  const engine = useToneEngine(instrument, reverb);
  const notes = useMemo(() => scaleNotes(root, SCALES[scaleName], scaleName), [root, scaleName]);
  const triads = useMemo(() => makeChords(notes), [notes]); const tetrads = useMemo(() => makeChords(notes, 4), [notes]);
  const stopLoop = () => { engine.stop(); setIsLooping(false); };
  const change = (nextRoot: string, nextScale: string) => { stopLoop(); setRoot(nextRoot); setScaleName(nextScale); setHighlighted(null); setSequence([]); };
  const playChord = (chord: Chord) => { setHighlighted(chord.notes); void engine.playChord(chord.notes); };
  const startLoop = () => { if (sequence.length) { void engine.playLoop(sequence, bpm, rhythm); setIsLooping(true); } };
  const changeRhythm = (nextRhythm: Rhythm) => { setRhythm(nextRhythm); if (isLooping && sequence.length) void engine.playLoop(sequence, bpm, nextRhythm); };
  const changeInstrument = (nextInstrument: Instrument) => { stopLoop(); setInstrument(nextInstrument); };
  return <><header><a className="brand" href="/guitarscales/">Music Tools</a><nav><button className={`tab ${activeTab === 'scales' ? 'current' : ''}`} onClick={() => setActiveTab('scales')}>Practice</button><button className={`tab ${activeTab === 'namer' ? 'current' : ''}`} onClick={() => setActiveTab('namer')}>Chord Namer</button><button className="sound-button" onClick={() => setSoundOpen(true)}>Settings</button><a className="nav-item" href="https://github.com/fcaldas" target="_blank" rel="noreferrer">GitHub</a></nav></header>
    {soundOpen && <SoundOverlay instrument={instrument} reverb={reverb} onInstrument={changeInstrument} onReverb={setReverb} onClose={() => setSoundOpen(false)} />}
    {activeTab === 'namer' ? <ChordNamer onPlay={notes => void engine.playChord(notes)} onAdd={chord => setSequence(current => [...current, chord])} /> : <main><section className="hero"><p className="eyebrow">Guitar harmony, in motion</p><h1>Bossa nova &amp; jazz practice lab</h1><p>Explore the neck, hear rich harmony, and build voice-led comping loops.</p></section><div className="controls"><label>Key centre<select value={root} onChange={event => change(event.target.value, scaleName)}>{NOTES.map(note => <option key={note}>{note}</option>)}</select></label><label>Scale colour<select value={scaleName} onChange={event => change(root, event.target.value)}>{Object.keys(SCALES).map(name => <option key={name}>{name}</option>)}</select></label><button className="play-scale" onClick={() => void engine.playScale(notes)} aria-label="Play scale">▶</button></div>
      <Fretboard scale={notes} root={root} highlighted={highlighted} />
      <div className="chords"><ChordColumn title="Triads in scale" chords={triads} onPlay={playChord} onAdd={chord => setSequence(current => [...current, chord])} /><ChordColumn title="Tetrads in scale" chords={tetrads} onPlay={playChord} onAdd={chord => setSequence(current => [...current, chord])} /></div>
      <HarmonicMap root={root} chords={tetrads} onAdd={chords => { stopLoop(); setSequence(current => [...current, ...chords]); }} />
      <Progressions root={root} onLoad={chords => { stopLoop(); setSequence(chords); }} />
      <Sequencer chords={sequence} bpm={bpm} isLooping={isLooping} rhythm={rhythm} onTempo={setBpm} onRhythm={changeRhythm} onPlay={startLoop} onStop={stopLoop} onRemove={index => setSequence(current => current.filter((_, chordIndex) => chordIndex !== index))} onClear={() => { stopLoop(); setSequence([]); }} />
    </main>}</>;
}
