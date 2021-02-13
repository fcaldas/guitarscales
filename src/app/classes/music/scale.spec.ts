import { Scale, ScaleTypes } from './scale';
import { Note, NoteName } from './note';

describe('Scale', () => {
  it('should create an instance', () => {
    expect(new Scale(new Note(NoteName.Cs, 3), 
                     ScaleTypes['Natural Minor (Aeolian)'])).toBeTruthy();
  });
});
