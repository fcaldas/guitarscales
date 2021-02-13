import { Note, NoteName } from './note';

describe('Note', () => {
  it('should create an instance', () => {
    expect(new Note(NoteName.B, 4)).toBeTruthy();
  });
});
