import { Component, OnInit } from '@angular/core';
import { isString } from 'util';
import { NoteName, Note, getNote, Chord } from '../classes/music/note';
import { Scale, ScaleTypes} from '../classes/music/scale';
import {FormControl, FormGroupDirective, NgForm, Validators} from '@angular/forms';
import {ErrorStateMatcher} from '@angular/material/core';
import * as Tone from 'tone';
import { not } from '@angular/compiler/src/output/output_ast';

@Component({
  selector: 'app-scale-viewer',
  templateUrl: './scale-viewer.component.html',
  styleUrls: ['./scale-viewer.component.css']
})
export class ScaleViewerComponent implements OnInit {

  notes: Array<string>;
  synth: Tone.PolySynth;
  scale_names: string[];
  notes_display: Set<NoteName>;
  highlightedNotes: Set<NoteName>;
  rootNote: NoteName;
  currentScale: Scale;

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

  selected_voicing = new FormControl("triad", [
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
      this.rootNote = root.note;
      const scale = new Scale(root, ScaleTypes[this.selected_scale.value]);
      this.notes_display = new Set<NoteName>();
      for(let n of scale.getNotesInScale()) {
        this.notes_display.add(n.note);
      }
      this.currentScale = scale;
    }
  }

  ngOnInit() {
    this.selected.valueChanges.subscribe((selectedValue) => this.changeSelection());
    this.selected_scale.valueChanges.subscribe((selectedValue) => this.changeSelection());
  }

  highlight(chord: Chord) {
    // highlight notes in chord
    let noteSet: Set<NoteName> = new Set<NoteName>();
    for(let k of chord.notes) {
      noteSet.add(k.note);
    }
    this.highlightedNotes = noteSet;
  }

}
