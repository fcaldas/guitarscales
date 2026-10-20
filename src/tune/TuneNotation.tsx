import { Accidental, Beam, ChordSymbol, Dot, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow';
import { useEffect, useRef } from 'react';
import { STEPS_PER_BAR, noteAtPosition, tuneNoteDuration, type TuneDurationSteps, type TuneNote } from './tuneModel';

type NotationChord = { name: string };

export const TUNE_BAR_WIDTH = 236;
const HEIGHT = 164;

const durationCode = (duration: TuneDurationSteps) => ({ 1: '8', 2: 'q', 3: 'q', 4: 'h', 8: 'w' }[duration]);

function restDurations(length: number) {
  const durations: TuneDurationSteps[] = [];
  let remaining = length;
  for (const duration of [8, 4, 3, 2, 1] as TuneDurationSteps[]) {
    while (remaining >= duration) { durations.push(duration); remaining -= duration; }
  }
  return durations;
}

function staveKey(pitch: string) {
  const match = pitch.match(/^([A-G])([#b]{0,2})(\d)$/);
  if (!match) return 'c/4';
  return `${match[1].toLowerCase()}${match[2]}/${match[3]}`;
}

function accidentalFor(pitch: string) {
  return pitch.match(/^[A-G]([#b]{1,2})/)?.[1];
}

export function TuneNotation({ chords, notes, activeNoteId, selectedBar, selectedStep, onSelectPosition }: { chords: NotationChord[]; notes: TuneNote[]; activeNoteId: string | null; selectedBar: number; selectedStep: number; onSelectPosition: (bar: number, step: number) => void }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current || !chords.length) return;
    container.current.replaceChildren();
    const width = chords.length * TUNE_BAR_WIDTH + 16;
    const renderer = new Renderer(container.current, Renderer.Backends.SVG);
    renderer.resize(width, HEIGHT);
    const context = renderer.getContext();

    chords.forEach((chord, bar) => {
      const x = 8 + bar * TUNE_BAR_WIDTH;
      const stave = new Stave(x, 42, TUNE_BAR_WIDTH);
      if (bar === 0) stave.addClef('treble').addTimeSignature('4/4');
      stave.setContext(context).draw();
      const barNotes = notes.filter(note => note.bar === bar).sort((a, b) => a.step - b.step);
      const tickables: StaveNote[] = [];
      let step = 0;
      while (step < STEPS_PER_BAR) {
        const tuneNote = barNotes.find(note => note.step === step);
        if (tuneNote) {
          const duration = tuneNoteDuration(tuneNote);
          const staveNote = new StaveNote({ clef: 'treble', keys: [staveKey(tuneNote.label)], duration: durationCode(duration) });
          const accidental = accidentalFor(tuneNote.label);
          if (accidental) staveNote.addModifier(new Accidental(accidental), 0);
          if (duration === 3) Dot.buildAndAttach([staveNote]);
          if (tuneNote.id === activeNoteId) staveNote.setStyle({ fillStyle: '#ff3d81', strokeStyle: '#ff3d81' });
          tickables.push(staveNote);
          step += duration;
        } else {
          const nextStart = barNotes.find(note => note.step > step)?.step ?? STEPS_PER_BAR;
          for (const duration of restDurations(nextStart - step)) {
            const rest = new StaveNote({ clef: 'treble', keys: ['b/4'], duration: `${durationCode(duration)}r` });
            if (duration === 3) Dot.buildAndAttach([rest]);
            tickables.push(rest);
          }
          step = nextStart;
        }
      }
      tickables[0]?.addModifier(new ChordSymbol().addText(chord.name).setVertical('top').setHorizontal('left'), 0);
      const voice = new Voice({ numBeats: 4, beatValue: 4 }).addTickables(tickables);
      new Formatter().joinVoices([voice]).format([voice], bar === 0 ? TUNE_BAR_WIDTH - 72 : TUNE_BAR_WIDTH - 34);
      voice.draw(context, stave);
      Beam.generateBeams(tickables).forEach(beam => beam.setContext(context).draw());
    });
  }, [activeNoteId, chords, notes]);

  const scoreWidth = chords.length * TUNE_BAR_WIDTH + 16;
  return <div className="tune-score-scroll">
    <div className="tune-score-sheet" style={{ width: scoreWidth }}>
      <div className="tune-notation-canvas" ref={container} aria-label="Standard notation showing the chord progression and composed melody" />
      <div className="tune-score-hit-grid" aria-label="Choose a position in the score">{chords.map((chord, bar) => <div className="tune-score-hit-bar" key={`${chord.name}-${bar}`}>{Array.from({ length: STEPS_PER_BAR }, (_, step) => {
        const soundingNote = noteAtPosition(notes, bar, step);
        const selected = selectedBar === bar && selectedStep === step;
        return <button type="button" key={step} className={`${selected ? 'is-selected' : ''} ${soundingNote ? 'has-note' : ''}`} aria-label={`Select bar ${bar + 1}, ${step % 2 ? 'and of ' : 'beat '}${Math.floor(step / 2) + 1}${soundingNote ? `, ${soundingNote.label}` : ''}`} aria-pressed={selected} onClick={() => onSelectPosition(bar, step)} />;
      })}</div>)}</div>
    </div>
  </div>;
}
