import FFT from "fft.js";
import { detectPitch, type PitchResult } from "./pitch";

export type PracticeObservation = {
  pitch: PitchResult | null;
  onset: number;
};

// Spectral difference separates a new pluck from the decaying strings underneath.
// It does not use the requested note, so a wrong pluck cannot be fitted to the answer.
export class PracticeDetector {
  private fft: FFT;
  private spectrum: number[];
  private inverse: number[];
  private window: Float32Array;
  private input: Float32Array;
  private residual: Float32Array<ArrayBuffer>;
  private previous: Float32Array;
  private background: Float32Array;
  private onset = 0;
  private onsetAt = -Infinity;
  private quietAt = 0;
  private armed = true;

  constructor(private size = 4096) {
    this.fft = new FFT(size);
    this.spectrum = this.fft.createComplexArray();
    this.inverse = this.fft.createComplexArray();
    this.window = Float32Array.from(
      { length: size },
      (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1)),
    );
    this.input = new Float32Array(size);
    this.residual = new Float32Array(size);
    this.previous = new Float32Array(size / 2 + 1);
    this.background = new Float32Array(size / 2 + 1);
  }

  process(
    buffer: Float32Array,
    sampleRate: number,
    now: number,
  ): PracticeObservation {
    if (buffer.length !== this.size || sampleRate <= 0)
      return { pitch: null, onset: this.onset };
    let mean = 0;
    for (const value of buffer) mean += value;
    mean /= this.size;
    for (let i = 0; i < this.size; i++)
      this.input[i] = (buffer[i] - mean) * this.window[i];
    this.fft.realTransform(this.spectrum, this.input);
    let energy = 0;
    let flux = 0;
    for (let k = 1; k < this.previous.length; k++) {
      const magnitude = Math.hypot(
        this.spectrum[2 * k],
        this.spectrum[2 * k + 1],
      );
      const increase = Math.max(0, magnitude - this.previous[k] * 1.06);
      energy += magnitude * magnitude;
      flux += increase * increase;
    }
    const novelty = Math.sqrt(flux / Math.max(energy, 1e-12));
    if (novelty < 0.035) {
      if (now - this.quietAt >= 45) this.armed = true;
    } else this.quietAt = now;
    if (
      this.armed &&
      novelty > 0.08 &&
      Math.sqrt(flux) / this.size > 0.00012 &&
      now - this.onsetAt > 125
    ) {
      this.background.set(this.previous);
      this.onset++;
      this.onsetAt = now;
      this.armed = false;
    }
    for (let k = 0; k < this.previous.length; k++) {
      const re = this.spectrum[2 * k];
      const im = this.spectrum[2 * k + 1];
      const magnitude = Math.hypot(re, im);
      this.previous[k] = magnitude;
      const gain =
        magnitude > 0
          ? Math.max(0, magnitude - this.background[k] * 1.12) / magnitude
          : 0;
      this.spectrum[2 * k] *= gain;
      this.spectrum[2 * k + 1] *= gain;
    }
    if (now - this.onsetAt > 600) return { pitch: null, onset: this.onset };
    this.fft.completeSpectrum(this.spectrum);
    this.fft.inverseTransform(this.inverse, this.spectrum);
    for (let i = 0; i < this.size; i++) this.residual[i] = this.inverse[2 * i];
    return { pitch: detectPitch(this.residual, sampleRate), onset: this.onset };
  }
}
