import { describe, expect, it } from "vitest";
import { PracticeDetector } from "./practiceDetector";
import { midiFrequency } from "./blues";

type Pluck = { midi: number; at: number; gain?: number; cents?: number };
export function mixture(plucks: Pluck[], now: number, rate = 48000) {
  return Float32Array.from({ length: 4096 }, (_, i) => {
    const time = now / 1000 - (4095 - i) / rate;
    return plucks.reduce((sum, p) => {
      const age = time - p.at / 1000;
      if (age < 0) return sum;
      const phase =
        2 *
        Math.PI *
        midiFrequency(p.midi) *
        2 ** ((p.cents ?? 0) / 1200) *
        age;
      return (
        sum +
        (p.gain ?? 0.12) *
          Math.min(1, age / 0.006) *
          Math.exp(-age * 0.65) *
          (Math.sin(phase) +
            0.38 * Math.sin(2 * phase + 0.7) +
            0.18 * Math.sin(3 * phase + 0.4))
      );
    }, 0);
  });
}

describe("new pluck extraction from actual overlapping PCM", () => {
  it.each([44100, 48000])(
    "finds weaker notes under ringing bass at %i Hz",
    (rate) => {
      for (const [old, next] of [
        [40, 47],
        [40, 59],
        [45, 50],
        [50, 55],
        [59, 40],
        [40, 52],
        [45, 45],
      ]) {
        const detector = new PracticeDetector();
        const plucks = [
          { midi: old, at: 100, gain: 0.18 },
          { midi: next, at: 600, gain: 0.075 },
        ];
        let hit = Infinity;
        let onset = 0;
        const readings: unknown[] = [];
        for (let now = 0; now <= 950; now += 20) {
          const observation = detector.process(
            mixture(plucks, now, rate),
            rate,
            now,
          );
          if (now < 600) onset = observation.onset;
          if (now >= 600 && observation.pitch) {
            const cents =
              1200 *
              Math.log2(observation.pitch.frequency / midiFrequency(next));
            readings.push([now, Math.round(cents), observation.onset]);
            if (Math.abs(cents) <= 25 && observation.onset > onset)
              hit = Math.min(hit, now);
          }
        }
        expect(
          hit - 600,
          `${old}->${next} ${JSON.stringify(readings)}`,
        ).toBeLessThanOrEqual(180);
      }
    },
  );
});
