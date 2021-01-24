export enum NoteName{
    // Ab="Ab",
    A="A",
    As="A#",
    // Bb="Bb",
    B="B",
    Bs="Bs",
    // Cb="Cb",
    C="C",
    Cs="C#",
    // Db="Db",
    D="D",
    Ds="D#",
    // Eb="Eb",
    E="E",
    Es="E#",
    // Fb="Fb",
    F="F",
    Fs="F#",
    // Gb="Gb",
    G="G",
    Gs="G#"
}

export function getNote(name: string) : Note{
    name = name.replace("#", "s");
    return new Note(NoteName[name], 4);
}

export enum Interval {
    semitone= 1,
    tone= 2,
    augmented= 3,
}

const NoteValues = {
    [NoteName.C]: 0,
    [NoteName.Cs]: 1,
    //[NoteName.Db]: 1,
    [NoteName.D]: 2,
    [NoteName.Ds]: 3,
    //[NoteName.Eb]: 3,
    [NoteName.E]: 4,
    [NoteName.Es]: 5,
    //[NoteName.Fb]: 4,
    [NoteName.F]: 5,
    [NoteName.Fs]: 6,
    //[NoteName.Gb]: 6,
    [NoteName.G]: 7,
    [NoteName.Gs]:8,
    //[NoteName.Ab]:8,
    [NoteName.A]: 9,
    [NoteName.As]: 10,
    //[NoteName.Bb]: 10,
    [NoteName.B]: 11,
    //[NoteName.Bs]: 0,
    //[NoteName.Cb]: 11,
}

let invert = function(){
    let c = {};
    for(let k of Object.keys(NoteValues)){
        c[NoteValues[k]] = k;
    }
    return c;
};


const ValueToNotes = invert();

export class Note {
    note: NoteName;
    degree: number;

    constructor(note: NoteName, degree=4){
        this.note = note;
        this.degree = degree;
    }

    toString(){
        return this.note.toString().replace("s", "#") + this.degree.toString();
    }

    addInterval(transition: Interval) : Note{
        let value = (NoteValues[this.note] + transition);
        if (value > 11){
            value -= 12;
            return new Note(ValueToNotes[value], this.degree + 1);
        }
        return new Note(ValueToNotes[value], this.degree);
    }
}

export function getTriadName(notes: Note[]): string{
    // third major = 2 tones
    // third minor = 1 tone & 1 semitone
    // fifth       = 3 tones & 1 semitone
    let n1 = notes[0];
    let n_semitones = 0;
    let semitones_to_third = 0;
    let semitones_to_fifth = 0;
    let done = false;
    while(!done){
        if(n1.note == notes[1].note){
            semitones_to_third = n_semitones;
        }
        if(n1.note == notes[2].note){
            semitones_to_fifth = n_semitones;
            done = true;
        }
        n1 = n1.addInterval(Interval.semitone);
        n_semitones += 1;
    }
    let chordName = notes[0].note;
    let modifier = "";
    if (semitones_to_third == 3){
        modifier = "m";
        if(semitones_to_fifth == 6){
            modifier = 'o';
        }
    }else if(semitones_to_third == 4 && semitones_to_fifth == 8){
        modifier = '+';
    }
    return chordName + modifier + semitones_to_third.toString() + "," + semitones_to_fifth.toString();
}