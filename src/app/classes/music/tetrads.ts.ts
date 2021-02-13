import {Note, Chord, Interval} from './note';

export class Tetrad implements Chord {

    notes: Note[];

    constructor(notes: Note[]) {
        this.notes = notes;
    }

    getName(): string {
        return this.getTetradName();
    }

    getTetradName(): string {
        // third major = 2 tones
        // third minor = 1 tone & 1 semitone
        // fifth       = 3 tones & 1 semitone
        let n1 = this.notes[0];
        let n_semitones = 0;
        let semitones_to_third = 0;
        let semitones_to_fifth = 0;
        let semitones_to_seventh = 0;
        let done = false;
        while (!done) {
            if (n1.note == this.notes[1].note) {
                semitones_to_third = n_semitones;
            }
            if (n1.note == this.notes[2].note) {
                semitones_to_fifth = n_semitones;
            }
            if (n1.note == this.notes[3].note) {
                semitones_to_seventh = n_semitones;
                done = true;
            }
            n1 = n1.addInterval(Interval.semitone);
            n_semitones += 1;
        }
        const chordName = this.notes[0].note;
        
        let naming_map = {
            'maj7': [0, 4, 7, 11],
            'min7': [0, 3, 7, 10],
            '7': [0, 4, 7, 10],
            'dim7': [0, 3, 6, 9],
            'halfdim7': [0, 3, 6, 10],
            'minmaj7': [0, 3, 7, 11],
            'maj7#5': [0, 4, 8, 11],
            'aug7': [0, 4, 8, 10]
        }
        let int_notation = [0, semitones_to_third, semitones_to_fifth, semitones_to_seventh];
        for(let k in naming_map) {
            console.log(k);
            if(naming_map[k].toString() === int_notation.toString())
                return chordName + k;
        }
        return chordName + int_notation.toString();
    }


    asString(): string {
        return this.notes.toString();
    }
}
