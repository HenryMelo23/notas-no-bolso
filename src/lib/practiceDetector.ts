import FFT from "fft.js";
import { PitchDetector } from "pitchy";
import { calculateRms, type PitchResult } from "./pitch";

export type PracticeObservation = {
  pitch: PitchResult | null;
  onset: number;
};

export class PluckOnsetGate {
  private onsetAt = -Infinity;
  private armed = true;
  private peak = 0;
  private floor = 0;

  push(novelty: number, fluxLevel: number, now: number) {
    if (this.armed) {
      this.floor = Math.min(this.floor, novelty);
    } else {
      this.peak = Math.max(this.peak, novelty);
      // A ringing bass can keep the absolute novelty floor above 0.06. Wait
      // for a relative valley, then require a new rise before another onset.
      if (
        now - this.onsetAt > 125 &&
        novelty <= Math.max(0.06, this.peak * 0.72)
      ) {
        this.armed = true;
        this.floor = novelty;
      }
    }
    if (
      !this.armed ||
      novelty <= Math.max(0.08, this.floor * 1.28) ||
      fluxLevel <= 0.00012 ||
      now - this.onsetAt <= 125
    )
      return false;
    this.onsetAt = now;
    this.armed = false;
    this.peak = novelty;
    this.floor = Infinity;
    return true;
  }
}

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
  private magnitudes: Float32Array;
  private onset = 0;
  private onsetAt = -Infinity;
  private onsetGate = new PluckOnsetGate();
  private detector: PitchDetector<Float32Array>;

  constructor(private size = 8192) {
    this.fft = new FFT(size);
    this.detector = PitchDetector.forFloat32Array(size / 2);
    this.detector.clarityThreshold = 0.99;
    this.spectrum = this.fft.createComplexArray();
    this.inverse = this.fft.createComplexArray();
    this.window = Float32Array.from(
      { length: size },
      (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1)),
    );
    this.input = new Float32Array(size);
    this.residual = new Float32Array(size / 2);
    this.previous = new Float32Array(size / 2 + 1);
    this.background = new Float32Array(size / 2 + 1);
    this.magnitudes = new Float32Array(size / 2 + 1);
  }

  process(
    buffer: Float32Array,
    sampleRate: number,
    now: number,
  ): PracticeObservation {
    if (
      buffer.length !== this.size ||
      !Number.isFinite(sampleRate) ||
      sampleRate <= 0 ||
      !Number.isFinite(now)
    )
      return { pitch: null, onset: this.onset };
    let mean = 0;
    for (const value of buffer) mean += value;
    mean /= this.size;
    if (!Number.isFinite(mean)) return { pitch: null, onset: this.onset };
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
      const increase = Math.max(
        0,
        Math.abs(magnitude - this.previous[k]) - this.previous[k] * 0.06,
      );
      energy += magnitude * magnitude;
      flux += increase * increase;
    }
    const novelty = Math.sqrt(flux / Math.max(energy, 1e-12));
    if (this.onsetGate.push(novelty, Math.sqrt(flux) / this.size, now)) {
      this.background.set(this.previous);
      this.onset++;
      this.onsetAt = now;
    }
    const backgroundScale = Math.exp(-(now - this.onsetAt) * 0.00065);
    for (let k = 0; k < this.previous.length; k++) {
      const re = this.spectrum[2 * k];
      const im = this.spectrum[2 * k + 1];
      const magnitude = Math.hypot(re, im);
      this.previous[k] = magnitude;
      const gain =
        magnitude > 0
          ? Math.min(
              1,
              Math.max(
                0,
                Math.abs(magnitude - this.background[k] * backgroundScale) -
                  this.background[k] * 0.08,
              ) / magnitude,
            )
          : 0;
      this.spectrum[2 * k] *= gain;
      this.spectrum[2 * k + 1] *= gain;
    }
    if (now - this.onsetAt > 600) return { pitch: null, onset: this.onset };
    const spectral = this.spectralPitch(sampleRate);
    this.fft.completeSpectrum(this.spectrum);
    this.fft.inverseTransform(this.inverse, this.spectrum);
    // Only undo the Hann window in its well-conditioned middle half.
    // The tapered edges otherwise create misleading long-lag periodicity peaks.
    for (let i = 0; i < this.residual.length; i++) {
      const j = i + this.size / 4;
      this.residual[i] = this.inverse[2 * j] / this.window[j];
    }
    const rms = calculateRms(this.residual);
    const [frequency, clarity] = this.detector.findPitch(
      this.residual,
      sampleRate,
    );
    const pitch = spectral
      ? {
          frequency: this.refineFrequency(spectral.frequency, sampleRate),
          clarity: spectral.clarity,
          rms,
        }
      : rms >= 0.00015 &&
          clarity >= 0.75 &&
          frequency >= 65 &&
          frequency <= 1400
        ? {
            frequency: this.refineFrequency(frequency, sampleRate),
            clarity,
            rms,
          }
        : null;
    return { pitch, onset: this.onset };
  }

  private spectralPitch(rate: number) {
    const magnitudes = this.magnitudes;
    for (let k = 0; k < magnitudes.length; k++)
      magnitudes[k] = Math.hypot(
        this.spectrum[2 * k],
        this.spectrum[2 * k + 1],
      );
    let total = 0,
      strongest = 0;
    for (let k = 1; k < magnitudes.length; k++) {
      total += magnitudes[k] ** 2;
      strongest = Math.max(strongest, magnitudes[k]);
    }
    if (Math.sqrt(total) / this.size < 0.00015) return null;
    const peaks: { frequency: number; energy: number }[] = [];
    for (let k = 2; k < magnitudes.length - 1; k++) {
      const b = magnitudes[k];
      if (
        b < strongest * 0.07 ||
        b < magnitudes[k - 1] ||
        b < magnitudes[k + 1]
      )
        continue;
      const a = Math.log(Math.max(1e-12, magnitudes[k - 1]));
      const c = Math.log(Math.max(1e-12, magnitudes[k + 1]));
      const delta = (0.5 * (a - c)) / (a - 2 * Math.log(b) + c);
      const frequency = ((k + delta) * rate) / this.size;
      if (frequency > 60 && frequency < 5600)
        peaks.push({
          frequency,
          energy: b * b + magnitudes[k - 1] ** 2 + magnitudes[k + 1] ** 2,
        });
    }
    let best: { frequency: number; clarity: number; score: number } | null =
      null;
    for (const peak of peaks)
      for (let divisor = 1; divisor <= 3; divisor++) {
        const frequency = peak.frequency / divisor;
        if (frequency < 65 || frequency > 1400) continue;
        const matched: {
          harmonic: number;
          frequency: number;
          energy: number;
        }[] = [];
        for (let h = 1; h <= 4; h++) {
          const p = peaks.find(
            (p) =>
              Math.abs(p.frequency / h - frequency) <
              Math.max(2, frequency * 0.013),
          );
          if (p)
            matched.push({
              harmonic: h,
              frequency: p.frequency / h,
              energy: p.energy,
            });
        }
        if (
          matched.length < 2 ||
          (!matched.some((p) => p.harmonic === 1) &&
            !(
              matched.some((p) => p.harmonic === 2) &&
              matched.some((p) => p.harmonic === 3)
            ))
        )
          continue;
        const coverage = matched.reduce((sum, p) => sum + p.energy, 0) / total;
        if (coverage < 0.72) continue;
        const score = coverage + matched.length * 0.025;
        if (!best || score > best.score)
          best = {
            frequency:
              matched.reduce((sum, p) => sum + p.frequency, 0) / matched.length,
            clarity: Math.min(1, coverage),
            score,
          };
      }
    return best;
  }

  private refineFrequency(frequency: number, rate: number) {
    const estimates: { frequency: number; harmonic: number }[] = [];
    const peak = Math.max(...this.previous);
    for (let harmonic = 1; harmonic <= 4; harmonic++) {
      const center = (frequency * harmonic * this.size) / rate;
      const radius = Math.max(2, center * 0.055);
      let strongest = 0;
      let bin = 0;
      for (
        let k = Math.max(2, Math.floor(center - radius));
        k <= Math.min(this.previous.length - 2, Math.ceil(center + radius));
        k++
      ) {
        if (
          this.previous[k] > strongest &&
          this.previous[k] >= this.previous[k - 1] &&
          this.previous[k] >= this.previous[k + 1]
        ) {
          bin = k;
          strongest = this.previous[k];
        }
      }
      if (!bin || strongest < peak * 0.025) continue;
      const a = Math.log(Math.max(1e-12, this.previous[bin - 1]));
      const b = Math.log(Math.max(1e-12, this.previous[bin]));
      const c = Math.log(Math.max(1e-12, this.previous[bin + 1]));
      const delta = (0.5 * (a - c)) / (a - 2 * b + c);
      const estimate = ((bin + delta) * rate) / this.size / harmonic;
      if (
        Number.isFinite(estimate) &&
        Math.abs(1200 * Math.log2(estimate / frequency)) < 90
      )
        estimates.push({ frequency: estimate, harmonic });
    }
    // Agreement of upper partials disambiguates a previous bass overtone at the new fundamental.
    for (const a of estimates.filter((e) => e.harmonic > 1)) {
      const group = estimates.filter(
        (b) => Math.abs(1200 * Math.log2(b.frequency / a.frequency)) < 15,
      );
      if (group.length >= 2)
        return group.reduce((sum, e) => sum + e.frequency, 0) / group.length;
    }
    return estimates.find((e) => e.harmonic === 1)?.frequency ?? frequency;
  }
}
