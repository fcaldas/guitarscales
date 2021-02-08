import {Note, Chord} from './note';

export class Tetrad implements Chord{

    notes: Note[];

    constructor(notes: Note[]){
        this.notes = notes;
    }


    getTetradName() : string {
        return "";
    }
    
    getName(): string {
        return this.getTetradName();
    }

    asString(): string {
        return this.notes.toString();
    }
}
