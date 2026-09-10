import { describe, it, expect } from "vitest";
import {
  BEGINNER_SONGS,
  BLUES_SONGS,
  LESSONS,
  SONGS,
  lessonSections,
} from "./repertoire";
import { noteMidi, midiFrequency } from "./blues";
import { detectPitch } from "./pitch";

describe("repertoire integrity", () => {
  it("has contiguous, selectable sections and playable finger positions for all nine songs", () => {
    expect(SONGS).toHaveLength(9);
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(22);
    for (const lesson of SONGS) {
      expect(lesson.youtube).toMatch(
        /^https:\/\/www.youtube.com\/watch\?v=[\w-]{11}$/,
      );
      expect(lesson.notes.length).toBeGreaterThan(100);
      let next = 0;
      for (const section of lessonSections(lesson)) {
        expect(section.start).toBe(next);
        expect(section.end).toBeGreaterThanOrEqual(section.start);
        next = section.end + 1;
      }
      expect(next).toBe(lesson.notes.length);
      for (const n of lesson.notes) {
        expect(n.string).toBeGreaterThanOrEqual(1);
        expect(n.string).toBeLessThanOrEqual(6);
        expect(n.fret).toBeGreaterThanOrEqual(0);
        expect(n.fret).toBeLessThanOrEqual(12);
        expect(n.finger).toBeGreaterThanOrEqual(n.fret ? 1 : 0);
        expect(n.finger).toBeLessThanOrEqual(4);
        if (!n.fret) expect(n.finger).toBe(0);
      }
    }
  });
  it("starts with five recognizable beginner melodies and keeps their rhythm data", () => {
    expect(BEGINNER_SONGS).toHaveLength(5);
    expect(LESSONS.slice(0, BEGINNER_SONGS.length)).toEqual(BEGINNER_SONGS);
    for (const lesson of BEGINNER_SONGS) {
      expect(["Primeiros passos", "Fácil"]).toContain(lesson.level);
      expect(lesson.kind).toBe("Melodia");
      expect(lesson.bpm).toBeGreaterThan(0);
      expect(lesson.notes.length).toBeGreaterThan(20);
      expect(lesson.youtube).toMatch(
        /^https:\/\/www.youtube.com\/watch\?v=[\w-]{11}$/,
      );
      expect(lesson.notes.every((note) => (note.beats ?? 0) > 0)).toBe(true);
      expect(Math.max(...lesson.notes.map((note) => note.fret))).toBeLessThanOrEqual(3);
    }
  });
  it("teaches the blues as complete musical forms instead of isolated notes", () => {
    expect(BLUES_SONGS).toHaveLength(3);
    for (const lesson of BLUES_SONGS) {
      expect(lesson.kind).toBe("Blues");
      expect(lesson.bpm).toBeGreaterThan(0);
      expect(lesson.sections).toHaveLength(12);
      expect(lesson.notes.length).toBeGreaterThan(40);
      for (const section of lesson.sections ?? []) {
        const beats = lesson.notes
          .slice(section.start, section.end + 1)
          .reduce((total, note) => total + (note.beats ?? 1), 0);
        expect(beats, `${lesson.id} ${section.title}`).toBeCloseTo(4, 5);
      }
      expect(
        lesson.sections?.[lesson.sections.length - 1]?.title.toLocaleLowerCase(),
      ).toMatch(
        /volta|turnaround/,
      );
    }
  });
  it("detects all repertoire pitches including the high B in the King introduction", () => {
    for (const sampleRate of [44100, 48000]) {
      for (const midi of new Set(SONGS.flatMap((s) => s.notes.map(noteMidi)))) {
        const frequency = midiFrequency(midi);
        const buffer = Float32Array.from(
          { length: 4096 },
          (_, i) =>
            0.15 * Math.sin((2 * Math.PI * frequency * i) / sampleRate) +
            0.03 * Math.sin((4 * Math.PI * frequency * i) / sampleRate),
        );
        const detected = detectPitch(buffer, sampleRate);
        expect(detected).not.toBeNull();
        expect(
          Math.abs(1200 * Math.log2(detected!.frequency / frequency)),
        ).toBeLessThan(3);
      }
    }
  });
});
