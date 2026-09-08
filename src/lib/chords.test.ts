import { describe, expect, it } from 'vitest';
import { chordToneNames, createSongSteps, extractChordSequence, transposeChord } from './chords';

describe('chords', () => {
  it('preserves accidentals while extracting chord lines', () => {
    expect(extractChordSequence('Cm G# A# Fm')).toEqual(['Cm', 'G#', 'A#', 'Fm']);
  });

  it('transposes the whole progression to the requested key', () => {
    expect(createSongSteps(['C', 'G', 'Am', 'F'], 2).map((step) => step.chord)).toEqual(['D', 'A', 'Bm', 'G']);
  });

  it('transposes slash chords', () => {
    expect(transposeChord('D/F#', 2)).toBe('E/G#');
  });

  it('returns playable chord tones for the rhythm mode', () => {
    expect(chordToneNames('Am')).toEqual(['A', 'C', 'E']);
  });
});
