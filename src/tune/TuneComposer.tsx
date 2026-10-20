import { useEffect, useMemo, useState } from 'react';
import type { Rhythm } from '../RhythmNotation';
import { TuneNotation } from './TuneNotation';
import { DURATION_OPTIONS, advanceTuneCursor, clearTunePosition, noteAtPosition, placeTuneNote, resizeTuneNote, tuneNoteDuration, tunePitchPalette, type TuneCursor, type TuneDurationSteps, type TuneNote } from './tuneModel';
import type { SavedTune } from './tuneStorage';

type ComposerChord = { name: string };
type ComposerScaleNote = { pitchClass: string; name: string };

function NoteValueIcon({ duration }: { duration: TuneDurationSteps }) {
  const open = duration === 4 || duration === 8;
  const stemmed = duration !== 8;
  return <svg className="note-value-icon" viewBox="0 0 32 32" aria-hidden="true">
    <ellipse className={open ? 'open' : ''} cx={duration === 8 ? 16 : 11} cy={duration === 8 ? 18 : 23} rx={duration === 8 ? 7 : 5.5} ry={duration === 8 ? 3.8 : 3.6} transform={`rotate(-12 ${duration === 8 ? 16 : 11} ${duration === 8 ? 18 : 23})`} />
    {stemmed && <path className="note-stem" d="M16 22 V5" />}
    {duration === 1 && <path className="note-flag" d="M16 5 C23 6 25 11 23 15 C22 17 20 18 19 19" />}
    {duration === 3 && <circle className="note-dot" cx="25" cy="22" r="2" />}
  </svg>;
}

function TuneLibrary({ savedTunes, canSave, onSave, onLoad, onDelete }: { savedTunes: SavedTune[]; canSave: boolean; onSave: (name: string) => void; onLoad: (tune: SavedTune) => void; onDelete: (id: string) => void }) {
  const [tuneName, setTuneName] = useState('');
  return <section className="tune-library"><div className="section-title"><div><p className="eyebrow">Saved locally</p><h2>Tune library</h2></div><p>{savedTunes.length} saved</p></div><form className="save-tune" onSubmit={event => { event.preventDefault(); const name = tuneName.trim(); if (!name || !canSave) return; onSave(name); setTuneName(''); }}><label>Tune name<input value={tuneName} maxLength={60} placeholder="e.g. Late night idea" onChange={event => setTuneName(event.target.value)} /></label><button className="play-selected" disabled={!tuneName.trim() || !canSave}>Save tune</button></form>{savedTunes.length ? <div className="saved-tune-list">{savedTunes.map(tune => <article key={tune.id}><div><strong>{tune.name}</strong><span>{tune.root} · {tune.scaleName} · {tune.chords.map(chord => chord.name).join(' – ')}</span><small>{tune.bpm} BPM · {tune.rhythm} · {tune.notes.length} notes</small></div><button className="load-tune" onClick={() => onLoad(tune)}>Load</button><button className="delete-tune" aria-label={`Delete ${tune.name}`} onClick={() => onDelete(tune.id)}>Delete</button></article>)}</div> : <p className="library-empty">Saved tunes will appear here and remain available in this browser.</p>}</section>;
}

