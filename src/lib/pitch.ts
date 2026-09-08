import { PitchDetector } from "pitchy";

export type PitchResult = { frequency: number; clarity: number; rms: number };
let detector: PitchDetector<Float32Array> | undefined;
let centered = new Float32Array(0);
export function calculateRms(buffer: Float32Array) {
  let sum = 0;
  for (const value of buffer) sum += value * value;
  return Math.sqrt(sum / buffer.length);
}

export function detectPitch(
  buffer: Float32Array<ArrayBuffer>,
  sampleRate: number,
): PitchResult | null {
  if (!Number.isFinite(sampleRate) || sampleRate <= 0 || buffer.length < 32)
    return null;
  if (!detector || detector.inputLength !== buffer.length) {
    detector = PitchDetector.forFloat32Array(buffer.length);
    detector.clarityThreshold = 0.99;
    centered = new Float32Array(buffer.length);
  }
  // Remove DC bias before measuring periodicity and volume. No elapsed-time cutoff.
  let mean = 0;
  for (const value of buffer) mean += value;
  mean /= buffer.length;
  for (let i = 0; i < buffer.length; i++) centered[i] = buffer[i] - mean;
  const rms = calculateRms(centered);
  if (!Number.isFinite(rms) || rms < 0.00015) return null;
  const [frequency, clarity] = detector.findPitch(centered, sampleRate);
  if (
    !Number.isFinite(frequency) ||
    frequency < 65 ||
    frequency > 1400 ||
    clarity < 0.88
  )
    return null;
  return { frequency, clarity, rms };
}
