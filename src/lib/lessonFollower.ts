import type { PitchResult } from "./pitch";
import { midiFrequency } from "./blues";

export type Feedback =
  "waiting" | "listening" | "correct" | "sustain" | "wrong" | "intonation";
export type FollowResult = {
  advance: boolean;
  feedback: Feedback;
  midi: number | null;
  cents: number;
};

// Only new audio observations enter this state machine. Rendering and animation never advance a lesson.
export class LessonFollower {
  private accepted: number | null = null;
  private acceptedAt = -Infinity;
  private candidate: number | null = null;
  private candidateAt = 0;
  private silenceAt: number | null = null;
  private previousRms = 0;
  private rearmed = false;
  private onset: number | undefined;
  private consumedOnset: number | undefined;
  private ringing = new Map<number, { at: number; rms: number }>();
  reset(onset?: number) {
    this.accepted = null;
    this.candidate = null;
    this.silenceAt = null;
    this.previousRms = 0;
    this.acceptedAt = -Infinity;
    this.rearmed = false;
    // A practice session may start while the microphone is already hearing a
    // ringing string. That old detector event must not become a fresh pluck.
    this.onset = onset;
    this.consumedOnset = onset;
    this.ringing.clear();
  }
  push(
    pitch: PitchResult | null,
    target: number,
    now: number,
    reference = 440,
    onset?: number,
  ): FollowResult {
    const result = (
      feedback: Feedback,
      midi: number | null = null,
      cents = 0,
      advance = false,
    ): FollowResult => ({ feedback, midi, cents, advance });
    if (onset !== undefined) {
      if (!onset) return result("waiting");
      if (onset === this.consumedOnset) return result("sustain", this.accepted);
      if (onset !== this.onset) {
        this.onset = onset;
        this.candidate = null;
        this.rearmed = true;
      }
    }
    if (!pitch || pitch.clarity < (onset === undefined ? 0.88 : 0.75)) {
      this.candidate = null;
      this.silenceAt ??= now;
      if (now - this.silenceAt >= 140) this.rearmed = true;
      this.previousRms = 0;
      return result("waiting");
    }
    const attack =
      this.previousRms > 0 &&
      pitch.rms > this.previousRms * 1.9 &&
      now - this.acceptedAt > 280;
    this.previousRms = pitch.rms;
    this.silenceAt = null;
    const midi = Math.round(69 + 12 * Math.log2(pitch.frequency / reference));
    const cents =
      1200 * Math.log2(pitch.frequency / midiFrequency(target, reference));
    if (onset === undefined && attack && midi === target) {
      this.rearmed = true;
      this.candidate = null;
    }
    // Dropouts and changes of dominant harmonic do not turn an accepted note into an error.
    for (const [oldMidi, old] of this.ringing) {
      if (now - old.at > 8000) {
        this.ringing.delete(oldMidi);
        continue;
      }
      const relativeCents =
        1200 * Math.log2(pitch.frequency / midiFrequency(oldMidi, reference));
      const isTail =
        Math.abs(relativeCents) < 45 ||
        (pitch.rms <= old.rms * 1.25 &&
          [1200, 1901.955, -1200].some(
            (h) => Math.abs(relativeCents - h) < 30,
          ));
      if (onset === undefined && midi !== target && isTail) {
        this.candidate = null;
        return result("sustain", oldMidi, cents);
      }
    }
    if (midi === this.accepted && !this.rearmed) {
      this.candidate = null;
      return result("sustain", midi, cents);
    }
    if (this.candidate !== midi) {
      this.candidate = midi;
      this.candidateAt = now;
    }
    if (
      now - this.candidateAt <
      (midi === target ? (onset === undefined ? 110 : 0) : 180)
    )
      return result("listening", midi, cents);
    if (midi !== target) return result("wrong", midi, cents);
    if (Math.abs(cents) > 25) return result("intonation", midi, cents);
    this.accepted = midi;
    this.consumedOnset = onset;
    this.acceptedAt = now;
    this.rearmed = false;
    this.ringing.set(midi, { at: now, rms: pitch.rms });
    this.candidate = null;
    return result("correct", midi, cents, true);
  }
}
