import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Note, NoteName, Chord, Interval } from './../../classes/music/note';
import { Scale } from './../../classes/music/scale';
import { Triad } from '../../classes/music/triad';
import { Tetrad } from '../../classes/music/tetrads';

import * as Tone from 'tone';

@Component({
  selector: 'app-chords-in-scale',
  templateUrl: './chords-in-scale.component.html',
  styleUrls: ['./chords-in-scale.component.css']
})
export class ChordsInScaleComponent implements OnInit {

  @Input()
  selectedScale: Scale;
  @Input()
  synth: Tone.PolySynth;
  @Output()
  highlightChord: EventEmitter<Chord>;

  constructor() {
    this.highlightChord = new EventEmitter<Chord>();
  }

  ngOnInit() {
    this.synth = new Tone.PolySynth(

    ).toDestination();
    this.synth.set({
      envelope: {
        attack: .015,
        sustain: .1,
      }
    });

  }


  getChords(voicing: "triad" | "tetrad"): Chord[] {
    if(this.selectedScale == null)
      return [];
    const triads = [];
    let idx = 0;
    for (const note of this.selectedScale.getNotesInScale()) {
      if (idx !== 7) {
        if (voicing == "triad") {
          triads.push(this.get_triad(idx, note));
        } else if (voicing == "tetrad") {
          triads.push(this.get_tetrad(idx, note));
        }
      }
      idx += 1;
    }
    return triads;
  }

  get_tetrad(degree: number, note: Note): Tetrad {
    const tetrad = [note];
    let sec_degree = degree + 2;
    let third_degree = degree + 4;
    let fourth_degree = degree + 6;
    let notes: Note[] = this.selectedScale.getNotesInScale();
    if (sec_degree < notes.length) {
      tetrad.push(notes[sec_degree]);
    } else {
      sec_degree -= notes.length - 1;
      tetrad.push(new Note(
        notes[sec_degree].note,
        notes[sec_degree].degree + 1)
      );
    }

    if (third_degree < notes.length) {
      tetrad.push(notes[third_degree]);
    } else {
      third_degree -= notes.length - 1;
      tetrad.push(new Note(
        notes[third_degree].note,
        notes[third_degree].degree + 1)
      );
    }

    if (fourth_degree < notes.length) {
      tetrad.push(notes[fourth_degree]);
    } else {
      fourth_degree -= notes.length - 1;
      tetrad.push(new Note(
        notes[fourth_degree].note,
        notes[fourth_degree].degree + 1)
      );
    }
    return new Tetrad(tetrad);
  }

  get_triad(degree: number, note: Note): Triad {
    const triad = [note];
    let sec_degree = degree + 2;
    let third_degree = degree + 4;
    let notes: Note[] = this.selectedScale.getNotesInScale();
    if (sec_degree < notes.length) {
      triad.push(notes[sec_degree]);
    } else {
      sec_degree -= notes.length - 1;
      triad.push(new Note(
        notes[sec_degree].note,
        notes[sec_degree].degree + 1)
      );
    }

    if (third_degree < notes.length) {
      triad.push(notes[third_degree]);
    } else {
      third_degree -= notes.length - 1;
      triad.push(new Note(
        notes[third_degree].note,
        notes[third_degree].degree + 1)
      );
    }
    return new Triad(triad);
  }

  playChord(chord: Chord) {
    this.highlightChord.emit(chord);
    console.log("Playing..");
    console.log(chord);
    const now = Tone.now();
    let k = 0;
    for (const n of chord.notes) {
      this.synth.triggerAttackRelease(n.toString(), '8n', now + (.1 * k));
      k += 1;
    }
  }

}
