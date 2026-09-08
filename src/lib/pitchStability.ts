import { centsBetween } from './music';
import type { PitchResult } from './pitch';

export type StablePitchResult = PitchResult & {
  held: boolean;
  stableFrames: number;
};

const CANDIDATE_CENTS = 38;
const SWITCH_CENTS = 45;
const REQUIRED_FRAMES = 3;
const HOLD_MS = 1800;
const EMA_ALPHA = 0.24;

export class PitchStabilizer {
  private candidate: PitchResult | null = null;
  private candidateFrames = 0;
  private stable: StablePitchResult | null = null;
  private lastStableAt = 0;

  push(rawPitch: PitchResult | null, now = performance.now()): StablePitchResult | null {
    if (!rawPitch) {
      if (this.stable && now - this.lastStableAt <= HOLD_MS) {
        return {
          ...this.stable,
          held: true
        };
      }

      this.candidate = null;
      this.candidateFrames = 0;
      this.stable = null;
      return null;
    }

    if (!this.stable) {
      return this.promoteCandidate(rawPitch, now);
    }

    const distanceFromStable = Math.abs(centsBetween(rawPitch.frequency, this.stable.frequency));

    if (distanceFromStable <= SWITCH_CENTS) {
      this.candidate = null;
      this.candidateFrames = 0;
      this.lastStableAt = now;
      this.stable = {
        frequency: smoothFrequency(this.stable.frequency, rawPitch.frequency, EMA_ALPHA),
        clarity: Math.max(rawPitch.clarity, this.stable.clarity * 0.96),
        rms: rawPitch.rms,
        held: false,
        stableFrames: this.stable.stableFrames + 1
      };

      return this.stable;
    }

    return this.promoteCandidate(rawPitch, now);
  }

  reset() {
    this.candidate = null;
    this.candidateFrames = 0;
    this.stable = null;
    this.lastStableAt = 0;
  }

  private promoteCandidate(rawPitch: PitchResult, now: number) {
    if (this.candidate && Math.abs(centsBetween(rawPitch.frequency, this.candidate.frequency)) <= CANDIDATE_CENTS) {
      this.candidate = {
        frequency: smoothFrequency(this.candidate.frequency, rawPitch.frequency, 0.42),
        clarity: Math.max(this.candidate.clarity, rawPitch.clarity),
        rms: rawPitch.rms
      };
      this.candidateFrames += 1;
    } else {
      this.candidate = rawPitch;
      this.candidateFrames = 1;
    }

    if (this.candidateFrames < REQUIRED_FRAMES) {
      if (this.stable && now - this.lastStableAt <= HOLD_MS) {
        return {
          ...this.stable,
          held: true
        };
      }

      return null;
    }

    this.stable = {
      ...this.candidate,
      held: false,
      stableFrames: this.candidateFrames
    };
    this.lastStableAt = now;

    return this.stable;
  }
}

function smoothFrequency(previous: number, next: number, alpha: number) {
  return previous * 2 ** (Math.log2(next / previous) * alpha);
}
