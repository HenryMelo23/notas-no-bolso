import { describe, it, expect } from "vitest";
import { TuningCoach } from "./tuningCoach";
import { midiFrequency, STRINGS } from "./blues";
describe("automatic tuning coach", () => {
  it("detects open strings, verifies each and ignores the previous ringing string", () => {
    const coach = new TuningCoach();
    let at = 0;
    for (const string of [5, 6, 4, 3, 2, 1]) {
      const pitch = {
        frequency: midiFrequency(STRINGS[string - 1]),
        clarity: 0.99,
        rms: 0.1,
      };
      let state = coach.snapshot();
      for (let i = 0; i < 32; i++)
        state = coach.observe(pitch, (at += 50), true);
      expect(state.checked).toContain(string);
      const selected = state.string;
      for (let i = 0; i < 15; i++)
        state = coach.observe(pitch, (at += 50), true);
      expect(state.string).toBe(selected);
    }
    expect(coach.snapshot().complete).toBe(true);
    expect(coach.snapshot().checked).toHaveLength(6);
  });
  it("never verifies out of tune, octave errors, noise or isolated crossings of center", () => {
    for (const cents of [12, -12, 1200, -1200]) {
      const coach = new TuningCoach();
      for (let i = 0; i < 60; i++)
        coach.observe(
          {
            frequency: midiFrequency(40) * 2 ** (cents / 1200),
            clarity: 0.99,
            rms: 0.1,
          },
          i * 50,
          false,
        );
      expect(coach.snapshot().checked).toHaveLength(0);
    }
    const coach = new TuningCoach();
    for (let i = 0; i < 60; i++)
      coach.observe(
        {
          frequency: midiFrequency(40) * 2 ** ((i % 5 === 0 ? 20 : 0) / 1200),
          clarity: 0.99,
          rms: 0.1,
        },
        i * 50,
        false,
      );
    expect(coach.snapshot().checked).toHaveLength(0);
  });
  it("respects manual selection, tuning offsets and reference frequency", () => {
    const coach = new TuningCoach();
    coach.select(3);
    for (let i = 0; i < 40; i++)
      coach.observe({ frequency: 110, clarity: 1, rms: 0.1 }, i * 50, false);
    expect(coach.snapshot().string).toBe(3);
    expect(coach.snapshot().checked).toHaveLength(0);
    for (let i = 0; i < 40; i++)
      coach.observe(
        {
          frequency: midiFrequency(55, 442) * 2 ** (-50 / 1200),
          clarity: 1,
          rms: 0.1,
        },
        2000 + i * 50,
        false,
        442,
        -50,
      );
    expect(coach.snapshot().checked).toEqual([3]);
    expect(coach.snapshot().string).toBe(6);
    expect(coach.select(3).checked).toHaveLength(0);
  });
});
