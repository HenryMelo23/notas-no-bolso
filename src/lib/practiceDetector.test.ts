import { describe, expect, it } from "vitest";
import { PracticeDetector } from "./practiceDetector";
import { BLUES, midiFrequency, noteMidi } from "./blues";
import { LessonFollower } from "./lessonFollower";

type Pluck = {
  midi: number;
  at: number;
  gain?: number;
  cents?: number;
  string?: number;
};
export function mixture(plucks: Pluck[], now: number, rate = 48000) {
  const live = plucks
    .filter((p) => p.at < now)
    .map((p) => ({
      ...p,
      end:
        p.string === undefined
          ? Infinity
          : Math.min(
              ...plucks
                .filter((next) => next.string === p.string && next.at > p.at)
                .map((next) => next.at),
            ),
    }))
    .filter((p) => p.end > now - (8192 / rate) * 1000);
  return Float32Array.from({ length: 8192 }, (_, i) => {
    const time = now / 1000 - (8191 - i) / rate;
    return live.reduce((sum, p) => {
      const age = time - p.at / 1000;
      if (age < 0) return sum;
      // A new fretted note on the same physical string replaces its previous vibration.
      if (time >= p.end / 1000) return sum;
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
  it("follows six open strings and does not count their mixed tail as another pluck", () => {
    const plucks = [40, 45, 50, 55, 59, 64].map((midi, i) => ({
      midi,
      string: 6 - i,
      at: 100 + 400 * i,
    }));
    const detector = new PracticeDetector();
    const follower = new LessonFollower();
    let hits = 0;
    for (let now = 0; now < 4500; now += 1000 / 30) {
      const audio = detector.process(mixture(plucks, now), 48000, now);
      const result = follower.push(
        audio.pitch,
        plucks[Math.min(hits, 5)].midi,
        now,
        440,
        audio.onset,
      );
      if (result.advance) hits++;
    }
    expect(hits).toBe(6);
  });
  it("rejects random noise bursts", () => {
    const detector = new PracticeDetector();
    const follower = new LessonFollower();
    let seed = 123;
    for (let now = 0; now < 1500; now += 1000 / 30) {
      const buffer = Float32Array.from({ length: 8192 }, () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return (seed / 2 ** 32 - 0.5) * (now % 300 < 100 ? 0.1 : 0.001);
      });
      const audio = detector.process(buffer, 48000, now);
      expect(
        follower.push(audio.pitch, 40, now, 440, audio.onset).advance,
      ).toBe(false);
    }
  });
  it.each([44100,48000])("completes the first 48-note study with three strings still resonating at %i Hz", (rate) => {
    const notes = BLUES[0].notes;
    const plucks = notes.map((note, i) => ({
      midi: noteMidi(note),
      string: note.string,
      at: 100 + i * 300,
      gain: i % 2 ? 0.08 : 0.14,
    }));
    const detector = new PracticeDetector();
    const follower = new LessonFollower();
    let index = 0;
    let maxLatency = 0;
    for (let now = 0; now < plucks[plucks.length - 1].at + 1500; now += 1000 / 30) {
      const audio = detector.process(mixture(plucks, now, rate), rate, now);
      const result = follower.push(
        audio.pitch,
        plucks[Math.min(index, notes.length - 1)].midi,
        now,
        440,
        audio.onset,
      );
      if (result.advance) {
        expect(now, `premature ${index}`).toBeGreaterThan(plucks[index].at);
        maxLatency = Math.max(maxLatency, now - plucks[index].at);
        index++;
      }
    }
    expect(index).toBe(notes.length);
    expect(Math.round(maxLatency)).toBeLessThanOrEqual(200);
  }, 15000);
  it.each([100, 1200, -1200, 45, -45])(
    "does not advance a wrong or detuned new note (%i cents)",
    (cents) => {
      const detector = new PracticeDetector();
      const follower = new LessonFollower();
      const plucks = [
        { midi: 40, at: 100, gain: 0.18 },
        { midi: 59, at: 600, cents, gain: 0.09 },
      ];
      let hits = 0;
      for (let now = 0; now < 1300; now += 1000 / 30) {
        const audio = detector.process(mixture(plucks, now), 48000, now);
        const result = follower.push(
          audio.pitch,
          hits === 0 ? 40 : 59,
          now,
          440,
          audio.onset,
        );
        if (result.advance) hits++;
      }
      expect(hits).toBe(1);
    },
  );
  it("never mistakes one ringing string for a second attack or for its overtone", () => {
    for (const next of [40, 52, 59]) {
      const detector = new PracticeDetector();
      const follower = new LessonFollower();
      let hits = 0;
      for (let now = 0; now < 6000; now += 1000 / 30) {
        const audio = detector.process(
          mixture([{ midi: 40, at: 100 }], now),
          48000,
          now,
        );
        const result = follower.push(
          audio.pitch,
          hits === 0 ? 40 : next,
          now,
          440,
          audio.onset,
        );
        if (result.advance) hits++;
      }
      expect(hits).toBe(1);
    }
  });
  it.each([44100, 48000])(
    "advances a legato bass phrase once per attack at %i Hz",
    (rate) => {
      for (const interval of [300, 500]) {
        const notes = [40, 47, 40, 50, 45, 52, 45, 55, 55];
        const strings = [6, 5, 6, 4, 5, 4, 5, 3, 3];
        const plucks = notes.map((midi, i) => ({
          midi,
          string: strings[i],
          at: 100 + interval * i,
        }));
        const detector = new PracticeDetector();
        const follower = new LessonFollower();
        const hits: number[] = [];
        const trace: unknown[] = [];
        for (let now = 0; now < plucks[plucks.length - 1].at + 1600; now += 1000 / 30) {
          const audio = detector.process(mixture(plucks, now, rate), rate, now);
          const step = Math.min(hits.length, notes.length - 1);
          const result = follower.push(
            audio.pitch,
            notes[step],
            now,
            440,
            audio.onset,
          );
          if (audio.pitch)
            trace.push([
              Math.round(now),
              audio.onset,
              Math.round(audio.pitch.frequency * 10) / 10,
              result.feedback,
              Math.round(result.cents),
            ]);
          if (result.advance) hits.push(now);
        }
        expect(
          hits,
          `${rate} Hz / ${interval} ms ${JSON.stringify(trace)}`,
        ).toHaveLength(notes.length);
        hits.forEach((at, i) => {
          expect(
            at - plucks[i].at,
            `note ${i}, ${rate} Hz / ${interval} ms`,
          ).toBeGreaterThan(0);
          expect(
            Math.round(at - plucks[i].at),
            `note ${i}: ${JSON.stringify(trace.filter((row: any) => row[0] >= plucks[i].at && row[0] < plucks[i].at + 300))}`,
          ).toBeLessThanOrEqual(200);
        });
      }
    },
  );
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
