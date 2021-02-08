import { Component, OnInit, Input } from '@angular/core';
import { Note, NoteName, Interval } from 'src/app/classes/music/note';

@Component({
  selector: 'app-guitar-scale',
  templateUrl: './guitar-scale.component.html',
  styleUrls: ['./guitar-scale.component.css']
})
export class GuitarScaleComponent implements OnInit {

  constructor() { }

  @Input()
  selected_notes: Note[];

  stringHeights = [20, 50, 80, 110, 137, 165];
  frets = [0, 0.083, 0.166, 0.249, 0.333, 0.416, 0.5, 0.583, 0.666, 0.75, 0.833, 0.916, 1];

  notes_in_string = [
    new Note(NoteName.E, 4),
    new Note(NoteName.B, 3),
    new Note(NoteName.G, 3),
    new Note(NoteName.D, 3),
    new Note(NoteName.A, 2),
    new Note(NoteName.E, 2),
  ];

  ngOnInit() {
  }

  generate_notes_in_string(first_note): Note[] {
    const notes_in_string: Note[] = [first_note];
    for (let i = 0; i < 12; i++) {
      notes_in_string.push(notes_in_string[i].addInterval(Interval.semitone));
    }
    return notes_in_string;
  }

  getClassForNote(note) {
    if (this.selected_notes == null) {
      return 'noteOnFret';
    }
    for (const n of this.selected_notes) {
      if (note.note == n.note) {
        return 'selectedNote';
      }
    }
    return 'noteOnFret';
  }

  getClassForMarker(note) {
    if (this.selected_notes == null) {
      return 'invisibleMarker';
    }
    for (const i in this.selected_notes) {
      if (note.note == this.selected_notes[i].note) {
        if (i == '0') {
          return 'rootMarker';
        }
        return 'selectedMarker';
      }
    }
    return 'invisibleMarker';

  }

  // Gets the position for a note in the fret
  getNotePos(i, isMark) {
    if (i == 0) {
      return '0%';
    } else {
      if (isMark) {
        return (this.frets[i] * 100 - 3.5) + '%';
      } else {
        return (this.frets[i] * 100 - 4.5) + '%';
      }
    }
  }
}
