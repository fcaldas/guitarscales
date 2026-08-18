import { useEffect, useRef } from 'react';
import * as Tone from 'tone';
import type { Rhythm } from './RhythmNotation';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export type PlayableNote = { pitchClass: string; name: string };
export type PlayableChord = { notes: PlayableNote[] };
export type Instrument = 'nylon' | 'electric' | 'organ';

export const INSTRUMENT_PRESETS = {
  nylon: { oscillator: 'triangle', envelope: { attack: 0.015, decay: 0.16, sustain: 0.32, release: 1.1 } },
  electric: { oscillator: 'sawtooth', envelope: { attack: 0.01, decay: 0.08, sustain: 0.5, release: 0.8 } },
  organ: { oscillator: 'sine', envelope: { attack: 0.03, decay: 0.08, sustain: 0.75, release: 0.65 } },
} as const;

export const rhythmPattern = (rhythm: Rhythm): string[] => ({
  bossa: ['0:0', '0:1:2', '0:2:2', '0:3:2'],
  swing: ['0:0', '0:1:2', '0:2', '0:3'],
  samba: ['0:0', '0:1', '0:2:2', '0:3'],
  straight: ['0:0'],
}[rhythm]);

const toToneNote = (note: PlayableNote, index: number) => `${note.pitchClass}${3 + Math.floor(index / 2)}`;

export function voiceLead(chords: PlayableChord[]) {
  let previous: number[] = [];
  return chords.map(chord => {
    const pitches = chord.notes.map(note => NOTES.indexOf(note.pitchClass)).sort((a, b) => a - b);
    const voiced = pitches.map((pitchClass, index) => {
      const candidates = [-1, 0, 1, 2].map(octave => 48 + pitchClass + octave * 12);
      const target = previous[index] ?? (55 + index * 4);
      return candidates.reduce((closest, candidate) => Math.abs(candidate - target) < Math.abs(closest - target) ? candidate : closest);
    }).sort((a, b) => a - b);
    previous = voiced;
    return voiced.map(value => `${NOTES[value % 12]}${Math.floor(value / 12) - 1}`);
  });
}

export function useToneEngine(instrument: Instrument, reverbAmount: number) {
  const synth = useRef<Tone.PolySynth | null>(null);
  const sequence = useRef<Tone.Part | null>(null);
  const reverb = useRef<Tone.Reverb | null>(null);

  const start = async () => {
    await Tone.start();
    if (!reverb.current) reverb.current = new Tone.Reverb({ decay: 2.4, wet: reverbAmount }).toDestination();
    if (!synth.current) {
      const preset = INSTRUMENT_PRESETS[instrument];
      synth.current = new Tone.PolySynth(Tone.Synth, { oscillator: { type: preset.oscillator }, envelope: preset.envelope }).connect(reverb.current);
      synth.current.volume.value = -8;
    }
    return synth.current;
  };

  const stop = () => {
    sequence.current?.dispose();
    sequence.current = null;
    const transport = Tone.getTransport();
    transport.stop();
    transport.cancel();
    transport.position = 0;
  };

  const playChord = async (notes: PlayableNote[]) => {
    const activeSynth = await start();
    activeSynth.triggerAttackRelease(notes.map(toToneNote), '2n', Tone.now());
  };

  const playScale = async (notes: PlayableNote[]) => {
    const activeSynth = await start();
    const startTime = Tone.now() + 0.05;
    notes.forEach((note, index) => activeSynth.triggerAttackRelease(toToneNote(note, 0), '8n', startTime + index * 0.3));
  };

  const playLoop = async (chords: PlayableChord[], bpm: number, rhythm: Rhythm) => {
    const activeSynth = await start();
    stop();
    const transport = Tone.getTransport();
    transport.bpm.value = bpm;
    transport.loop = true;
    transport.loopStart = 0;
    transport.loopEnd = `${chords.length}m`;
    const voiced = voiceLead(chords);
    const hits = rhythmPattern(rhythm);
    sequence.current = new Tone.Part<{ time: string; notes: string[]; bass?: string }>((time, event) => {
      activeSynth.triggerAttackRelease(event.notes, rhythm === 'straight' ? '2n' : '8n', time);
      if (event.bass) activeSynth.triggerAttackRelease(event.bass, '8n', time, 0.7);
    }, chords.flatMap((chord, index) => hits.map((hit, hitIndex) => ({ time: `${index}:${hit.slice(2)}`, notes: voiced[index], bass: rhythm !== 'straight' && (hitIndex === 0 || hitIndex === 2) ? `${chord.notes[0].pitchClass}2` : undefined }))));
    sequence.current.start(0);
    transport.start('+0.05');
  };

  useEffect(() => { if (reverb.current) reverb.current.wet.value = reverbAmount; }, [reverbAmount]);
  useEffect(() => { synth.current?.dispose(); synth.current = null; }, [instrument]);
  useEffect(() => () => { stop(); synth.current?.dispose(); reverb.current?.dispose(); }, []);
  return { playChord, playScale, playLoop, stop };
}
