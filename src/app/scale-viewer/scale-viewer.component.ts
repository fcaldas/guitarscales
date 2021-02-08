import { Component, OnInit } from '@angular/core';
import { isString } from 'util';
import { NoteName, Note, getNote } from '../classes/music/note';
import { Scale, ScaleTypes} from '../classes/music/scale';
import {FormControl, FormGroupDirective, NgForm, Validators} from '@angular/forms';
import {ErrorStateMatcher} from '@angular/material/core';
import * as Tone from 'tone';

@Component({
  selector: 'app-scale-viewer',
  templateUrl: './scale-viewer.component.html',
  styleUrls: ['./scale-viewer.component.css']
})
export class ScaleViewerComponent implements OnInit {

  notes: Array<string>;
  synth: Tone.PolySynth;
  scale_names: string[];
  notes_display: Note[];

  constructor() {
    this.notes = Object.keys(NoteName).map(key => NoteName[key]).filter(x => isString(x));
    this.synth = new Tone.PolySynth().toDestination();
    this.scale_names = Object.keys(ScaleTypes);
  }

  selected = new FormControl(null, [
    Validators.required,
    Validators.pattern('.*'),
  ]);

  selected_scale = new FormControl(null, [
    Validators.required,
    Validators.pattern('.*'),
  ]);

  printNote(notename: string): string {
    return notename.replace('s', '#');
  }

  playNote() {
    const root = getNote(this.selected.value);
    const scale = new Scale(root, ScaleTypes[this.selected_scale.value]);
    console.log(scale.toString());

    let t_from_now = 0;
    const now = Tone.now();
    for (const n of scale.getNotesInScale()) {
      this.synth.triggerAttackRelease(n.toString(), '8n', now + t_from_now);
      t_from_now += .5;
    }
  }

  changeSelection() {
    if (this.selected.value && this.selected_scale.value) {
      const root = getNote(this.selected.value);
      const scale = new Scale(root, ScaleTypes[this.selected_scale.value]);
      this.notes_display = scale.getNotesInScale();
      console.log(this.notes_display);
    }
  }

  ngOnInit() {
    this.selected.valueChanges.subscribe((selectedValue) => this.changeSelection());
    this.selected_scale.valueChanges.subscribe((selectedValue) => this.changeSelection());
  }

}
