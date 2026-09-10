// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { App } from "./App";
import { detectPitch, type PitchResult } from "./lib/pitch";
import { midiFrequency, noteMidi } from "./lib/blues";
import { LESSONS, lessonSections } from "./lib/repertoire";

const mock = vi.hoisted(() => ({ audio: {} as Record<string, unknown> }));
vi.mock("./hooks/useTuner", () => ({ useTuner: () => mock.audio }));
let tick = 0;
beforeEach(() => {
  tick = 0;
  localStorage.clear();
  mock.audio = {
    starting: false,
    isListening: true,
    pitch: null,
    rawPitch: null,
    practicePitch: null,
    practiceOnset: undefined,
    rms: 0,
    sampleId: 0,
    at: 0,
    sampleRate: 48000,
    devices: [],
    error: "",
    start: vi.fn(async () => true),
    stop: vi.fn(),
    isStarting: () => false,
  };
});
afterEach(cleanup);
const resultFor = (midi: number): PitchResult => {
  const samples = new Float32Array(4096);
  const hz = midiFrequency(midi);
  for (let i = 0; i < samples.length; i++)
    samples[i] =
      0.15 * Math.sin((2 * Math.PI * hz * i) / 48000) +
      0.03 * Math.sin((4 * Math.PI * hz * i) / 48000);
  return detectPitch(samples, 48000)!;
};
const beginner = LESSONS[0];
const beginnerTotal = beginner.notes.length;

