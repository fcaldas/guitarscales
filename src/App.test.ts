import { describe, expect, it } from 'vitest';
import { commonFingering, DIAGRAM_STRINGS, nameSelectedChord, noteAt, scaleNotes } from './App';

const note = (pitchClass: string) => ({ pitchClass, name: pitchClass });

describe('guitar chord diagrams', () => {
  it('reads strings from low E to high E', () => {
    expect(DIAGRAM_STRINGS).toEqual(['E', 'A', 'D', 'G', 'B', 'E']);
  });

  it('uses a complete common Cmaj7 grip', () => {
    const fingering = commonFingering({ name: 'Cmaj7', notes: [note('C'), note('E'), note('G'), note('B')] });
    expect(fingering?.frets).toEqual([null, 3, 5, 4, 5, 3]);
    const renderedNotes = fingering!.frets.map((fret, index) => fret === null ? 'x' : noteAt(DIAGRAM_STRINGS[index], fret));
    expect(renderedNotes).toEqual(['x', 'C', 'G', 'B', 'E', 'G']);
  });

  it('uses a fifth-string-root G7 grip', () => {
    const fingering = commonFingering({ name: 'G7', notes: [note('G'), note('B'), note('D'), note('F')] });
    expect(fingering?.frets).toEqual([null, 10, 12, 10, 11, 10]);
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
