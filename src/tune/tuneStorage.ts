import type { Rhythm } from '../RhythmNotation';
import type { TuneNote } from './tuneModel';

export const TUNE_STORAGE_KEY = 'guitarScales.savedTunes.v1';

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

export function readSavedTunes() {
  return typeof window === 'undefined' ? [] : parseSavedTunes(window.localStorage.getItem(TUNE_STORAGE_KEY));
}

export function writeSavedTunes(tunes: SavedTune[]) {
  if (typeof window !== 'undefined') window.localStorage.setItem(TUNE_STORAGE_KEY, JSON.stringify(tunes));
}
