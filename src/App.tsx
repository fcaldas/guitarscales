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
const STRING_Y = [24, 54, 84, 114, 142, 170];
const FRETS = Array.from({ length: 13 }, (_, i) => i);

type ScaleNote = { pitchClass: string; name: string };
type Chord = { name: string; notes: ScaleNote[] };
type SelectedPosition = { id: string; pitchClass: string };
const noteAt = (note: string, semitones: number) => NOTES[(NOTES.indexOf(note) + semitones) % 12];
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

const toToneNote = (note: ScaleNote, index: number) => `${note.pitchClass}${4 + (index > 2 ? 1 : 0)}`;

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

  const playChord = async (notes: ScaleNote[]) => {
    const instrument = await start();
    instrument.triggerAttackRelease(notes.map(toToneNote), '2n', Tone.now());
  };

  const playLoop = async (chords: Chord[], bpm: number) => {
    const instrument = await start();
    stop();
    const transport = Tone.getTransport();
    transport.bpm.value = bpm;
    transport.loop = true;
    transport.loopStart = 0;
    transport.loopEnd = `${chords.length}m`;
    sequence.current = new Tone.Part<{ time: string; chord: Chord }>((time, event) => {
      instrument.triggerAttackRelease(event.chord.notes.map(toToneNote), '2n', time);
    }, chords.map((chord, index) => ({ time: `${index}m`, chord })));
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

const PROGRESSIONS = [
  { label: 'I – V – vi – IV', degrees: [0, 4, 5, 3], description: 'The classic pop progression' },
  { label: 'I – IV – V', degrees: [0, 3, 4], description: 'A foundational major-key cadence' },
  { label: 'ii – V – I', degrees: [1, 4, 0], description: 'The essential jazz turnaround' },
  { label: 'vi – IV – I – V', degrees: [5, 3, 0, 4], description: 'A modern pop loop' },
  { label: 'I – vi – IV – V', degrees: [0, 5, 3, 4], description: 'The 1950s progression' },
  { label: 'i – VI – III – VII', degrees: [0, 5, 2, 6], description: 'A strong minor/modal loop' },
];

function Progressions({ chords, onLoad }: { chords: Chord[]; onLoad: (chords: Chord[]) => void }) {
  if (chords.length !== 7) return <section className="progressions"><h2>Common progressions</h2><p>Choose a seven-note scale to explore diatonic chord progressions.</p></section>;
  return <section className="progressions"><h2>Common progressions</h2><div className="progression-grid">{PROGRESSIONS.map(progression => {
    const sequence = progression.degrees.map(degree => chords[degree]);
    return <button className="progression" key={progression.label} onClick={() => onLoad(sequence)}><strong>{progression.label}</strong><span>{sequence.map(chord => chord.name).join('  ·  ')}</span><small>{progression.description} — load into sequencer</small></button>;
  })}</div></section>;
}

function Sequencer({ chords, bpm, isLooping, onTempo, onPlay, onStop, onRemove, onClear }: { chords: Chord[]; bpm: number; isLooping: boolean; onTempo: (bpm: number) => void; onPlay: () => void; onStop: () => void; onRemove: (index: number) => void; onClear: () => void }) {
  return <section className="sequencer"><div className="sequencer-heading"><div><h2>Chord sequencer</h2><p>Build a progression from the triads above, then loop it.</p></div><label>Tempo <output>{bpm} BPM</output><input type="range" min="60" max="180" value={bpm} onChange={event => onTempo(Number(event.target.value))} /></label></div>
    <div className="sequence-steps">{chords.length ? chords.map((chord, index) => <button className="sequence-step" key={`${chord.name}-${index}`} onClick={() => onRemove(index)} title="Remove chord"><span>{index + 1}</span><strong>{chord.name}</strong></button>) : <p className="sequence-empty">Use a common progression or the + buttons beside triads.</p>}</div>
    <div className="sequencer-actions"><button className="play-selected" disabled={!chords.length} onClick={onPlay}>{isLooping ? 'Restart loop' : 'Play loop'}</button><button className="clear" disabled={!isLooping} onClick={onStop}>Stop</button><button className="clear" disabled={!chords.length} onClick={onClear}>Clear</button></div>
  </section>;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'scales' | 'namer'>('scales');
  const [root, setRoot] = useState('C'); const [scaleName, setScaleName] = useState('Major (Ionian)'); const [highlighted, setHighlighted] = useState<ScaleNote[] | null>(null);
  const [sequence, setSequence] = useState<Chord[]>([]); const [bpm, setBpm] = useState(96); const [isLooping, setIsLooping] = useState(false);
  const engine = useToneEngine();
  const notes = useMemo(() => scaleNotes(root, SCALES[scaleName]), [root, scaleName]);
  const triads = useMemo(() => makeChords(notes), [notes]); const tetrads = useMemo(() => makeChords(notes, 4), [notes]);
  const stopLoop = () => { engine.stop(); setIsLooping(false); };
  const change = (nextRoot: string, nextScale: string) => { stopLoop(); setRoot(nextRoot); setScaleName(nextScale); setHighlighted(null); setSequence([]); };
  const playChord = (chord: Chord) => { setHighlighted(chord.notes); void engine.playChord(chord.notes); };
  const startLoop = () => { if (sequence.length) { void engine.playLoop(sequence, bpm); setIsLooping(true); } };
  return <><header><a className="brand" href="/guitarscales/">Music Tools</a><nav><button className={`tab ${activeTab === 'scales' ? 'current' : ''}`} onClick={() => setActiveTab('scales')}>Scales</button><button className={`tab ${activeTab === 'namer' ? 'current' : ''}`} onClick={() => setActiveTab('namer')}>Chord Namer</button><a className="nav-item" href="https://github.com/fcaldas" target="_blank" rel="noreferrer">GitHub</a></nav></header>
    {activeTab === 'namer' ? <ChordNamer onPlay={notes => void engine.playChord(notes)} /> : <main><h1>Guitar Scale Explorer</h1><div className="controls"><label>Root note<select value={root} onChange={event => change(event.target.value, scaleName)}>{NOTES.map(note => <option key={note}>{note}</option>)}</select></label><label>Select a scale<select value={scaleName} onChange={event => change(root, event.target.value)}>{Object.keys(SCALES).map(name => <option key={name}>{name}</option>)}</select></label><button className="play-scale" onClick={() => void engine.playChord(notes.slice(0, -1))} aria-label="Play scale">▶</button></div>
      <Fretboard scale={notes} root={root} highlighted={highlighted} />
      <div className="chords"><ChordColumn title="Triads in scale" chords={triads} onPlay={playChord} onAdd={chord => setSequence(current => [...current, chord])} /><ChordColumn title="Tetrads in scale" chords={tetrads} onPlay={playChord} onAdd={chord => setSequence(current => [...current, chord])} /></div>
      <Progressions chords={triads} onLoad={chords => { stopLoop(); setSequence(chords); }} />
      <Sequencer chords={sequence} bpm={bpm} isLooping={isLooping} onTempo={setBpm} onPlay={startLoop} onStop={stopLoop} onRemove={index => setSequence(current => current.filter((_, chordIndex) => chordIndex !== index))} onClear={() => { stopLoop(); setSequence([]); }} />
    </main>}</>;
}
