import { describe, expect, it } from 'vitest';
import { vexDurationCode } from './TuneNotation';

describe('tune notation durations', () => {
  it('gives a dotted crotchet its full three-quaver VexFlow duration', () => {
    expect(vexDurationCode(3)).toBe('qd');
  });

  it('maps the remaining British note values onto VexFlow durations', () => {
    expect([1, 2, 4, 8].map(vexDurationCode)).toEqual(['8', 'q', 'h', 'w']);
  });
});
