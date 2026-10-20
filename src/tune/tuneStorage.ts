import type { Rhythm } from '../RhythmNotation';
import { tuneNoteId, type TuneDurationSteps, type TuneNote } from './tuneModel';

export const TUNE_STORAGE_KEY = 'guitarScales.savedTunes.v2';
export const LEGACY_TUNE_STORAGE_KEY = 'guitarScales.savedTunes.v1';

export type SavedTune = {
  id: string;
  name: string;
  savedAt: string;
  root: string;
  scaleName: string;
  bpm: number;
  rhythm: Rhythm;
  chords: Array<{ name: string; function?: string; notes: Array<{ pitchClass: string; name: string }> }>;
  notes: TuneNote[];
};

export function parseSavedTunes(value: string | null): SavedTune[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((tune): tune is SavedTune => Boolean(
      tune && typeof tune === 'object' &&
      typeof (tune as SavedTune).id === 'string' &&
      typeof (tune as SavedTune).name === 'string' &&
      Array.isArray((tune as SavedTune).chords) &&
      Array.isArray((tune as SavedTune).notes),
    ));
  } catch {
    return [];
  }
}

export function migrateLegacyTunes(tunes: SavedTune[]): SavedTune[] {
  return tunes.map(tune => ({
    ...tune,
    notes: tune.notes.map(note => {
      const step = note.step * 2;
      return { ...note, id: tuneNoteId(note.bar, step), step, durationSteps: ((note.durationSteps ?? 1) * 2) as TuneDurationSteps };
    }),
  }));
}

export function readSavedTunes() {
  if (typeof window === 'undefined') return [];
  const current = window.localStorage.getItem(TUNE_STORAGE_KEY);
  if (current) return parseSavedTunes(current);
  return migrateLegacyTunes(parseSavedTunes(window.localStorage.getItem(LEGACY_TUNE_STORAGE_KEY)));
}

export function writeSavedTunes(tunes: SavedTune[]) {
  if (typeof window !== 'undefined') window.localStorage.setItem(TUNE_STORAGE_KEY, JSON.stringify(tunes));
}
