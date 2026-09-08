import { describe, expect, it } from 'vitest';
import { getSafetyState } from './safety';
import type { TunedStringTarget } from './music';
import type { StablePitchResult } from './pitchStability';

const target: TunedStringTarget = {
  id: 'e2',
  label: '6',
  note: 'E',
  octave: 2,
  frequency: 82.4069,
  targetFrequency: 82.4069,
  cents: 0
};

describe('tuning safety', () => {
  it('does not advise tuning from an unstable signal', () => {
    expect(getSafetyState({ frequency: 82.4, clarity: 0.4, rms: 0.1 }, target).level).toBe('listen');
  });

  it('does not advise turning the peg from a held reading', () => {
    const heldPitch: StablePitchResult = { frequency: 82.4, clarity: 0.9, rms: 0.1, held: true, stableFrames: 5 };

    expect(getSafetyState(heldPitch, { ...target, cents: -30 }).level).toBe('listen');
  });

  it('warns when the string is far above target', () => {
    expect(getSafetyState({ frequency: 90, clarity: 0.9, rms: 0.1 }, { ...target, cents: 150 }).level).toBe('danger');
  });

  it('holds when the reading is centered', () => {
    expect(getSafetyState({ frequency: 82.4, clarity: 0.9, rms: 0.1 }, { ...target, cents: 2 }).level).toBe('hold');
  });
});
