import { start } from 'tone';
import { Note, Interval } from './note';

export class Intervals {

    interval: Array<Interval>;

    constructor(list_of_intervals: Array<Interval>) {
        this.interval = list_of_intervals;
        let sum = 0;
        for (const c of this.interval) {
            sum += c;
        }
        if (sum != 12) {
            throw new Error('Scale does not end on root');
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
        const notes = [this.starting_note];
        let cur_note = this.starting_note;
        for (const i of this.intervals.interval) {
            cur_note = cur_note.addInterval(i);
            notes.push(cur_note);
        }
        return notes;
    }

    toString() {
        const notes: Note[] = this.getNotesInScale();
        const note_names: string[] = [];
        for (const k of notes) {
            note_names.push(k.toString());
        }
        return note_names.toString();
    }
}

const major_scale = new Intervals([Interval.tone, Interval.tone, Interval.semitone,
Interval.tone, Interval.tone, Interval.tone,
Interval.semitone]);

const dorian_mode = new Intervals([Interval.tone, Interval.semitone,
Interval.tone, Interval.tone, Interval.tone,
Interval.semitone, Interval.tone]);

const phrygian_mode = new Intervals([Interval.semitone,
Interval.tone, Interval.tone, Interval.tone,
Interval.semitone, Interval.tone, Interval.tone]);

const lydian_mode = new Intervals([
    Interval.tone, Interval.tone, Interval.tone,
    Interval.semitone, Interval.tone, Interval.tone, Interval.semitone]);

const mixolydian_mode = new Intervals([
    Interval.tone, Interval.tone,
    Interval.semitone, Interval.tone, Interval.tone, Interval.semitone, Interval.tone]);

const natural_minor_scale = new Intervals([Interval.tone, Interval.semitone, Interval.tone, Interval.tone, Interval.semitone, Interval.tone, Interval.tone]);

const locrian_mode = new Intervals([Interval.semitone, Interval.tone, Interval.tone, Interval.semitone, Interval.tone, Interval.tone, Interval.tone]);

const pentatonic_scale = new Intervals([Interval.tone, Interval.tone, Interval.augmented, Interval.tone, Interval.augmented]);

export let ScaleTypes = {
    'Major (Ionian)': major_scale,
    'Dorian (D)': dorian_mode,
    'Phrygian (E)': phrygian_mode,
    'Lydian (F)': lydian_mode,
    'Mixolydian (G)': mixolydian_mode,
    'Natural Minor (Aeolian)': natural_minor_scale,
    'Locrian (B)': locrian_mode,
    Pentatonic: pentatonic_scale
};
