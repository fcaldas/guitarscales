import { useMemo, useState } from 'react';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
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

type Chord = { name: string; notes: string[] };
const noteAt = (note: string, semitones: number) => NOTES[(NOTES.indexOf(note) + semitones) % 12];
const pitch = (note: string, octave: number) => 440 * 2 ** ((NOTES.indexOf(note) - 9 + (octave - 4) * 12) / 12);

function scaleNotes(root: string, steps: number[]) {
  const result = [root]; let current = NOTES.indexOf(root);
  steps.forEach(step => { current = (current + step) % 12; result.push(NOTES[current]); });
  return result;
}

function chordName(notes: string[]) {
  const intervals = notes.slice(1).map(n => (NOTES.indexOf(n) - NOTES.indexOf(notes[0]) + 12) % 12);
  const labels: Record<string, string> = { '4,7': '', '3,7': 'm', '3,6': 'o', '4,8': '+', '4,7,11': 'maj7', '3,7,10': 'min7', '4,7,10': '7', '3,6,9': 'dim7', '3,6,10': 'halfdim7', '3,7,11': 'minmaj7', '4,8,11': 'maj7#5', '4,8,10': 'aug7' };
  return `${notes[0]}${labels[intervals.join(',')] ?? ` (${intervals.join(', ')})`}`;
}

function makeChords(scale: string[], size: number = 3): Chord[] {
  const degrees = scale.slice(0, -1);
  return degrees.map((_, degree) => {
    const notes = Array.from({ length: size }, (_, voice) => degrees[(degree + voice * 2) % degrees.length]);
    return { notes, name: chordName(notes) };
  });
}

function play(notes: string[], stagger = 0.1) {
  const context = new AudioContext();
  notes.forEach((note, index) => {
    const oscillator = context.createOscillator(); const gain = context.createGain();
    const start = context.currentTime + index * stagger;
    oscillator.type = 'sine'; oscillator.frequency.value = pitch(note, 4 + (index > 1 ? 1 : 0));
    gain.gain.setValueAtTime(0.0001, start); gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02); gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.42);
    oscillator.connect(gain).connect(context.destination); oscillator.start(start); oscillator.stop(start + 0.45);
  });
}

function Fretboard({ scale, root, highlighted }: { scale: string[]; root: string; highlighted: string[] | null }) {
  const selected = new Set(scale); const active = new Set(highlighted ?? []);
  return <div className="fretboard-wrap"><svg viewBox="0 0 1200 205" role="img" aria-label="Guitar fretboard">
    <rect className="neck" x="0" y="0" width="1200" height="184" rx="3" />
    {FRETS.map(fret => <line className="fret" key={fret} x1={fret * 100} x2={fret * 100} y1="0" y2="184" />)}
    {STRING_Y.map((y, i) => <line className="string" key={i} x1="0" x2="1200" y1={y} y2={y} />)}
    {[5, 7, 9].map(fret => <text className="fret-label" key={fret} x={fret * 100 - 8} y="202">{fret}</text>)}
    {OPEN_STRINGS.flatMap((open, stringIndex) => FRETS.map(fret => {
      const note = noteAt(open, fret); const x = fret === 0 ? 12 : fret * 100 - 35;
      const state = active.has(note) ? 'active' : note === root ? 'root' : selected.has(note) ? 'selected' : 'muted';
      return <g key={`${stringIndex}-${fret}`}><circle className={`marker ${state}`} cx={x} cy={STRING_Y[stringIndex]} r="16" /><text className={`note ${state}`} x={x} y={STRING_Y[stringIndex] + 5}>{note}</text></g>;
    }))}
  </svg></div>;
}

function ChordColumn({ title, chords, onPlay }: { title: string; chords: Chord[]; onPlay: (chord: Chord) => void }) {
  return <section className="chord-column"><h2>{title}</h2>{chords.map(chord => <div className="chord" key={chord.name}><button onClick={() => onPlay(chord)} aria-label={`Play ${chord.name}`}>Play</button><span>{chord.notes.join(', ')} – <strong>{chord.name}</strong></span></div>)}</section>;
}

export default function App() {
  const [root, setRoot] = useState('C'); const [scaleName, setScaleName] = useState('Major (Ionian)'); const [highlighted, setHighlighted] = useState<string[] | null>(null);
  const notes = useMemo(() => scaleNotes(root, SCALES[scaleName]), [root, scaleName]);
  const triads = useMemo(() => makeChords(notes), [notes]); const tetrads = useMemo(() => makeChords(notes, 4), [notes]);
  const change = (nextRoot: string, nextScale: string) => { setRoot(nextRoot); setScaleName(nextScale); setHighlighted(null); };
  const playChord = (chord: Chord) => { setHighlighted(chord.notes); play(chord.notes); };
  return <><header><a className="brand" href="/guitarscales/">Music Tools</a><nav><a className="nav-item" href="https://github.com/fcaldas" target="_blank" rel="noreferrer">GitHub</a></nav></header>
    <main><h1>Guitar Scale Explorer</h1><div className="controls"><label>Root note<select value={root} onChange={event => change(event.target.value, scaleName)}>{NOTES.map(note => <option key={note}>{note}</option>)}</select></label><label>Select a scale<select value={scaleName} onChange={event => change(root, event.target.value)}>{Object.keys(SCALES).map(name => <option key={name}>{name}</option>)}</select></label><button className="play-scale" onClick={() => play(notes.slice(0, -1), 0.5)} aria-label="Play scale">▶</button></div>
      <Fretboard scale={notes} root={root} highlighted={highlighted} />
      <div className="chords"><ChordColumn title="Triads in scale" chords={triads} onPlay={playChord} /><ChordColumn title="Tetrads in scale" chords={tetrads} onPlay={playChord} /></div>
    </main></>;
}
