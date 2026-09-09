import { describe, expect, it } from 'vitest';
import { detectPitch } from './pitch';

function sineWave(frequency: number, sampleRate = 44100, length = 8192) {
  const buffer = new Float32Array(length);

  for (let index = 0; index < length; index += 1) {
    buffer[index] = Math.sin((2 * Math.PI * frequency * index) / sampleRate) * 0.72;
  }

  return buffer;
}

function guitarLikeWave(frequency: number, sampleRate = 44100, length = 16384) {
  const buffer = new Float32Array(length);

  for (let index = 0; index < length; index += 1) {
    const time = index / sampleRate;
    const decay = Math.exp(-time * 3.2);
    buffer[index] = (
      Math.sin(2 * Math.PI * frequency * time) * 0.62 +
      Math.sin(2 * Math.PI * frequency * 2 * time) * 0.2 +
      Math.sin(2 * Math.PI * frequency * 3 * time) * 0.08
    ) * decay;
  }

  return buffer;
}

function stiffStringWave(
  frequency: number,
  sampleRate: number,
  variant: number,
  length = 8192,
) {
  let seed = 991 + variant;
  const stiffness = (variant % 6) * 0.00008;
  const amplitudes = [0.18, 0.75, 0.28, 0.17, 0.1, 0.06];
  return Float32Array.from({ length }, (_, index) => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const time = index / sampleRate;
    const harmonics = amplitudes.reduce((sum, amplitude, h) => {
      const harmonic = h + 1;
      const partial =
        harmonic === 1
          ? frequency
          : frequency *
            harmonic *
            Math.sqrt(
              (1 + stiffness * harmonic * harmonic) / (1 + stiffness),
            );
      return (
        sum +
        amplitude *
          Math.sin(2 * Math.PI * partial * time + variant * 0.29 + harmonic * 0.13)
      );
    }, 0);
    const noise = (seed / 2 ** 32 - 0.5) * 0.0015;
    return 0.01 + harmonics * 0.12 + noise;
  });
}

describe('pitch detector', () => {
  it('detects a low guitar A string from synthetic audio', () => {
    const result = detectPitch(sineWave(110), 44100);

    expect(result).not.toBeNull();
    expect(result?.frequency).toBeGreaterThan(109);
    expect(result?.frequency).toBeLessThan(111);
  });

  it('detects the high E string from synthetic audio', () => {
    const result = detectPitch(sineWave(329.6276), 44100);

    expect(result).not.toBeNull();
    expect(result?.frequency).toBeGreaterThan(328.5);
    expect(result?.frequency).toBeLessThan(330.8);
  });

  it('rejects silence instead of inventing a frequency', () => {
    expect(detectPitch(new Float32Array(8192), 44100)).toBeNull();
  });

  it('tracks a decaying harmonic-rich guitar-like note', () => {
    const result = detectPitch(guitarLikeWave(246.9417), 44100);

    expect(result).not.toBeNull();
    expect(result?.frequency).toBeGreaterThan(245.5);
    expect(result?.frequency).toBeLessThan(248.4);
  });

  it('calibrates all open strings despite stiffness, dominant partials and noise', () => {
    const strings = [82.406889, 110, 146.832384, 195.997718, 246.941651, 329.627557];
    for (const sampleRate of [44100, 48000])
      for (const frequency of strings)
        for (const cents of [-37, 0, 41]) {
          const expected = frequency * 2 ** (cents / 1200);
          const variant = Math.abs(cents) + Math.round(frequency);
          const result = detectPitch(
            stiffStringWave(expected, sampleRate, variant),
            sampleRate,
          );
          expect(result).not.toBeNull();
          expect(
            Math.abs(1200 * Math.log2(result!.frequency / expected)),
          ).toBeLessThan(0.5);
        }
  });

  it('does not jump an octave when the second harmonic dominates strongly', () => {
    for (const sampleRate of [44100, 48000])
      for (const frequency of [82.406889, 110, 146.832384, 195.997718, 246.941651, 329.627557]) {
        const buffer = Float32Array.from({ length: 8192 }, (_, i) => {
          const time = i / sampleRate;
          return (
            0.03 * Math.sin(2 * Math.PI * frequency * time) +
            0.8 * Math.sin(4 * Math.PI * frequency * time) +
            0.1 * Math.sin(6 * Math.PI * frequency * time)
          );
        });
        const result = detectPitch(buffer, sampleRate);
        expect(result).not.toBeNull();
        expect(
          Math.abs(1200 * Math.log2(result!.frequency / frequency)),
        ).toBeLessThan(2);
      }
  });
});
