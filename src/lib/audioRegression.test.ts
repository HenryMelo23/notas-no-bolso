import { describe, it, expect } from "vitest";
import { detectPitch } from "./pitch";
import { PitchStabilizer } from "./pitchStability";
import { LessonFollower } from "./lessonFollower";
import { STRINGS, midiFrequency } from "./blues";
const tone = (midi: number, rms = 0.1) => ({
  frequency: midiFrequency(midi),
  rms,
  clarity: 0.98,
});
describe("audio regression: accuracy and sustain", () => {
  it("measures quiet decaying strings beyond 1.5 seconds without freezing the frequency", () => {
    for (const rate of [44100, 48000])
      for (const midi of STRINGS) {
        const stable = new PitchStabilizer();
        for (let frame = 0; frame < 140; frame++) {
          const t = frame * 0.05;
          const f = midiFrequency(midi) * 2 ** ((t > 3 ? -8 : 0) / 1200);
          const amplitude = 0.08 * Math.exp(-t * 0.72);
          const buffer = Float32Array.from(
            { length: 4096 },
            (_, i) =>
              0.015 +
              amplitude *
                (Math.sin((2 * Math.PI * f * i) / rate) +
                  0.2 * Math.sin((4 * Math.PI * f * i) / rate)),
          );
          const pitch = detectPitch(buffer, rate);
          expect(pitch).not.toBeNull();
          expect(Math.abs(1200 * Math.log2(pitch!.frequency / f))).toBeLessThan(
            1,
          );
          const tracked = stable.push(pitch, t * 1000);
          if (frame > 5) expect(tracked?.held).toBe(false);
        }
      }
  });
  it("does not mistake a dominant second harmonic for an octave higher", () => {
    for (const midi of STRINGS)
      for (const rate of [44100, 48000]) {
        const f = midiFrequency(midi);
        const buffer = Float32Array.from(
          { length: 4096 },
          (_, i) =>
            0.08 * Math.sin((2 * Math.PI * f * i) / rate) +
            0.6 * Math.sin((4 * Math.PI * f * i) / rate),
        );
        const pitch = detectPitch(buffer, rate);
        expect(pitch).not.toBeNull();
        expect(Math.abs(1200 * Math.log2(pitch!.frequency / f))).toBeLessThan(
          2,
        );
      }
  });
  it("rejects pure DC and unpitched noise", () => {
    expect(detectPitch(new Float32Array(4096).fill(0.02), 48000)).toBeNull();
    let seed = 123;
    const noise = Float32Array.from({ length: 4096 }, () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return (seed / 2 ** 32 - 0.5) * 0.1;
    });
    expect(detectPitch(noise, 48000)).toBeNull();
  });
  it("keeps E and its overtones harmless after gaps and after B has been accepted", () => {
    const follower = new LessonFollower();
    for (let i = 0; i < 4; i++) follower.push(tone(40), 40, i * 50);
    follower.push(null, 47, 400);
    follower.push(null, 47, 650);
    for (const [midi, at] of [
      [40, 700],
      [52, 750],
      [59, 800],
    ])
      expect(follower.push(tone(midi, 0.05), 47, at).feedback).toBe("sustain");
    for (let i = 0; i < 4; i++) follower.push(tone(47), 47, 900 + i * 50);
    expect(follower.push(tone(40, 0.03), 50, 1300).feedback).toBe("sustain");
    let wrong;
    for (let i = 0; i < 8; i++)
      wrong = follower.push(tone(48), 50, 1500 + i * 50);
    expect(wrong?.feedback).toBe("wrong");
  });
});
