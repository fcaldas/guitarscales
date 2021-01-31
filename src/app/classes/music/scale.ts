import { start } from "tone";
import { Note, Interval } from './note';

export class Intervals {

    interval: Array<Interval>;

    constructor(list_of_intervals: Array<Interval>) {
        this.interval = list_of_intervals;
        let sum = 0;
        for (let c of this.interval) {
            sum += c;
        }
        if (sum != 12) {
            throw new Error("Scale does not end on root");
        }

    }
}

export class Scale {

    starting_note: Note;
    intervals: Intervals;

    constructor(starting_note: Note, intervals: Intervals) {
        this.starting_note = starting_note;
        this.intervals = intervals;
    }

    getNotesInScale(): Note[] {
        let notes = [this.starting_note];
        let cur_note = this.starting_note;
        for (let i of this.intervals.interval) {
            cur_note = cur_note.addInterval(i);
            notes.push(cur_note);
        }
        return notes;
    }

    toString() {
        let notes: Note[] = this.getNotesInScale();
        let note_names: string[] = [];
        for (let k of notes) {
            note_names.push(k.toString());
        }
        return note_names.toString();
    }
}

var major_scale = new Intervals([Interval.tone, Interval.tone, Interval.semitone,
Interval.tone, Interval.tone, Interval.tone,
Interval.semitone]);

var dorian_mode = new Intervals([Interval.tone, Interval.semitone,
Interval.tone, Interval.tone, Interval.tone,
Interval.semitone, Interval.tone])

var phrygian_mode = new Intervals([Interval.semitone,
Interval.tone, Interval.tone, Interval.tone,
Interval.semitone, Interval.tone, Interval.tone])

var lydian_mode = new Intervals([
    Interval.tone, Interval.tone, Interval.tone,
    Interval.semitone, Interval.tone, Interval.tone, Interval.semitone])

var mixolydian_mode = new Intervals([
    Interval.tone, Interval.tone,
    Interval.semitone, Interval.tone, Interval.tone, Interval.semitone, Interval.tone])

var natural_minor_scale = new Intervals([Interval.tone, Interval.semitone, Interval.tone, Interval.tone, Interval.semitone, Interval.tone, Interval.tone]);

var locrian_mode = new Intervals([Interval.semitone, Interval.tone, Interval.tone, Interval.semitone, Interval.tone, Interval.tone, Interval.tone])

var pentatonic_scale = new Intervals([Interval.tone, Interval.tone, Interval.augmented, Interval.tone, Interval.augmented]);

export var ScaleTypes = {
    "Major (Ionian)": major_scale,
    "Dorian (D)": dorian_mode,
    "Phrygian (E)": phrygian_mode,
    "Lydian (F)": lydian_mode,
    "Mixolydian (G)": mixolydian_mode,
    "Natural Minor (Aeolian)": natural_minor_scale,
    "Locrian (B)": locrian_mode,
    "Pentatonic": pentatonic_scale
};
