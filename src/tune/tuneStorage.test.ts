import { describe, expect, it } from 'vitest';
import { migrateLegacyTunes, parseSavedTunes, type SavedTune } from './tuneStorage';

const tune: SavedTune = {
  id: 'blue-bossa', name: 'Blue idea', savedAt: '2026-10-11T12:00:00.000Z', root: 'C', scaleName: 'Major (Ionian)', bpm: 96, rhythm: 'bossa',
  chords: [{ name: 'Dm7', function: 'ii', notes: [{ pitchClass: 'D', name: 'D' }] }],
  notes: [{ id: '0-0', bar: 0, step: 0, pitch: 'F4', label: 'F4' }],
};

describe('saved tune storage', () => {
  it('round-trips a complete tune snapshot', () => expect(parseSavedTunes(JSON.stringify([tune]))).toEqual([tune]));
  it('ignores malformed or unrelated stored data', () => {
    expect(parseSavedTunes('{bad json')).toEqual([]);
    expect(parseSavedTunes(JSON.stringify([{ id: 'missing-fields' }, null]))).toEqual([]);
  });
  it('migrates the old quaver grid onto semiquaver subdivisions', () => {
    const migrated = migrateLegacyTunes([{ ...tune, notes: [{ id: '0-3', bar: 0, step: 3, pitch: 'F4', label: 'F4', durationSteps: 2 }] }]);
    expect(migrated[0].notes[0]).toMatchObject({ id: '0-6', step: 6, durationSteps: 4 });
  });
});