export function TuneComposer({ chords, scale, root, bpm, rhythm, notes, savedTunes, playbackMode, activeBar, activeNoteId, onNotesChange, onPlay, onPlayTune, onStop, onGoPractice, onSave, onLoad, onDelete }: {
  chords: ComposerChord[];
  scale: ComposerScaleNote[];
  root: string;
  bpm: number;
  rhythm: Rhythm;
  notes: TuneNote[];
  savedTunes: SavedTune[];
  playbackMode: 'chords' | 'arrangement' | 'melody' | null;
  activeBar: number | null;
  activeNoteId: string | null;
  onNotesChange: (notes: TuneNote[]) => void;
  onPlay: () => void;
  onPlayTune: () => void;
  onStop: () => void;
  onGoPractice: () => void;
  onSave: (name: string) => void;
  onLoad: (tune: SavedTune) => void;
  onDelete: (id: string) => void;
}) {
  const pitches = useMemo(() => tunePitchPalette(scale, root), [root, scale]);
  const [selectedPitch, setSelectedPitch] = useState(pitches[0]?.pitch ?? 'C4');
  const [cursor, setCursor] = useState<TuneCursor>({ bar: 0, step: 0 });
  const [duration, setDuration] = useState<TuneDurationSteps>(2);
  useEffect(() => { if (!pitches.some(pitch => pitch.pitch === selectedPitch)) setSelectedPitch(pitches[0]?.pitch ?? 'C4'); }, [pitches, selectedPitch]);
  useEffect(() => { if (cursor.bar >= chords.length) setCursor({ bar: Math.max(0, chords.length - 1), step: 0 }); }, [chords.length, cursor.bar]);
  const chosenPitch = pitches.find(pitch => pitch.pitch === selectedPitch) ?? pitches[0];
  const selectedNote = noteAtPosition(notes, cursor.bar, cursor.step);
  const beatLabel = `${Math.floor(cursor.step / 2) + 1}${cursor.step % 2 ? ' and' : ''}`;

  const selectPosition = (bar: number, step: number) => {
    const note = noteAtPosition(notes, bar, step);
    setCursor(note ? { bar: note.bar, step: note.step } : { bar, step });
    if (note) {
      setDuration(tuneNoteDuration(note));
      if (pitches.some(pitch => pitch.pitch === note.pitch)) setSelectedPitch(note.pitch);
    }
  };

  const chooseDuration = (nextDuration: TuneDurationSteps) => {
    setDuration(nextDuration);
    if (selectedNote) onNotesChange(resizeTuneNote(notes, selectedNote.id, nextDuration));
  };

  const enterPitch = (pitch: typeof pitches[number]) => {
    setSelectedPitch(pitch.pitch);
    onNotesChange(placeTuneNote(notes, cursor.bar, cursor.step, pitch, duration));
    setCursor(advanceTuneCursor(cursor, duration, chords.length));
  };

  const enterRest = () => {
    onNotesChange(clearTunePosition(notes, cursor.bar, cursor.step, duration));
    setCursor(advanceTuneCursor(cursor, duration, chords.length));
  };

  if (!chords.length) return <main className="composer-page"><section className="composer-empty"><p className="eyebrow">Tune composer</p><h1>Start with some harmony</h1><p>Build or load a chord progression first. Each chord becomes one bar for your melody.</p><button className="play-selected" onClick={onGoPractice}>Choose chords in Practice</button></section><TuneLibrary savedTunes={savedTunes} canSave={false} onSave={onSave} onLoad={onLoad} onDelete={onDelete} /></main>;

  return <main className="composer-page">
    <section className="composer-header"><div><p className="eyebrow">Separate melody workspace</p><h1>Compose a tune</h1><p>Click a place in the staff, choose its rhythm, then enter a pitch. The cursor moves ahead so you can write a phrase naturally.</p></div><div className="composer-transport"><span><b>{bpm}</b> BPM</span><span>{rhythm}</span><button className={`play-selected ${playbackMode === 'arrangement' ? 'is-active' : ''}`} aria-pressed={playbackMode === 'arrangement'} onClick={onPlay}>Chords + tune</button><button className={`tune-only ${playbackMode === 'melody' ? 'is-active' : ''}`} aria-pressed={playbackMode === 'melody'} disabled={!notes.length} onClick={onPlayTune}>Tune only</button><button className="clear" disabled={!playbackMode} onClick={onStop}>Stop</button></div></section>

    <section className="composer-score"><div className="section-title"><div><p className="eyebrow">Write in the score</p><h2>Chords and melody</h2></div><p>Standard notation · treble clef · 4/4</p></div><TuneNotation chords={chords} notes={notes} activeNoteId={activeNoteId} selectedBar={cursor.bar} selectedStep={cursor.step} onSelectPosition={selectPosition} /><p className="score-edit-hint">Click between the bar lines to move the violet insertion cursor.</p></section>

    <section className="composer-editor">
      <div className="phrase-cursor"><div><p className="eyebrow">Insertion point</p><strong>Bar {cursor.bar + 1} · beat {beatLabel}</strong><span>{selectedNote ? `${selectedNote.label} · ${DURATION_OPTIONS.find(option => option.steps === tuneNoteDuration(selectedNote))?.label.toLowerCase()}` : `Rest under ${chords[cursor.bar]?.name}`}</span></div><div className="duration-palette" role="group" aria-label="Note duration">{DURATION_OPTIONS.map(option => <button type="button" key={option.steps} className={duration === option.steps ? 'selected' : ''} aria-label={option.label} aria-pressed={duration === option.steps} onClick={() => chooseDuration(option.steps)}><NoteValueIcon duration={option.steps} /><span>{option.label}</span></button>)}</div><div className="cursor-actions"><button type="button" className="rest-note" onClick={enterRest}>Add rest</button><button type="button" className="delete-note" disabled={!selectedNote} onClick={() => selectedNote && onNotesChange(clearTunePosition(notes, selectedNote.bar, selectedNote.step))}>Delete note</button></div></div>
      <div className="composer-toolbox"><div><p className="eyebrow">Enter a pitch</p><h2>{root} scale</h2><span>Clicking a note writes it at the cursor.</span></div><div className="pitch-palette" role="group" aria-label="Melody pitch">{pitches.map(pitch => <button type="button" aria-pressed={pitch.pitch === chosenPitch?.pitch} className={pitch.pitch === chosenPitch?.pitch ? 'selected' : ''} key={pitch.pitch} onClick={() => enterPitch(pitch)}>{pitch.label}</button>)}</div><button className="clear" disabled={!notes.length} onClick={() => onNotesChange([])}>Clear tune</button></div>
      <div className="phrase-overview" aria-label="Phrase overview">{chords.map((chord, bar) => { const barNotes = notes.filter(note => note.bar === bar); return <button type="button" className={`${cursor.bar === bar ? 'is-selected' : ''} ${activeBar === bar ? 'is-playing' : ''}`} onClick={() => selectPosition(bar, 0)} key={`${chord.name}-${bar}`}><span>Bar {bar + 1}</span><strong>{chord.name}</strong><small>{barNotes.length ? barNotes.map(note => note.label).join(' · ') : 'No melody yet'}</small></button>; })}</div>
    </section>

    <TuneLibrary savedTunes={savedTunes} canSave={Boolean(notes.length)} onSave={onSave} onLoad={onLoad} onDelete={onDelete} />
  </main>;
}
