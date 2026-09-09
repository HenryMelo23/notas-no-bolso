import { describe, expect, it, vi } from 'vitest';
import { PitchStabilizer } from './pitchStability';

describe('pitch stabilizer', () => {
  it('requires repeated agreement before publishing a new pitch', () => {
    const stabilizer = new PitchStabilizer();
    const pitch = { frequency: 110, clarity: 0.94, rms: 0.3 };

    expect(stabilizer.push(pitch, 0)).toBeNull();
    expect(stabilizer.push({ ...pitch, frequency: 110.4 }, 50)).toBeNull();
    expect(stabilizer.push({ ...pitch, frequency: 109.9 }, 100)?.frequency).toBeGreaterThan(109.8);
  });

  it('holds the last stable pitch through a short dropout', () => {
    const stabilizer = new PitchStabilizer();
    const pitch = { frequency: 146.83, clarity: 0.94, rms: 0.3 };

    stabilizer.push(pitch, 0);
    stabilizer.push(pitch, 50);
    stabilizer.push(pitch, 100);

    const held = stabilizer.push(null, 500);

    expect(held?.held).toBe(true);
    expect(held?.frequency).toBeCloseTo(146.83, 1);
  });

  it('does not jump to a distant transient immediately', () => {
    const stabilizer = new PitchStabilizer();
    const pitch = { frequency: 196, clarity: 0.94, rms: 0.3 };

    stabilizer.push(pitch, 0);
    stabilizer.push(pitch, 50);
    const stable = stabilizer.push(pitch, 100);
    const transient = stabilizer.push({ frequency: 246.94, clarity: 0.9, rms: 0.2 }, 150);

    expect(stable?.frequency).toBeCloseTo(196, 0);
    expect(transient?.held).toBe(true);
    expect(transient?.frequency).toBeCloseTo(196, 0);
  });

  it('does not replace a decaying fundamental with its weaker octave', () => {
    const stabilizer = new PitchStabilizer();
    const fundamental = { frequency: 196, clarity: 0.97, rms: 0.04 };

    stabilizer.push(fundamental, 0);
    stabilizer.push({ ...fundamental, rms: 0.035 }, 50);
    stabilizer.push({ ...fundamental, rms: 0.03 }, 100);

    for (let frame = 0; frame < 8; frame++) {
      const result = stabilizer.push(
        { frequency: 390.2, clarity: 0.94, rms: 0.012 },
        150 + frame * 50,
      );
      expect(result?.frequency).toBeCloseTo(196, 0);
      expect(result?.held).toBe(true);
    }
  });

  it('allows a clearly re-plucked octave to become the new note', () => {
    const stabilizer = new PitchStabilizer();
    const fundamental = { frequency: 196, clarity: 0.97, rms: 0.04 };
    for (let frame = 0; frame < 3; frame++)
      stabilizer.push(fundamental, frame * 50);

    let result;
    for (let frame = 0; frame < 3; frame++)
      result = stabilizer.push(
        { frequency: 392, clarity: 0.97, rms: 0.065 },
        200 + frame * 50,
      );

    expect(result?.frequency).toBeCloseTo(392, 0);
    expect(result?.held).toBe(false);
  });

  it('drops the held value after the sustain window expires', () => {
    vi.stubGlobal('performance', { now: () => 0 });
    const stabilizer = new PitchStabilizer();
    const pitch = { frequency: 82.41, clarity: 0.94, rms: 0.3 };

    stabilizer.push(pitch, 0);
    stabilizer.push(pitch, 50);
    stabilizer.push(pitch, 100);

    expect(stabilizer.push(null, 2100)).toBeNull();
    vi.unstubAllGlobals();
  });
});
