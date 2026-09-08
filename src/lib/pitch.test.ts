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
});
