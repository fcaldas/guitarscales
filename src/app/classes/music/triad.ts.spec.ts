import { Triad } from './triad.ts';
import { Note, NoteName } from './note';


describe('Triad.Ts', () => {
  it('should create an instance', () => {
    expect(new Triad([])).toBeTruthy();
  });
  it('should name chords correctly', () => {
    expect((new Triad([
      new Note(NoteName.Cs, 4),
      new Note(NoteName.E, 4),
      new Note(NoteName.Gs, 4)])).getName()).toMatch("C#m");
  })
});
