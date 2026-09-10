import { describe, it, expect } from "vitest";
import {
  BLUES,
  noteMidi,
  midiFrequency,
  possiblePositions,
  STRINGS,
} from "./blues";
import { LessonFollower } from "./lessonFollower";
import { detectPitch } from "./pitch";

export function wave(frequency: number, rate = 48000, gain = 0.15, offset = 0) {
  const signal = new Float32Array(4096);
  for (let i = 0; i < signal.length; i++) {
    const t = (i + offset) / rate;
    signal[i] =
      gain *
      (Math.sin(2 * Math.PI * frequency * t) +
        0.4 * Math.sin(4 * Math.PI * frequency * t) +
        0.15 * Math.sin(6 * Math.PI * frequency * t));
  }
  return signal;
}
describe("blues audio smoke", () => {
  it.each([44100, 48000])(
    "calibrates every lesson pitch at %i Hz within 3 cents",
    (rate) => {
      for (const midi of new Set(BLUES.flatMap((l) => l.notes.map(noteMidi)))) {
        const expected = midiFrequency(midi);
        const pitch = detectPitch(wave(expected, rate), rate);
        expect(pitch, `MIDI ${midi}`).not.toBeNull();
        expect(
          Math.abs(1200 * Math.log2(pitch!.frequency / expected)),
        ).toBeLessThan(3);
      }
    },
  );
  it("finishes all five tabs through the actual detector without duplicated sustained hits", () => {
    for (const lesson of BLUES) {
      const follower = new LessonFollower();
      let now = 0;
      let index = 0;
      let hits = 0;
      for (const expected of lesson.notes) {
        for (let i = 0; i < 5; i++) {
          follower.push(null, noteMidi(expected), now);
          now += 50;
        }
        const acceptedMidi = noteMidi(expected);
        for (let i = 0; i < 20; i++) {
          const target = noteMidi(
            lesson.notes[Math.min(index, lesson.notes.length - 1)],
          );
          const pitch = detectPitch(
            wave(
              midiFrequency(acceptedMidi),
              48000,
              0.15 * Math.exp(-i * 0.06),
              i * 2400,
            ),
            48000,
          );
          const result = follower.push(pitch, target, now);
          now += 50;
          if (result.advance) {
            index++;
            hits++;
          }
          if (index > hits) throw new Error("Unexpected advancement");
          if (i > 4) expect(result.feedback).toBe("sustain");
        }
      }
      expect(index).toBe(lesson.notes.length);
      expect(hits).toBe(lesson.notes.length);
    }
  });
  it("rejects wrong notes, wrong octaves and detuned notes", () => {
    for (const offset of [100, 1200, -1200, 35, -35]) {
      const follower = new LessonFollower();
      let last;
      for (let i = 0; i < 10; i++) {
        const pitch = detectPitch(
          wave(midiFrequency(52) * 2 ** (offset / 1200)),
          48000,
        );
        last = follower.push(pitch, 52, i * 50);
        expect(last.advance).toBe(false);
      }
      expect(last!.feedback).toBe(
        Math.abs(offset) < 50 ? "intonation" : "wrong",
      );
    }
  });
  it("allows a new different note while the last accepted note has sustained", () => {
    const follower = new LessonFollower();
    for (let i = 0; i < 4; i++)
      follower.push(
        { frequency: midiFrequency(40), rms: 0.1, clarity: 1 },
        40,
        i * 50,
      );
    expect(
      follower.push(
        { frequency: midiFrequency(40), rms: 0.08, clarity: 1 },
        47,
        300,
      ).feedback,
    ).toBe("sustain");
    let result;
    for (let i = 0; i < 4; i++)
      result = follower.push(
        { frequency: midiFrequency(47), rms: 0.1, clarity: 1 },
        47,
        350 + i * 50,
      );
    expect(result!.advance).toBe(true);
  });
  it("accepts the first reliable pitch frame from a fresh attack", () => {
    const follower = new LessonFollower();
    const result = follower.push(
      { frequency: midiFrequency(45), rms: 0.08, clarity: 0.92 },
      45,
      500,
      440,
      2,
    );
    expect(result).toMatchObject({
      advance: true,
      feedback: "correct",
      midi: 45,
    });
  });
  it("does not treat a pre-existing detector onset as the first pluck", () => {
    const follower = new LessonFollower();
    follower.reset(7);
    const oldSound = {
      frequency: midiFrequency(45),
      rms: 0.1,
      clarity: 1,
    };
    expect(follower.push(oldSound, 45, 500, 440, 7).advance).toBe(false);
    expect(follower.push(oldSound, 45, 550, 440, 7).advance).toBe(false);
    expect(
      follower.push(oldSound, 45, 600, 440, 8).advance,
    ).toBe(true);
  });
  it("never accepts silence and requires a new articulation for repeated notes", () => {
    const follower = new LessonFollower();
    const pitch = { frequency: 110, rms: 0.1, clarity: 1 };
    for (let i = 0; i < 4; i++) follower.push(pitch, 45, i * 50);
    expect(follower.push(pitch, 45, 400).advance).toBe(false);
    follower.push(null, 45, 450);
    follower.push(null, 45, 650);
    let result;
    for (let i = 0; i < 4; i++) result = follower.push(pitch, 45, 700 + i * 50);
    expect(result!.advance).toBe(true);
  });
  it("does not pretend that pitch determines one physical string", () => {
    expect(possiblePositions(64).length).toBeGreaterThan(1);
    expect(possiblePositions(40)).toEqual([{ string: 6, fret: 0 }]);
    for (const lesson of BLUES)
      for (const note of lesson.notes) {
        expect(note.fret).toBeGreaterThanOrEqual(0);
        expect(note.fret).toBeLessThanOrEqual(4);
        expect(noteMidi(note)).toBe(STRINGS[note.string - 1] + note.fret);
      }
  });
});
