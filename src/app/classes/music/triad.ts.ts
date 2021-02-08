import { Note, Interval, Chord } from './note';

export class Triad implements Chord{

    notes: Note[];

    constructor(notes: Note[]) {
        this.notes = notes;
    }

    getTriadName(): string {
        // third major = 2 tones
        // third minor = 1 tone & 1 semitone
        // fifth       = 3 tones & 1 semitone
        let n1 = this.notes[0];
        let n_semitones = 0;
        let semitones_to_third = 0;
        let semitones_to_fifth = 0;
        let done = false;
        while (!done) {
            if (n1.note == this.notes[1].note) {
                semitones_to_third = n_semitones;
            }
            if (n1.note == this.notes[2].note) {
                semitones_to_fifth = n_semitones;
                done = true;
            }
            n1 = n1.addInterval(Interval.semitone);
            n_semitones += 1;
        }
        let chordName = this.notes[0].note;
        let modifier = "";
        if (semitones_to_third == 3 && semitones_to_fifth == 7) {
            modifier = "m";
        } else if (semitones_to_third == 3 && semitones_to_fifth == 6) {
            modifier = 'o';
        } else if (semitones_to_third == 4 && semitones_to_fifth == 7) {
            modifier = ''; // major chord
        } else if (semitones_to_third == 4 && semitones_to_fifth == 8) {
            modifier = '+';
        } else {
            modifier = "(", +semitones_to_third.toString() + ", " + semitones_to_fifth.toString() + ")";
        }
        return chordName + modifier;
    }


    getName(): string {
        return this.getTriadName();
    }

    asString(): string {
        let noteNames: string[];
        for(let k of this.notes)
            noteNames.push(k.toString());
        console.log(noteNames);
        return noteNames.join(", ");
    }
}