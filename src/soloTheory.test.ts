import { describe, expect, it } from 'vitest';
import { isDominantChord, nextChordTarget, soloScaleNotes, soloToneRole, toggleSoloToneRole } from './soloTheory';

const note = (pitchClass: string) => ({ pitchClass, name: pitchClass });
const g7 = { notes: [note('G'), note('B'), note('D'), note('F')] };
const cmaj7 = { notes: [note('C'), note('E'), note('G'), note('B')] };

describe('solo theory', () => {
  it('recognizes dominant harmony', () => expect(isDominantChord(g7)).toBe(true));
  it('uses altered notes over a dominant in altered mode', () => expect(soloScaleNotes(g7, 'altered', []).sort()).toEqual(['G#', 'A#', 'B', 'C#', 'D#', 'F', 'G'].sort()));
  it('marks the third and seventh as guide tones', () => {
    const notes = soloScaleNotes(g7, 'jazzy', []);
    expect(soloToneRole(g7, 'B', notes)).toBe('guide');
    expect(soloToneRole(g7, 'F', notes)).toBe('guide');
  });
  it('targets the third of the next chord', () => expect(nextChordTarget(cmaj7).pitchClass).toBe('E'));
  it('toggles a visible tone category without affecting the others', () => {
    expect(toggleSoloToneRole([], 'guide')).toEqual(['guide']);
    expect(toggleSoloToneRole(['root', 'guide'], 'guide')).toEqual(['root']);
  });
});
