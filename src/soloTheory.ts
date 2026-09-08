import type { PlayableChord } from './toneEngine';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export type SoloStyle = 'safe' | 'jazzy' | 'altered';
export type SoloToneRole = 'root' | 'guide' | 'chord-tone' | 'tension' | 'outside';

const noteAt = (note: string, semitones: number) => NOTES[(NOTES.indexOf(note) + semitones) % 12];
const intervalsFor = (chord: PlayableChord) => chord.notes.map(note => (NOTES.indexOf(note.pitchClass) - NOTES.indexOf(chord.notes[0].pitchClass) + 12) % 12);

export function isDominantChord(chord: PlayableChord) {
  const intervals = intervalsFor(chord);
  return intervals.includes(4) && intervals.includes(10);
}

export function soloScaleNotes(chord: PlayableChord, style: SoloStyle, fallback: string[]) {
  const root = chord.notes[0].pitchClass;
  const intervals = intervalsFor(chord);
  if (isDominantChord(chord)) {
    const scale = style === 'altered' ? [0, 1, 3, 4, 6, 8, 10] : style === 'jazzy' ? [0, 2, 4, 6, 7, 9, 10] : undefined;
    return scale ? scale.map(interval => noteAt(root, interval)) : fallback;
  }
  if (style === 'jazzy' && intervals.includes(3) && intervals.includes(10)) return [0, 2, 3, 5, 7, 9, 10].map(interval => noteAt(root, interval));
  if (style === 'jazzy' && intervals.includes(4) && intervals.includes(11)) return [0, 2, 4, 6, 7, 9, 11].map(interval => noteAt(root, interval));
  return fallback;
}

export function soloToneRole(chord: PlayableChord, pitchClass: string, allowedNotes: string[]): SoloToneRole {
  const root = chord.notes[0].pitchClass;
  if (pitchClass === root) return 'root';
  const interval = (NOTES.indexOf(pitchClass) - NOTES.indexOf(root) + 12) % 12;
  if (interval === 3 || interval === 4 || interval === 10 || interval === 11) return 'guide';
  if (intervalsFor(chord).includes(interval)) return 'chord-tone';
  return allowedNotes.includes(pitchClass) ? 'tension' : 'outside';
}

export function nextChordTarget(chord: PlayableChord) {
  return chord.notes.find(note => {
    const interval = (NOTES.indexOf(note.pitchClass) - NOTES.indexOf(chord.notes[0].pitchClass) + 12) % 12;
    return interval === 3 || interval === 4;
  }) ?? chord.notes[0];
}
