import { PitchDetector } from "pitchy";

export type PitchResult = { frequency: number; clarity: number; rms: number };
let detector: PitchDetector<Float32Array> | undefined;
let centered = new Float32Array(0);
let analysisWindow = new Float32Array(0);
const REFINEMENT_STEP_CENTS = 4;
const REFINEMENT_RADIUS_CENTS = 12;
const REFINEMENT_CANDIDATES =
  (REFINEMENT_RADIUS_CENTS * 2) / REFINEMENT_STEP_CENTS + 1;
const refinementPowers = new Float64Array(REFINEMENT_CANDIDATES);
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
    analysisWindow = Float32Array.from(
      { length: buffer.length },
      (_, i) =>
        0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (buffer.length - 1)),
    );
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
  return {
    frequency: refineFundamental(centered, sampleRate, frequency),
    clarity,
    rms,
  };
}

// MPM identifies the period; this narrow spectral fit removes the small bias
// caused by stiff guitar-string partials without fitting to a requested note.
function refineFundamental(
  buffer: Float32Array,
  sampleRate: number,
  frequency: number,
) {
  const powers = refinementPowers;
  let best = 0;
  for (let i = 0; i < REFINEMENT_CANDIDATES; i++) {
    const cents = -REFINEMENT_RADIUS_CENTS + i * REFINEMENT_STEP_CENTS;
    const candidate = frequency * 2 ** (cents / 1200);
    powers[i] = goertzelPower(buffer, sampleRate, candidate);
    if (powers[i] > powers[best]) best = i;
  }
  const center = Math.floor(REFINEMENT_CANDIDATES / 2);
  const secondHarmonic = goertzelPower(buffer, sampleRate, frequency * 2);
  if (powers[center] < secondHarmonic * 0.03) return frequency;
  // A maximum on an edge is not a trustworthy local refinement.
  if (best === 0 || best === REFINEMENT_CANDIDATES - 1) return frequency;
  const left = Math.log(powers[best - 1] + Number.EPSILON);
  const middle = Math.log(powers[best] + Number.EPSILON);
  const right = Math.log(powers[best + 1] + Number.EPSILON);
  const denominator = left - 2 * middle + right;
  const delta =
    Math.abs(denominator) > Number.EPSILON
      ? Math.max(-1, Math.min(1, (0.5 * (left - right)) / denominator))
      : 0;
  const cents =
    -REFINEMENT_RADIUS_CENTS +
    (best + delta) * REFINEMENT_STEP_CENTS;
  return frequency * 2 ** (cents / 1200);
}

function goertzelPower(
  buffer: Float32Array,
  sampleRate: number,
  frequency: number,
) {
  const coefficient = 2 * Math.cos((2 * Math.PI * frequency) / sampleRate);
  let current = 0;
  let previous = 0;
  let previous2 = 0;
  for (let i = 0; i < buffer.length; i++) {
    current = buffer[i] * analysisWindow[i] + coefficient * previous - previous2;
    previous2 = previous;
    previous = current;
  }
  return previous * previous + previous2 * previous2 - coefficient * previous * previous2;
}
