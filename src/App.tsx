import { useEffect, useMemo, useRef, useState } from 'react';
import * as Tone from 'tone';

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
  'Harmonic Minor': [2, 1, 2, 2, 1, 3, 1],
};
const OPEN_STRINGS = ['E', 'B', 'G', 'D', 'A', 'E'];
export const DIAGRAM_STRINGS = [...OPEN_STRINGS].reverse();
const STRING_Y = [24, 54, 84, 114, 142, 170];
const FRETS = Array.from({ length: 13 }, (_, i) => i);

type ScaleNote = { pitchClass: string; name: string };
type Chord = { name: string; notes: ScaleNote[]; function?: string };
type Voicing = 'full' | 'shell' | 'rootless';
type Rhythm = 'straight' | 'bossa';
type SelectedPosition = { id: string; pitchClass: string };
export const noteAt = (note: string, semitones: number) => NOTES[(NOTES.indexOf(note) + semitones) % 12];
const pitch = (note: string, octave: number) => 440 * 2 ** ((NOTES.indexOf(note) - 9 + (octave - 4) * 12) / 12);

function accidental(delta: number) {
  return ({ '-2': 'bb', '-1': 'b', '0': '', '1': '#', '2': '##' } as Record<string, string>)[String(delta)] ?? '';
}

