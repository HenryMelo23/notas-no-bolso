import { STRINGS, midiFrequency } from "./blues";
import type { PitchResult } from "./pitch";

export type TuningState = {
  string: number;
  checked: number[];
  waitingNext: boolean;
  complete: boolean;
};
export class TuningCoach {
  private selected = 6;
  private checked = new Set<number>();
  private candidate: number | null = null;
  private candidateAt = 0;
  private centeredAt: number | null = null;
  private previous: number | null = null;
  private waitingNext = false;
  snapshot(): TuningState {
    return {
      string: this.selected,
      checked: [...this.checked],
      waitingNext: this.waitingNext,
      complete: this.checked.size === 6,
    };
  }
  reset() {
    this.selected = 6;
    this.checked.clear();
    this.previous = null;
    this.waitingNext = false;
    this.centeredAt = null;
    this.candidate = null;
    return this.snapshot();
  }
  select(string: number) {
    this.selected = string;
    this.checked.delete(string);
    this.previous = null;
    this.waitingNext = false;
    this.centeredAt = null;
    this.candidate = null;
    return this.snapshot();
  }
  observe(
    pitch: PitchResult | null,
    now: number,
    auto: boolean,
    reference = 440,
    offset = 0,
  ): TuningState {
    if (this.checked.size === 6) return this.snapshot();
    if (!pitch || pitch.clarity < 0.88) {
      this.centeredAt = null;
      this.candidate = null;
      return this.snapshot();
    }
    const centsFor = (s: number) =>
      1200 *
      Math.log2(
        pitch.frequency /
          (midiFrequency(STRINGS[s - 1], reference) * 2 ** (offset / 1200)),
      );
    if (this.previous !== null && Math.abs(centsFor(this.previous)) < 120) {
      this.centeredAt = null;
      this.waitingNext = true;
      return this.snapshot();
    }
    const closest = [6, 5, 4, 3, 2, 1].reduce((a, b) =>
      Math.abs(centsFor(a)) < Math.abs(centsFor(b)) ? a : b,
    );
    if (
      auto &&
      Math.abs(centsFor(closest)) <= 100 &&
      closest !== this.selected &&
      !this.checked.has(closest)
    ) {
      if (this.candidate !== closest) {
        this.candidate = closest;
        this.candidateAt = now;
      }
      if (now - this.candidateAt < 180) return this.snapshot();
      this.selected = closest;
      this.centeredAt = null;
    } else this.candidate = null;
    this.waitingNext = false;
    if (Math.abs(centsFor(this.selected)) > 5) {
      this.centeredAt = null;
      return this.snapshot();
    }
    this.centeredAt ??= now;
    // Confirm raw measurements for a full second, not an old smoothed/held reading.
    if (now - this.centeredAt >= 1000) {
      this.checked.add(this.selected);
      this.previous = this.selected;
      const next = [6, 5, 4, 3, 2, 1].find((s) => !this.checked.has(s));
      if (next) {
        this.selected = next;
        this.waitingNext = true;
      }
      this.centeredAt = null;
    }
    return this.snapshot();
  }
}
