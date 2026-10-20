import { describe, expect, it } from 'vitest';
import { advanceTuneCursor, clearTunePosition, noteAtPosition, placeTuneNote, removeTuneBar, resizeTuneNote, setTuneNote, trimTuneToBars, tuneNoteDuration, tunePitchPalette, type TunePitch } from './tuneModel';

const c4: TunePitch = { pitch: 'C4', label: 'C4', pitchClass: 'C' };
const d4: TunePitch = { pitch: 'D4', label: 'D4', pitchClass: 'D' };

describe('tune editing', () => {
  it('adds, replaces, and toggles notes at an eighth-note position', () => {
    const added = setTuneNote([], 0, 2, c4);
    expect(added).toEqual([{ id: '0-2', bar: 0, step: 2, pitch: 'C4', label: 'C4', durationSteps: 1 }]);
    expect(setTuneNote(added, 0, 2, d4)[0].pitch).toBe('D4');
    expect(setTuneNote(added, 0, 2, c4)).toEqual([]);
  });

  it('places sustained notes, finds them from covered positions, and removes overlaps', () => {
    const halfNote = placeTuneNote([], 0, 0, c4, 4);
    expect(noteAtPosition(halfNote, 0, 3)?.id).toBe('0-0');
    const replaced = placeTuneNote(halfNote, 0, 2, d4, 2);
    expect(replaced).toEqual([{ id: '0-2', bar: 0, step: 2, pitch: 'D4', label: 'D4', durationSteps: 2 }]);
  });

  it('resizes notes without allowing collisions and treats old saved notes as eighth notes', () => {
    const first = placeTuneNote([], 0, 0, c4, 2);
    const twoNotes = placeTuneNote(first, 0, 3, d4, 1);
    expect(resizeTuneNote(twoNotes, '0-0', 4)).toHaveLength(1);
    expect(tuneNoteDuration({ id: 'old', bar: 0, step: 0, pitch: 'C4', label: 'C4' })).toBe(1);
  });

  it('turns the selected note into a rest and advances across bar lines', () => {
    const notes = placeTuneNote([], 0, 0, c4, 4);
    expect(clearTunePosition(notes, 0, 2)).toEqual([]);
    expect(advanceTuneCursor({ bar: 0, step: 6 }, 2, 3)).toEqual({ bar: 1, step: 0 });
  });

  it('removes a deleted chord bar and closes the remaining gap', () => {
    const notes = [setTuneNote([], 0, 0, c4)[0], setTuneNote([], 2, 4, d4)[0]];
    expect(removeTuneBar(notes, 1).map(note => [note.id, note.bar])).toEqual([['0-0', 0], ['1-4', 1]]);
  });

  it('trims melody events when the chord sequence becomes shorter', () => {
    const notes = [setTuneNote([], 0, 0, c4)[0], setTuneNote([], 3, 0, d4)[0]];
    expect(trimTuneToBars(notes, 2)).toHaveLength(1);
  });

  it('builds an ascending scale palette across the octave boundary', () => {
    const palette = tunePitchPalette([
      { pitchClass: 'G', name: 'G' }, { pitchClass: 'A', name: 'A' }, { pitchClass: 'B', name: 'B' },
      { pitchClass: 'C', name: 'C' }, { pitchClass: 'D', name: 'D' }, { pitchClass: 'E', name: 'E' },
      { pitchClass: 'F#', name: 'F#' }, { pitchClass: 'G', name: 'G' },
    ], 'G');
    expect(palette.map(note => note.pitch)).toEqual(['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5']);
  });
});
