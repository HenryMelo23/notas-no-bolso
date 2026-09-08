// @vitest-environment happy-dom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { microphoneError, useTuner } from "./useTuner";
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
describe("microphone initialization", () => {
  it("starts audio during the tap, stays pending across permission, and closes all tracks", async () => {
    let allow!: (stream: MediaStream) => void;
    const stop = vi.fn();
    const media = { getTracks: () => [{ stop }] } as unknown as MediaStream;
    const getUserMedia = vi.fn(
      () =>
        new Promise<MediaStream>((resolve) => {
          allow = resolve;
        }),
    );
    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia, enumerateDevices: async () => [] },
    });
    const events: string[] = [];
    class AudioMock {
      state = "running";
      sampleRate = 48000;
      destination = {};
      constructor() {
        events.push("context");
      }
      resume() {
        events.push("resume");
        return Promise.resolve();
      }
      close() {
        events.push("close");
        return Promise.resolve();
      }
      createMediaStreamSource() {
        return { connect: () => ({}) };
      }
      createAnalyser() {
        return {
          fftSize: 4096,
          smoothingTimeConstant: 0,
          connect: (x: unknown) => x,
          getFloatTimeDomainData: () => {},
        };
      }
      createGain() {
        return { gain: { value: 1 }, connect: () => ({}) };
      }
    }
    vi.stubGlobal("AudioContext", AudioMock);
    vi.stubGlobal("requestAnimationFrame", () => 1);
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    const { result } = renderHook(() => useTuner());
    let started!: Promise<boolean>;
    act(() => {
      started = result.current.start();
    });
    expect(events).toEqual(["context", "resume"]);
    expect(result.current.isStarting()).toBe(true);
    expect(result.current.starting).toBe(true);
    await act(async () => {
      allow(media);
      expect(await started).toBe(true);
    });
    expect(result.current.isListening).toBe(true);
    expect(result.current.isStarting()).toBe(false);
    act(() => result.current.stop());
    expect(stop).toHaveBeenCalledOnce();
    expect(events).toContain("close");
  });
  it("distinguishes denied access from occupied devices", () => {
    expect(
      microphoneError(new DOMException("denied", "NotAllowedError")),
    ).toContain("NotAllowedError");
    expect(
      microphoneError(new DOMException("busy", "NotReadableError")),
    ).toContain("ocupado");
  });
});