describe("mounted application audio smoke", () => {
  it("uses new-pluck audio even when the tuner still hears the previous bass, once per onset", async () => {
    const app = render(<App />);
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Começar a tocar" })),
    );
    const feed = (midi: number, onset: number) => {
      for (let i = 0; i < 5; i++) {
        tick++;
        mock.audio = {
          ...mock.audio,
          sampleId: tick,
          at: tick * 33.34,
          rawPitch: resultFor(40),
          practicePitch: resultFor(midi),
          practiceOnset: onset,
        };
        app.rerender(<App />);
      }
    };
    feed(noteMidi(beginner.notes[0]), 1);
    expect(screen.getByText(`1 / ${beginnerTotal} notas`)).toBeTruthy();
    feed(noteMidi(beginner.notes[1]), 2);
    expect(screen.getByText(`2 / ${beginnerTotal} notas`)).toBeTruthy();
    feed(noteMidi(beginner.notes[0]), 2);
    expect(screen.getByText(`2 / ${beginnerTotal} notas`)).toBeTruthy();
    feed(noteMidi(beginner.notes[2]), 3);
    expect(screen.getByText(`3 / ${beginnerTotal} notas`)).toBeTruthy();
  });
  it("opens the tuner automatically and does not cancel a pending OS permission dialog", () => {
    mock.audio.isListening = false;
    mock.audio.isStarting = () => true;
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Afinador" }));
    expect(mock.audio.start).toHaveBeenCalledOnce();
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(mock.audio.stop).not.toHaveBeenCalled();
    mock.audio.isStarting = () => false;
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(mock.audio.stop).toHaveBeenCalledOnce();
    hidden.mockRestore();
  });
  it("advances once, tolerates sustain, highlights wrong pitches and recovers", async () => {
    const app = render(<App />);
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Começar a tocar" })),
    );
    const feed = (midi: number | null, count = 5) => {
      for (let i = 0; i < count; i++) {
        tick++;
        mock.audio = {
          ...mock.audio,
          sampleId: tick,
          at: tick * 50,
          rawPitch: midi === null ? null : resultFor(midi),
          practicePitch: midi === null ? null : resultFor(midi),
        };
        app.rerender(<App />);
      }
    };
    const firstMidi = noteMidi(beginner.notes[0]);
    const secondMidi = noteMidi(beginner.notes[1]);
    feed(firstMidi);
    expect(screen.getByText(`1 / ${beginnerTotal} notas`)).toBeTruthy();
    feed(firstMidi, 20);
    expect(screen.getByText(`1 / ${beginnerTotal} notas`)).toBeTruthy();
    expect(
      screen.getByText("Acertou. Deixe soar e toque a próxima."),
    ).toBeTruthy();
    feed(45, 8);
    expect(
      app.container.querySelectorAll(".wrong-string").length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(`1 / ${beginnerTotal} notas`)).toBeTruthy();
    feed(secondMidi);
    expect(screen.getByText(`2 / ${beginnerTotal} notas`)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Pausar" }));
    feed(40, 10);
    expect(screen.getByText(`2 / ${beginnerTotal} notas`)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Recomeçar estudo" }));
    expect(screen.getByText(`0 / ${beginnerTotal} notas`)).toBeTruthy();
  });
  it("completes a whole lesson and keeps the tuner selectable with help popups", async () => {
    const app = render(<App />);
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Começar a tocar" })),
    );
    for (const note of beginner.notes) {
      for (let i = 0; i < 5; i++) {
        tick++;
        mock.audio = {
          ...mock.audio,
          sampleId: tick,
          at: tick * 50,
          rawPitch: null,
          practicePitch: null,
        };
        app.rerender(<App />);
      }
      for (let i = 0; i < 5; i++) {
        tick++;
        mock.audio = {
          ...mock.audio,
          sampleId: tick,
          at: tick * 50,
          rawPitch: resultFor(noteMidi(note)),
          practicePitch: resultFor(noteMidi(note)),
        };
        app.rerender(<App />);
      }
    }
    expect(screen.getByText("Você tocou a música inteira!")).toBeTruthy();
    expect(screen.getByText(`${beginnerTotal} / ${beginnerTotal} notas`)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Afinador" }));
    expect(screen.getByText("Vamos afinar o ouvido.")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Microfone e afinação" }),
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  }, 15000);
  it("loops only the selected notes, ignores sustain at the boundary and does not mark the full song complete", async () => {
    const app = render(<App />);
    fireEvent.click(app.container.querySelector("summary")!);
    fireEvent.change(screen.getByRole("combobox", { name: "Nota inicial" }), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Nota final" }), {
      target: { value: "4" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: "Repetir trecho" }));
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Começar a tocar" })),
    );
    const feed = (midi: number | null, count = 5) => {
      for (let i = 0; i < count; i++) {
        tick++;
        mock.audio = {
          ...mock.audio,
          sampleId: tick,
          at: tick * 50,
          rawPitch: midi === null ? null : resultFor(midi),
          practicePitch: midi === null ? null : resultFor(midi),
        };
        app.rerender(<App />);
      }
    };
    const loopMidi = noteMidi(beginner.notes[4]);
    feed(loopMidi);
    expect(screen.getByText(/1 volta\(s\)/)).toBeTruthy();
    feed(loopMidi, 20);
    expect(screen.getByText(/1 volta\(s\)/)).toBeTruthy();
    feed(null);
    feed(loopMidi);
    expect(screen.getByText(/2 volta\(s\)/)).toBeTruthy();
    expect(localStorage.getItem("blues-notebook-progress")).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "Repetir trecho" }));
    feed(null);
    feed(loopMidi);
    expect(screen.getByText("Você concluiu o trecho escolhido!")).toBeTruthy();
    expect(screen.getByText("1 / 1 notas")).toBeTruthy();
  });
  it("searches real songs, shows high frets, changes theme and resets ranges on song changes", () => {
    const app = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Modo escuro" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("notas-theme")).toBe("dark");
    fireEvent.click(screen.getByRole("button", { name: "Biblioteca" }));
    fireEvent.change(
      screen.getByRole("textbox", { name: "Buscar música ou artista" }),
      { target: { value: "B.B. King" } },
    );
    const article = app.container.querySelector(".lesson-list article")!;
    expect(article.textContent).toContain("The Thrill Is Gone");
    expect(article.querySelector('a[href*="youtube.com/watch"]')).toBeTruthy();
    fireEvent.click(article.querySelector("button")!);
    expect(app.container.querySelector(".mini-neck footer")?.textContent).toBe(
      "solta9101112",
    );
    expect(app.container.querySelector(".mini-neck b")?.textContent).toBe("4");
    fireEvent.click(
      screen.getByRole("button", { name: "Base · segunda volta" }),
    );
    fireEvent.click(app.container.querySelector("summary")!);
    expect(
      (
        screen.getByRole("combobox", {
          name: "Nota inicial",
        }) as HTMLSelectElement
      ).value,
    ).toBe("60");
    fireEvent.click(screen.getByRole("button", { name: "Recomeçar estudo" }));
    const selected = LESSONS.find((item) => item.title === "The Thrill Is Gone")!;
    const selectedSection = lessonSections(selected)[1];
    expect(app.container.querySelector(".tab-footer")?.textContent).toContain(
      `0 / ${selectedSection.end - selectedSection.start + 1} notas`,
    );
  });
});
