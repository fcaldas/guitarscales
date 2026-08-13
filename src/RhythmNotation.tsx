import { Dot, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow';
import { useEffect, useRef } from 'react';

export type Rhythm = 'straight' | 'bossa' | 'swing' | 'samba';

const BAR_COUNT = 4;
const BAR_WIDTH = 104;
const NOTATION_WIDTH = BAR_COUNT * BAR_WIDTH + 12;

function barNotes(rhythm: Rhythm) {
  const chordHit = (duration: string, dotted = false) => {
    const note = new StaveNote({ keys: ['b/4'], duration });
    if (dotted) Dot.buildAndAttach([note], { all: true });
    return note;
  };

  if (rhythm === 'bossa') return [chordHit('q', true), chordHit('q'), chordHit('q'), chordHit('8')];
  if (rhythm === 'swing') return [chordHit('q', true), chordHit('8'), chordHit('q'), chordHit('q')];
  if (rhythm === 'samba') return [chordHit('q'), chordHit('q', true), chordHit('8'), chordHit('q')];
  return [chordHit('w')];
}

export function RhythmNotation({ rhythm }: { rhythm: Rhythm }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    container.current.replaceChildren();
    const renderer = new Renderer(container.current, Renderer.Backends.SVG);
    renderer.resize(NOTATION_WIDTH, 100);
    const context = renderer.getContext();

    Array.from({ length: BAR_COUNT }, (_, index) => {
      const stave = new Stave(6 + index * BAR_WIDTH, 22, BAR_WIDTH);
      if (index === 0) stave.addTimeSignature('4/4');
      stave.setContext(context).draw();
      const voice = new Voice({ numBeats: 4, beatValue: 4 }).setStrict(false).addTickables(barNotes(rhythm));
      new Formatter().joinVoices([voice]).format([voice], index === 0 ? 62 : 92);
      voice.draw(context, stave);
    });
  }, [rhythm]);

  const description = { bossa: 'syncopated bossa comping', swing: 'laid-back swing comping', samba: 'driving samba comping', straight: 'one chord per bar' }[rhythm];
  return <div className="rhythm-notation" aria-label={`${description} shown over four bars`}>
    <span>4-bar rhythm</span>
    <div className="notation-canvas" ref={container} />
    <small>{description}</small>
  </div>;
}
