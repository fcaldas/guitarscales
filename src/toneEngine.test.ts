import { describe, expect, it } from 'vitest';
import { INSTRUMENT_PRESETS, melodyDuration, melodyEventTime, rhythmPattern, voiceLead } from './toneEngine';

const note = (pitchClass: string) => ({ pitchClass, name: pitchClass });

describe('tone engine presets', () => {
  it('provides the three selectable instruments', () => {
    expect(Object.keys(INSTRUMENT_PRESETS)).toEqual(['nylon', 'electric', 'organ']);
  });

  it('uses a distinct oscillator for each instrument', () => {
    expect(new Set(Object.values(INSTRUMENT_PRESETS).map(preset => preset.oscillator)).size).toBe(3);
  });
});

describe('tone engine rhythm patterns', () => {
  it('keeps straight feel to one chord hit per bar', () => {
    expect(rhythmPattern('straight')).toEqual(['0:0']);
  });

  it('schedules four syncopated hits for bossa nova', () => {
    expect(rhythmPattern('bossa')).toEqual(['0:0', '0:1:2', '0:2:2', '0:3:2']);
  });

  it('places melody eighth notes on the transport grid', () => {
    expect([0, 1, 2, 7].map(step => melodyEventTime(2, step))).toEqual(['2:0:0', '2:0:2', '2:1:0', '2:3:2']);
  });

  it('maps score durations to Tone notation', () => {
    expect([1, 2, 3, 4, 8].map(melodyDuration)).toEqual(['8n', '4n', '4n.', '2n', '1n']);
  });
});

describe('tone engine voice leading', () => {
  it('creates playable full voicings for every chord in a ii–V–I', () => {
    const chords = [
      { notes: [note('D'), note('F'), note('A'), note('C')] },
      { notes: [note('G'), note('B'), note('D'), note('F')] },
      { notes: [note('C'), note('E'), note('G'), note('B')] },
    ];
    const voiced = voiceLead(chords);
    expect(voiced).toHaveLength(3);
    expect(voiced.every(chord => chord.length === 4)).toBe(true);
    expect(voiced.flat().every(noteName => /^[A-G]#?\d$/.test(noteName))).toBe(true);
  });
});