function scaleNotes(root: string, steps: number[]): ScaleNote[] {
  const rootLetterIndex = LETTERS.indexOf(root[0]);
  const result: ScaleNote[] = [{ pitchClass: root, name: root }]; let current = NOTES.indexOf(root);
  steps.forEach((step, index) => {
    current = (current + step) % 12;
    const letter = LETTERS[(rootLetterIndex + index + 1) % LETTERS.length];
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

const toToneNote = (note: ScaleNote, index: number) => `${note.pitchClass}${3 + Math.floor(index / 2)}`;
function notesForVoicing(chord: Chord, voicing: Voicing) {
  if (voicing === 'shell') return chord.notes.length > 3 ? [chord.notes[0], chord.notes[1], chord.notes[3]] : chord.notes;
  if (voicing === 'rootless') return chord.notes.length > 3 ? chord.notes.slice(1) : chord.notes.slice(1);
  return chord.notes;
}
export function voiceLead(chords: Chord[], voicing: Voicing) {
  let previous: number[] = [];
  return chords.map(chord => {
    const pitches = notesForVoicing(chord, voicing).map(note => NOTES.indexOf(note.pitchClass)).sort((a, b) => a - b);
    const voiced = pitches.map((pitchClass, index) => {
      const candidates = [-1, 0, 1, 2].map(octave => 48 + pitchClass + octave * 12);
      const target = previous[index] ?? (55 + index * 4);
      return candidates.reduce((closest, candidate) => Math.abs(candidate - target) < Math.abs(closest - target) ? candidate : closest);
    }).sort((a, b) => a - b);
    previous = voiced;
    return voiced.map(value => `${NOTES[value % 12]}${Math.floor(value / 12) - 1}`);
  });
}

type Fingering = { frets: Array<number | null>; position: number; coveredNotes: number };
export function commonFingering(chord: Chord): Fingering | null {
  const rootFret = (NOTES.indexOf(chord.notes[0].pitchClass) - NOTES.indexOf('A') + 12) % 12;
  const intervals = chord.notes.map(note => (NOTES.indexOf(note.pitchClass) - NOTES.indexOf(chord.notes[0].pitchClass) + 12) % 12).sort((a, b) => a - b).join(',');
  // Familiar fifth-string-root grips, written low E → high E for the diagram.
  const shapes: Record<string, Array<number | null>> = {
    '0,4,7,11': [null, rootFret, rootFret + 2, rootFret + 1, rootFret + 2, rootFret], // maj7
    '0,3,7,10': [null, rootFret, rootFret + 2, rootFret, rootFret + 1, rootFret], // m7
    '0,4,7,10': [null, rootFret, rootFret + 2, rootFret, rootFret + 1, rootFret], // 7
    '0,3,6,10': [null, rootFret, rootFret + 1, rootFret, rootFret + 1, null], // m7♭5
    '0,3,7,11': [null, rootFret, rootFret + 2, rootFret + 1, rootFret + 1, rootFret], // m(maj7)
    '0,4,7': [null, rootFret, rootFret + 2, rootFret + 2, rootFret + 2, rootFret], // major
    '0,3,7': [null, rootFret, rootFret + 2, rootFret + 2, rootFret + 1, rootFret], // minor
  };
  const shape = shapes[intervals];
  if (!shape) return null;
  return { frets: shape, position: rootFret === 0 ? 0 : rootFret, coveredNotes: chord.notes.length };
}
function suggestedFingering(chord: Chord, voicing: Voicing): Fingering {
  const targetNotes = new Set(notesForVoicing(chord, voicing).map(note => note.pitchClass));
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

function ChordDiagram({ chord, voicing }: { chord: Chord; voicing: Voicing }) {
  const commonShape = commonFingering(chord);
  const fingering = commonShape ?? suggestedFingering(chord, voicing);
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
    <strong>{chord.name}</strong><small>{commonShape ? 'common comping grip' : 'compact fallback'} · starts at fret {startFret}</small>
  </div>;
}

function useToneEngine() {
  const synth = useRef<Tone.PolySynth | null>(null);
  const sequence = useRef<Tone.Part | null>(null);

  const start = async () => {
    await Tone.start();
    if (!synth.current) {
      synth.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.015, decay: 0.12, sustain: 0.35, release: 1.1 },
      }).toDestination();
      synth.current.volume.value = -8;
    }
    return synth.current;
  };

  const stop = () => {
    sequence.current?.dispose();
    sequence.current = null;
    const transport = Tone.getTransport();
    transport.stop();
    transport.cancel();
    transport.position = 0;
  };

  const playChord = async (notes: ScaleNote[], voicing: Voicing = 'full') => {
    const instrument = await start();
    instrument.triggerAttackRelease(notesForVoicing({ name: '', notes }, voicing).map(toToneNote), '2n', Tone.now());
  };

  const playLoop = async (chords: Chord[], bpm: number, voicing: Voicing, rhythm: Rhythm) => {
    const instrument = await start();
    stop();
    const transport = Tone.getTransport();
    transport.bpm.value = bpm;
    transport.loop = true;
    transport.loopStart = 0;
    transport.loopEnd = `${chords.length}m`;
    const voiced = voiceLead(chords, voicing);
    const hits = rhythm === 'bossa' ? ['0:0', '0:1:2', '0:2:2', '0:3:2'] : ['0:0'];
    sequence.current = new Tone.Part<{ time: string; notes: string[]; bass?: string }>((time, event) => {
      instrument.triggerAttackRelease(event.notes, rhythm === 'bossa' ? '8n' : '2n', time);
      if (event.bass) instrument.triggerAttackRelease(event.bass, '8n', time, 0.7);
    }, chords.flatMap((chord, index) => hits.map((hit, hitIndex) => ({ time: `${index}:${hit.slice(2)}`, notes: voiced[index], bass: rhythm === 'bossa' && (hitIndex === 0 || hitIndex === 2) ? `${chord.notes[0].pitchClass}2` : undefined }))));
    sequence.current.start(0);
    transport.start('+0.05');
  };

  useEffect(() => () => { stop(); synth.current?.dispose(); }, []);
  return { playChord, playLoop, stop };
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
  [[0, 3, 7, 9], 'm6'], [[0, 4, 7, 9], '6'], [[0, 2, 4, 7], 'add9'], [[0, 2, 4, 7, 10], '9'], [[0, 2, 4, 7, 11], 'maj9'], [[0, 2, 3, 7, 10], 'm9'], [[0, 4, 5, 7, 10], '11'], [[0, 2, 4, 5, 7, 10], '13'],
];

function nameSelectedChord(selected: string[]) {
  if (selected.length < 2) return { primary: 'Select at least two notes', alternatives: [] as string[] };
  const exactCandidates = selected.flatMap(root => {
    const intervals = selected.map(note => (NOTES.indexOf(note) - NOTES.indexOf(root) + 12) % 12).sort((a, b) => a - b);
    const suffix = CHORD_PATTERNS.find(([pattern]) => pattern.length === intervals.length && pattern.every((value, index) => value === intervals[index]))?.[1];
    return suffix === undefined ? [] : [`${root}${suffix}`];
  });
  if (exactCandidates.length) return { primary: exactCandidates[0], alternatives: exactCandidates.slice(1) };
  const omittedFifthCandidates = selected.flatMap(root => {
    const intervals = selected.map(note => (NOTES.indexOf(note) - NOTES.indexOf(root) + 12) % 12).sort((a, b) => a - b);
    const suffix = CHORD_PATTERNS.find(([pattern]) => pattern.includes(7) && pattern.length === intervals.length + 1 && intervals.every(value => pattern.includes(value)) && pattern.filter(value => !intervals.includes(value)).join(',') === '7')?.[1];
    return suffix === undefined ? [] : [`${root}${suffix}(no5)`];
  });
  return omittedFifthCandidates.length ? { primary: omittedFifthCandidates[0], alternatives: omittedFifthCandidates.slice(1) } : { primary: 'No common chord match', alternatives: [] as string[] };
}

function ChordNamer({ onPlay }: { onPlay: (notes: ScaleNote[]) => void }) {
  const [selected, setSelected] = useState<SelectedPosition[]>([]);
  const selectedPitchClasses = [...new Set(selected.map(position => position.pitchClass))];
  const result = useMemo(() => nameSelectedChord(selectedPitchClasses), [selectedPitchClasses]);
  const toggle = (id: string, pitchClass: string) => setSelected(current => current.some(position => position.id === id) ? current.filter(position => position.id !== id) : [...current, { id, pitchClass }]);
  const selectedIds = new Set(selected.map(position => position.id));
  const playable = selected.map(position => ({ pitchClass: position.pitchClass, name: position.pitchClass }));
  return <main><h1>Chord Namer</h1><p className="intro">Click the notes you are playing. The name updates instantly in your browser.</p>
    <div className="namer-result" aria-live="polite"><span>{selected.length ? `Notes: ${selected.map(position => position.pitchClass).join(', ')}` : 'No notes selected'}</span><strong>{result.primary}</strong>{result.alternatives.length > 0 && <small>Also: {result.alternatives.join(' / ')}</small>}</div>
    <div className="fretboard-wrap interactive"><svg viewBox="0 0 1200 205" role="img" aria-label="Interactive guitar fretboard">
      <rect className="neck" x="0" y="0" width="1200" height="184" rx="3" />
      {FRETS.map(fret => <line className="fret" key={fret} x1={fret * 100} x2={fret * 100} y1="0" y2="184" />)}
      {STRING_Y.map((y, i) => <line className="string" key={i} x1="0" x2="1200" y1={y} y2={y} />)}
      {[5, 7, 9].map(fret => <text className="fret-label" key={fret} x={fret * 100 - 8} y="202">{fret}</text>)}
      {OPEN_STRINGS.flatMap((open, stringIndex) => FRETS.map(fret => {
        const note = noteAt(open, fret); const id = `${stringIndex}-${fret}`; const x = fret === 0 ? 12 : fret * 100 - 35; const active = selectedIds.has(id);
        return <g className="namer-note" role="button" tabIndex={0} aria-label={`${active ? 'Remove' : 'Add'} ${note}`} key={id} onClick={() => toggle(id, note)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(id, note); } }}><circle className={`marker ${active ? 'active' : 'muted'}`} cx={x} cy={STRING_Y[stringIndex]} r="16" /><text className={`note ${active ? 'active' : 'muted'}`} x={x} y={STRING_Y[stringIndex] + 5}>{note}</text></g>;
      }))}
    </svg></div>
    <div className="namer-actions"><button className="clear" onClick={() => setSelected([])}>Clear notes</button>{selected.length > 1 && <button className="play-selected" onClick={() => onPlay(playable)}>Play selection</button>}</div>
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

