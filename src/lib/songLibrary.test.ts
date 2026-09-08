import { describe, expect, it } from 'vitest';
import { LESSON_LIBRARY, lessonProgress, transposeLesson } from './songLibrary';

describe('song library', () => {
  it('keeps a playable built-in lesson available', () => {
    const song = LESSON_LIBRARY[0];

    expect(song.title).toBe('Rolling in the Deep');
    expect(song.steps.length).toBeGreaterThan(20);
    expect(song.steps[0]).toMatchObject({ section: 'Intro', chord: 'Cm', target: 'C' });
  });

  it('transposes the lesson chords and target notes together', () => {
    const transposed = transposeLesson(LESSON_LIBRARY[0], 2);

    expect(transposed.steps[0]).toMatchObject({ chord: 'Dm', target: 'D' });
  });

  it('includes the two pasted lessons in the built-in library', () => {
    expect(LESSON_LIBRARY.map((song) => song.id)).toEqual([
      'rolling-in-the-deep-training',
      'em-tab-training',
      'nada-igual-training'
    ]);
    expect(LESSON_LIBRARY[1].steps[0]).toMatchObject({ chord: 'E', target: 'E' });
    expect(LESSON_LIBRARY[2].steps[0]).toMatchObject({ chord: 'G7M', target: 'G' });
  });

  it('maps the current lesson step to a full progress range', () => {
    expect(lessonProgress(0, 4)).toBe(0);
    expect(lessonProgress(3, 4)).toBe(100);
    expect(lessonProgress(0, 1)).toBe(100);
  });
});
