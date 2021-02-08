import { Component, OnInit, Input } from '@angular/core';
import { Note, NoteName, Chord, Interval} from './../../classes/music/note';
import { Triad } from '../../classes/music/triad.ts';
import { Tetrad } from '../../classes/music/tetrads.ts';

import * as Tone from 'tone';

@Component({
  selector: 'app-chords-in-scale',
  templateUrl: './chords-in-scale.component.html',
  styleUrls: ['./chords-in-scale.component.css']
})
export class ChordsInScaleComponent implements OnInit {

  @Input()
  selected_notes: Note[];
  @Input()
  voicing: string;

  synth: Tone.PolySynth;

  constructor() { }

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


  getChords(): Chord[] {
    const triads = [];
    let idx = 0;
    for (const note of (this.selected_notes || [])) {
      if (idx !== 7) {
          triads.push(this.get_triad(idx, note));
      }
      idx += 1;
    }
    return triads;
  }


  get_triad(degree: number, note: Note): Triad {
    const triad = [note];
    let sec_degree = degree + 2;
    let third_degree = degree + 4;
    if (sec_degree < this.selected_notes.length) {
      triad.push(this.selected_notes[sec_degree]);
    } else {
      sec_degree -= this.selected_notes.length - 1;
      triad.push(new Note(
        this.selected_notes[sec_degree].note,
        this.selected_notes[sec_degree].degree + 1)
      );
    }

    if (third_degree < this.selected_notes.length) {
      triad.push(this.selected_notes[third_degree]);
    } else {
      third_degree -= this.selected_notes.length - 1;
      triad.push(new Note(
        this.selected_notes[third_degree].note,
        this.selected_notes[third_degree].degree + 1)
      );
    }
    return new Triad(triad);
  }

  playChord(chord: Chord) {
    const now = Tone.now();
    let k = 0;
    for (const n of chord.notes) {
      this.synth.triggerAttackRelease(n.toString(), '8n', now + .1 * k);
      k += 1;
      this.synth.triggerAttackRelease(n.toString(), '8n', now + 1);
    }
  }

  playChorda() {
    console.log("Chorda");
  }
}