function Sequencer({ chords, bpm, isLooping, voicing, rhythm, onTempo, onVoicing, onRhythm, onPlay, onStop, onRemove, onClear }: { chords: Chord[]; bpm: number; isLooping: boolean; voicing: Voicing; rhythm: Rhythm; onTempo: (bpm: number) => void; onVoicing: (value: Voicing) => void; onRhythm: (value: Rhythm) => void; onPlay: () => void; onStop: () => void; onRemove: (index: number) => void; onClear: () => void }) {
  return <section className="sequencer"><div className="section-title sequencer-heading"><div><p className="eyebrow">Practice station</p><h2>Voice-led sequencer</h2><p>Each new chord is placed near the last one for smoother comping.</p></div><label>Tempo <output>{bpm} BPM</output><input aria-label="Tempo" type="range" min="60" max="180" value={bpm} onChange={event => onTempo(Number(event.target.value))} /></label></div>
    <div className="performance-controls"><label>Voicing<select value={voicing} onChange={event => onVoicing(event.target.value as Voicing)}><option value="full">Full chord</option><option value="shell">Shell (R–3–7)</option><option value="rootless">Rootless (3–5–7)</option></select></label><label>Feel<select value={rhythm} onChange={event => onRhythm(event.target.value as Rhythm)}><option value="bossa">Bossa nova</option><option value="straight">Straight pulses</option></select></label><span className="rhythm-note">{rhythm === 'bossa' ? 'Syncopated chord hits + bass pulse' : 'One chord per bar'}</span></div>
    <div className="sequence-steps">{chords.length ? chords.map((chord, index) => <button className="sequence-step" key={`${chord.name}-${index}`} onClick={() => onRemove(index)} title="Remove chord"><span>{index + 1}</span><div><strong>{chord.name}</strong><small>{chord.function ?? 'added chord'}</small></div></button>) : <p className="sequence-empty">Load a jazz progression, or add a chord from either column above.</p>}</div>
    {chords.length > 0 && <div className="fingering-panel"><div><p className="eyebrow">Suggested shapes</p><h3>Fingerings for this loop</h3><p>Compact shapes based on the selected {voicing} voicing. Click a sequence step above to remove it.</p></div><div className="diagram-row">{chords.map((chord, index) => <ChordDiagram key={`${chord.name}-diagram-${index}`} chord={chord} voicing={voicing} />)}</div></div>}
    <div className="sequencer-actions"><button className="play-selected" disabled={!chords.length} onClick={onPlay}>{isLooping ? 'Restart loop' : 'Start loop'}</button><button className="clear" disabled={!isLooping} onClick={onStop}>Stop</button><button className="clear" disabled={!chords.length} onClick={onClear}>Clear</button></div>
  </section>;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'scales' | 'namer'>('scales');
  const [root, setRoot] = useState('C'); const [scaleName, setScaleName] = useState('Major (Ionian)'); const [highlighted, setHighlighted] = useState<ScaleNote[] | null>(null);
  const [sequence, setSequence] = useState<Chord[]>([]); const [bpm, setBpm] = useState(96); const [isLooping, setIsLooping] = useState(false); const [voicing, setVoicing] = useState<Voicing>('shell'); const [rhythm, setRhythm] = useState<Rhythm>('bossa');
  const engine = useToneEngine();
  const notes = useMemo(() => scaleNotes(root, SCALES[scaleName]), [root, scaleName]);
  const triads = useMemo(() => makeChords(notes), [notes]); const tetrads = useMemo(() => makeChords(notes, 4), [notes]);
  const stopLoop = () => { engine.stop(); setIsLooping(false); };
  const change = (nextRoot: string, nextScale: string) => { stopLoop(); setRoot(nextRoot); setScaleName(nextScale); setHighlighted(null); setSequence([]); };
  const playChord = (chord: Chord) => { setHighlighted(chord.notes); void engine.playChord(chord.notes, voicing); };
  const startLoop = () => { if (sequence.length) { void engine.playLoop(sequence, bpm, voicing, rhythm); setIsLooping(true); } };
  return <><header><a className="brand" href="/guitarscales/">Music Tools</a><nav><button className={`tab ${activeTab === 'scales' ? 'current' : ''}`} onClick={() => setActiveTab('scales')}>Practice</button><button className={`tab ${activeTab === 'namer' ? 'current' : ''}`} onClick={() => setActiveTab('namer')}>Chord Namer</button><a className="nav-item" href="https://github.com/fcaldas" target="_blank" rel="noreferrer">GitHub</a></nav></header>
    {activeTab === 'namer' ? <ChordNamer onPlay={notes => void engine.playChord(notes, voicing)} /> : <main><section className="hero"><p className="eyebrow">Guitar harmony, in motion</p><h1>Bossa nova &amp; jazz practice lab</h1><p>Explore the neck, hear rich harmony, and build voice-led comping loops.</p></section><div className="controls"><label>Key centre<select value={root} onChange={event => change(event.target.value, scaleName)}>{NOTES.map(note => <option key={note}>{note}</option>)}</select></label><label>Scale colour<select value={scaleName} onChange={event => change(root, event.target.value)}>{Object.keys(SCALES).map(name => <option key={name}>{name}</option>)}</select></label><button className="play-scale" onClick={() => void engine.playChord(notes.slice(0, -1), voicing)} aria-label="Play scale">▶</button></div>
      <Fretboard scale={notes} root={root} highlighted={highlighted} />
      <div className="chords"><ChordColumn title="Triads in scale" chords={triads} onPlay={playChord} onAdd={chord => setSequence(current => [...current, chord])} /><ChordColumn title="Tetrads in scale" chords={tetrads} onPlay={playChord} onAdd={chord => setSequence(current => [...current, chord])} /></div>
      <Progressions root={root} onLoad={chords => { stopLoop(); setSequence(chords); }} />
      <Sequencer chords={sequence} bpm={bpm} isLooping={isLooping} voicing={voicing} rhythm={rhythm} onTempo={setBpm} onVoicing={setVoicing} onRhythm={setRhythm} onPlay={startLoop} onStop={stopLoop} onRemove={index => setSequence(current => current.filter((_, chordIndex) => chordIndex !== index))} onClear={() => { stopLoop(); setSequence([]); }} />
    </main>}</>;
}
