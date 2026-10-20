export const STEPS_PER_BAR = 8;

export type TuneDurationSteps = 1 | 2 | 3 | 4 | 8;

export type TuneNote = {
  id: string;
  bar: number;
  step: number;
  pitch: string;
  label: string;
  /** Number of eighth-note subdivisions. Older saved tunes default to one. */
  durationSteps?: TuneDurationSteps;
};

export type TunePitch = {
  pitch: string;
  label: string;
  pitchClass: string;
};

export type TuneCursor = { bar: number; step: number };

export const DURATION_OPTIONS: Array<{ steps: TuneDurationSteps; label: string }> = [
  { steps: 1, label: 'Quaver' },
  { steps: 2, label: 'Crotchet' },
  { steps: 3, label: 'Dotted crotchet' },
  { steps: 4, label: 'Minim' },
  { steps: 8, label: 'Semibreve' },
];

export function tuneNoteId(bar: number, step: number) {
  return `${bar}-${step}`;
}

export function tuneNoteDuration(note: TuneNote): TuneDurationSteps {
  return note.durationSteps ?? 1;
}

export function noteAtPosition(notes: TuneNote[], bar: number, step: number) {
  return notes.find(note => note.bar === bar && step >= note.step && step < note.step + tuneNoteDuration(note));
}

function fittedDuration(step: number, requested: TuneDurationSteps): TuneDurationSteps {
  const remaining = STEPS_PER_BAR - step;
  return ([8, 4, 3, 2, 1] as TuneDurationSteps[]).find(duration => duration <= requested && duration <= remaining) ?? 1;
}

function overlaps(note: TuneNote, bar: number, step: number, duration: number) {
  return note.bar === bar && note.step < step + duration && note.step + tuneNoteDuration(note) > step;
}

export function placeTuneNote(notes: TuneNote[], bar: number, step: number, selectedPitch: TunePitch, requestedDuration: TuneDurationSteps) {
  const durationSteps = fittedDuration(step, requestedDuration);
  const note: TuneNote = { id: tuneNoteId(bar, step), bar, step, pitch: selectedPitch.pitch, label: selectedPitch.label, durationSteps };
  return [...notes.filter(existing => !overlaps(existing, bar, step, durationSteps)), note]
    .sort((a, b) => a.bar - b.bar || a.step - b.step);
}

export function clearTunePosition(notes: TuneNote[], bar: number, step: number, requestedDuration: TuneDurationSteps = 1) {
  const selected = noteAtPosition(notes, bar, step);
  if (selected) return notes.filter(note => note.id !== selected.id);
  const duration = fittedDuration(step, requestedDuration);
  return notes.filter(note => !overlaps(note, bar, step, duration));
}

export function resizeTuneNote(notes: TuneNote[], id: string, requestedDuration: TuneDurationSteps) {
  const selected = notes.find(note => note.id === id);
  if (!selected) return notes;
  const durationSteps = fittedDuration(selected.step, requestedDuration);
  return notes
    .filter(note => note.id === id || !overlaps(note, selected.bar, selected.step, durationSteps))
    .map(note => note.id === id ? { ...note, durationSteps } : note)
    .sort((a, b) => a.bar - b.bar || a.step - b.step);
}

export function advanceTuneCursor(cursor: TuneCursor, duration: TuneDurationSteps, barCount: number): TuneCursor {
  const absoluteStep = cursor.bar * STEPS_PER_BAR + cursor.step + fittedDuration(cursor.step, duration);
  const lastStep = Math.max(0, barCount * STEPS_PER_BAR - 1);
  const clamped = Math.min(absoluteStep, lastStep);
  return { bar: Math.floor(clamped / STEPS_PER_BAR), step: clamped % STEPS_PER_BAR };
}

export function setTuneNote(notes: TuneNote[], bar: number, step: number, selectedPitch: TunePitch) {
  const id = tuneNoteId(bar, step);
  const existing = notes.find(note => note.id === id);
  if (existing?.pitch === selectedPitch.pitch && tuneNoteDuration(existing) === 1) return notes.filter(note => note.id !== id);
  return placeTuneNote(notes, bar, step, selectedPitch, 1);
}

export function removeTuneBar(notes: TuneNote[], removedBar: number) {
  return notes.flatMap(note => {
    if (note.bar === removedBar) return [];
    return [{ ...note, id: tuneNoteId(note.bar > removedBar ? note.bar - 1 : note.bar, note.step), bar: note.bar > removedBar ? note.bar - 1 : note.bar }];
  });
}

export function trimTuneToBars(notes: TuneNote[], barCount: number) {
  return notes.filter(note => note.bar < barCount);
}

export function tunePitchPalette(scale: Array<{ pitchClass: string; name: string }>, root: string): TunePitch[] {
  const degrees = scale.slice(0, -1);
  const rootIndex = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].indexOf(root);
  return degrees.map(note => {
    const noteIndex = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].indexOf(note.pitchClass);
    const octave = noteIndex < rootIndex ? 5 : 4;
    return { pitch: `${note.pitchClass}${octave}`, label: `${note.name}${octave}`, pitchClass: note.pitchClass };
  });
}
