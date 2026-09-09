import { useCallback, useEffect, useRef, useState } from "react";
import { calculateRms, detectPitch, type PitchResult } from "../lib/pitch";
import { PitchStabilizer, type StablePitchResult } from "../lib/pitchStability";
import { PracticeDetector } from "../lib/practiceDetector";

export function microphoneError(error: unknown) {
  const name = error instanceof Error ? error.name : "UnknownError";
  const messages: Record<string, string> = {
    NotAllowedError:
      "O sistema negou a captura. Permita o microfone para Notas no Bolso e confira o acesso ao microfone nas configurações de privacidade.",
    NotFoundError:
      "Nenhum microfone disponível. Conecte ou habilite uma entrada de áudio.",
    NotReadableError:
      "O microfone está ocupado ou indisponível. Feche outros gravadores e tente novamente.",
    OverconstrainedError:
      "Essa entrada não está mais disponível. Selecione Microfone padrão.",
    SecurityError:
      "A captura foi bloqueada pelo sistema. Confira as permissões do aplicativo.",
    AudioContextError:
      "Não foi possível iniciar o áudio. Toque novamente em Ativar microfone.",
  };
  return `${messages[name] ?? "Não foi possível abrir o áudio. Confira o microfone e tente novamente."} (${name})`;
}

export function useTuner() {
  const [state, setState] = useState({
    isListening: false,
    starting: false,
    error: "",
    pitch: null as StablePitchResult | null,
    rawPitch: null as PitchResult | null,
    practicePitch: null as PitchResult | null,
    practiceOnset: 0,
    rms: 0,
    sampleId: 0,
    at: 0,
    sampleRate: 0,
  });
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const context = useRef<AudioContext | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const frame = useRef(0);
  const generation = useRef(0);
  const pending = useRef(false);
  const isStarting = useCallback(() => pending.current, []);
  const stop = useCallback(() => {
    generation.current++;
    pending.current = false;
    cancelAnimationFrame(frame.current);
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (context.current) void context.current.close();
    context.current = null;
    setState((s) => ({
      ...s,
      isListening: false,
      starting: false,
      pitch: null,
      rawPitch: null,
      practicePitch: null,
      practiceOnset: 0,
      rms: 0,
    }));
  }, []);
  const start = useCallback(
    async (deviceId = "") => {
      if (pending.current) return false;
      stop();
      pending.current = true;
      const token = generation.current;
      setState((s) => ({ ...s, starting: true, error: "" }));
      let acquired: MediaStream | null = null;
      try {
        if (!navigator.mediaDevices?.getUserMedia)
          throw new Error("unsupported");
        // Start the audio context during the tap, before the OS permission dialog.
        const audio = new AudioContext({ latencyHint: "interactive" });
        context.current = audio;
        const resumed = audio.resume();
        void resumed.catch(() => {});
        acquired = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
        if (token !== generation.current) {
          acquired.getTracks().forEach((t) => t.stop());
          return false;
        }
        stream.current = acquired;
        let resumeTimer: ReturnType<typeof setTimeout> | undefined;
        try {
          await Promise.race([
            resumed,
            new Promise<never>((_, reject) => {
              resumeTimer = setTimeout(
                () =>
                  reject(
                    new DOMException("Resume timed out", "AudioContextError"),
                  ),
                4000,
              );
            }),
          ]);
        } finally {
          clearTimeout(resumeTimer);
        }
        if (token !== generation.current) return false;
        if (audio.state !== "running")
          throw new DOMException("Audio suspended", "AudioContextError");
        const analyser = audio.createAnalyser();
        analyser.fftSize = 8192;
        analyser.smoothingTimeConstant = 0;
        audio.createMediaStreamSource(acquired).connect(analyser);
        const silent = audio.createGain();
        silent.gain.value = 0;
        analyser.connect(silent).connect(audio.destination);
        const buffer = new Float32Array(analyser.fftSize);
        const tuningBuffer = buffer.subarray(buffer.length - 4096);
        const stabilizer = new PitchStabilizer();
        const practiceDetector = new PracticeDetector(analyser.fftSize);
        let lastAt = -Infinity;
        const listen = () => {
          if (token !== generation.current) return;
          const now = audio.currentTime * 1000;
          if (now - lastAt >= 1000 / 30) {
            lastAt = now;
            analyser.getFloatTimeDomainData(buffer);
            const rawPitch = detectPitch(tuningBuffer, audio.sampleRate);
            const practice = practiceDetector.process(
              buffer,
              audio.sampleRate,
              now,
            );
            const pitch = stabilizer.push(rawPitch, now);
            const rms = calculateRms(buffer);
            setState((s) => ({
              ...s,
              isListening: true,
              starting: false,
              rawPitch,
              practicePitch: practice.pitch,
              practiceOnset: practice.onset,
              pitch,
              rms,
              sampleId: s.sampleId + 1,
              at: now,
              sampleRate: audio.sampleRate,
            }));
          }
          frame.current = requestAnimationFrame(listen);
        };
        frame.current = requestAnimationFrame(listen);
        setState((s) => ({ ...s, isListening: true, starting: false }));
        void navigator.mediaDevices
          .enumerateDevices()
          .then((all) => {
            if (token === generation.current)
              setDevices(all.filter((d) => d.kind === "audioinput"));
          })
          .catch(() => {});
        return true;
      } catch (error) {
        acquired?.getTracks().forEach((t) => t.stop());
        if (token === generation.current) {
          stop();
          setState((s) => ({
            ...s,
            error: microphoneError(error),
          }));
        }
        return false;
      } finally {
        if (token === generation.current) pending.current = false;
      }
    },
    [stop],
  );
  useEffect(() => stop, [stop]);
  return { ...state, devices, start, stop, isStarting };
}
