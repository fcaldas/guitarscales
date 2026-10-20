import { describe, expect, it } from 'vitest';
import { nameSelectedChord, scaleNotes } from './App';
import { chordVoicings, commonFingering, DIAGRAM_STRINGS, fingeringNotes, noteAt } from './chordVoicings';

const note = (pitchClass: string) => ({ pitchClass, name: pitchClass });

describe('guitar chord diagrams', () => {
  it('reads strings from low E to high E', () => {
    expect(DIAGRAM_STRINGS).toEqual(['E', 'A', 'D', 'G', 'B', 'E']);
  });

  it('starts Cmaj7 with its familiar open-position grip', () => {
    const chord = { name: 'Cmaj7', notes: [note('C'), note('E'), note('G'), note('B')] };
    const fingering = commonFingering(chord);
    expect(fingering?.frets).toEqual([null, 3, 2, 0, 0, 0]);
    expect(fingeringNotes(fingering!)).toEqual(['x', 'C', 'E', 'G', 'B', 'E']);
  });

  it('offers distinct, playable variations for representative seventh chords', () => {
    const chords = [
      { name: 'Cmaj7', notes: [note('C'), note('E'), note('G'), note('B')] },
      { name: 'G7', notes: [note('G'), note('B'), note('D'), note('F')] },
      { name: 'Dm7', notes: [note('D'), note('F'), note('A'), note('C')] },
    ];
    for (const chord of chords) {
      const voicings = chordVoicings(chord);
      expect(voicings.length).toBeGreaterThanOrEqual(2);
      expect(new Set(voicings.map(voicing => voicing.frets.join(','))).size).toBe(voicings.length);
    }
    expect(chordVoicings(chords[1]).map(voicing => voicing.frets)).toContainEqual([null, 10, 12, 10, 12, 10]);
    expect(chordVoicings(chords[2]).map(voicing => voicing.frets)).toContainEqual([null, 5, 7, 5, 6, 5]);
  });

  it('keeps every displayed note inside the chord and covers every chord tone', () => {
    const chords = [
      { name: 'Cmaj7', notes: [note('C'), note('E'), note('G'), note('B')] },
      { name: 'G7', notes: [note('G'), note('B'), note('D'), note('F')] },
      { name: 'Dm7', notes: [note('D'), note('F'), note('A'), note('C')] },
    ];
    for (const chord of chords) {
      const chordNotes = new Set(chord.notes.map(value => value.pitchClass));
      for (const voicing of chordVoicings(chord)) {
        const played = fingeringNotes(voicing).filter(value => value !== 'x');
        expect(played.every(value => chordNotes.has(value))).toBe(true);
        expect([...chordNotes].every(value => played.includes(value))).toBe(true);
      }
    }
  });

  it('provides complete, compact movable choices in every key for common triads and sevenths', () => {
    const roots = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const commonQualities = [
      [0, 4, 7], [0, 3, 7], [0, 4, 7, 10], [0, 4, 7, 11], [0, 3, 7, 10], [0, 3, 6, 10],
    ];
    for (const root of roots) for (const intervals of commonQualities) {
      const chord = { name: 'test chord', notes: intervals.map(interval => note(noteAt(root, interval))) };
      const chordNotes = new Set(chord.notes.map(value => value.pitchClass));
      const voicings = chordVoicings(chord);
      expect(voicings.length).toBeGreaterThanOrEqual(2);
      for (const voicing of voicings) {
        const played = fingeringNotes(voicing).filter(value => value !== 'x');
        const context = `${root} ${intervals.join(',')} ${voicing.label} ${voicing.frets.join(',')} => ${played.join(',')}`;
        expect(played.every(value => chordNotes.has(value)), context).toBe(true);
        expect([...chordNotes].every(value => played.includes(value)), context).toBe(true);
        const fretted = voicing.frets.filter((fret): fret is number => fret !== null && fret > 0);
        expect(Math.max(...fretted) - Math.min(...fretted)).toBeLessThanOrEqual(3);
      }
    }
  });

  it('keeps harmonic-minor chord shapes note-correct', () => {
    const roots = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const harmonicMinorQualities = [[0, 3, 6], [0, 4, 8], [0, 3, 6, 9], [0, 3, 7, 11], [0, 4, 8, 11]];
    for (const root of roots) for (const intervals of harmonicMinorQualities) {
      const chord = { name: 'harmonic-minor chord', notes: intervals.map(interval => note(noteAt(root, interval))) };
      const chordNotes = new Set(chord.notes.map(value => value.pitchClass));
      for (const voicing of chordVoicings(chord)) {
        const played = fingeringNotes(voicing).filter(value => value !== 'x');
        const context = `${root} ${intervals.join(',')} ${voicing.label} ${voicing.frets.join(',')} => ${played.join(',')}`;
        expect(played.every(value => chordNotes.has(value)), context).toBe(true);
        expect([...chordNotes].every(value => played.includes(value)), context).toBe(true);
      }
    }
  });

  it('maps the leftmost diagram string to low E and the rightmost to high E', () => {
    const g7 = chordVoicings({ name: 'G7', notes: [note('G'), note('B'), note('D'), note('F')] })[0];
    expect(g7.frets).toEqual([3, 2, 0, 0, 0, 1]);
    expect(noteAt(DIAGRAM_STRINGS[0], g7.frets[0]!)).toBe('G');
    expect(noteAt(DIAGRAM_STRINGS[5], g7.frets[5]!)).toBe('F');
  });
});

describe('scale spelling', () => {
  it('uses conventional note names for G minor pentatonic', () => {
    const notes = scaleNotes('G', [3, 2, 2, 3, 2], 'Minor Pentatonic');
    expect(notes.map(note => note.name)).toEqual(['G', 'Bb', 'C', 'D', 'F', 'G']);
  });
});

describe('jazz chord naming', () => {
  it('identifies inversions from the detected bass note', () => {
    expect(nameSelectedChord(['C', 'E', 'G', 'B'], 'E').primary).toBe('Cmaj7/E');
  });

  it('recognizes altered dominant extensions', () => {
    expect(nameSelectedChord(['G', 'G#', 'B', 'D', 'F']).primary).toBe('G7♭9');
  });
});
