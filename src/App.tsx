import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Guitar,
  Headphones,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Volume2,
  X,
  Moon,
  Sun,
  Repeat2,
  Youtube,
  Search,
} from "lucide-react";
import {
  FINGERS,
  STRINGS,
  STRING_NAMES,
  midiFrequency,
  noteMidi,
  pitchLabel,
  possiblePositions,
  type BluesLesson,
} from "./lib/blues";
import { LESSONS as BLUES, lessonSections } from "./lib/repertoire";
import { LessonFollower, type FollowResult } from "./lib/lessonFollower";
import { useTuner } from "./hooks/useTuner";
import { Capacitor } from "@capacitor/core";
import { App as NativeApp } from "@capacitor/app";
import { TuningCoach } from "./lib/tuningCoach";

type View = "practice" | "library" | "tuner";
type Session = FollowResult & { index: number; complete: boolean };
const initialSession = (): Session => ({
  index: 0,
  complete: false,
  advance: false,
  feedback: "waiting",
  midi: null,
  cents: 0,
});
function readProgress(): Record<string, number> {
  try {
    const value = JSON.parse(
      localStorage.getItem("blues-notebook-progress") ?? "{}",
    );
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(
        (entry): entry is [string, number] =>
          typeof entry[1] === "number" &&
          Number.isFinite(entry[1]) &&
          entry[1] >= 0 &&
          entry[1] <= 100,
      ),
    );
  } catch {
    return {};
  }
}
function writeProgress(value: Record<string, number>) {
  try {
    localStorage.setItem("blues-notebook-progress", JSON.stringify(value));
  } catch {
    /* Practice still works when storage is unavailable. */
  }
}

export function App() {
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("notas-theme") === "dark";
    } catch {
      return false;
    }
  });
  const [search, setSearch] = useState("");
  const [range, setRange] = useState({
    start: 0,
    end: BLUES[0].notes.length - 1,
  });
  const [loop, setLoop] = useState(false);
  const [laps, setLaps] = useState(0);
  const [view, setView] = useState<View>("practice");
  const [lessonId, setLessonId] = useState(BLUES[0].id);
  const [session, setSession] = useState(initialSession);
  const sessionRef = useRef(session);
  const [running, setRunning] = useState(false);
  const [help, setHelp] = useState<"tab" | "lesson" | "audio" | null>(null);
  const [device, setDevice] = useState("");
  const [reference, setReference] = useState(440);
  const [offset, setOffset] = useState(0);
  const guide = useRef(new TuningCoach());
  const [tuning, setTuning] = useState(() => guide.current.snapshot());
  const [autoTuning, setAutoTuning] = useState(true);
  const tuningString = tuning.string;
  const checked = tuning.checked;
  const [keyInfo, setKeyInfo] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [progress, setProgress] = useState(readProgress);
  const [demo, setDemo] = useState(false);
  const demoContext = useRef<AudioContext | null>(null);
  const demoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const follower = useRef(new LessonFollower());
  const consumedSample = useRef(0);
  const runToken = useRef(0);
  const tuner = useTuner();
  const lesson = BLUES.find((l) => l.id === lessonId)!;
  const sections = useMemo(() => lessonSections(lesson), [lesson]);
  const noteOptions = useMemo(
    () =>
      lesson.notes.map((_, i) => (
        <option key={i} value={i}>
          {i + 1}
        </option>
      )),
    [lesson],
  );
  const activeSection = sections.find(
    (s) => session.index >= s.start && session.index <= s.end,
  )!;
  const total = range.end - range.start + 1;
  const fullRange = range.start === 0 && range.end === lesson.notes.length - 1;
  const neckStart = Math.max(1, lesson.notes[session.index].fret - 3);
  const neckFrets = [0, neckStart, neckStart + 1, neckStart + 2, neckStart + 3];
  const current = lesson.notes[session.index];
  const wrong = session.feedback === "wrong";
  const possible =
    wrong && session.midi !== null ? possiblePositions(session.midi) : [];
  const practiceProgress = session.complete
    ? 100
    : ((session.index - range.start) / total) * 100;
  const tuningFrequency =
    midiFrequency(STRINGS[tuningString - 1], reference) * 2 ** (offset / 1200);
  const fresh =
    tuner.pitch &&
    !tuner.pitch.held &&
    tuner.pitch.clarity >= 0.88 &&
    !tuning.waitingNext &&
    !tuning.complete;
  const cents = tuner.pitch
    ? 1200 * Math.log2(tuner.pitch.frequency / tuningFrequency)
    : null;
  const nearTarget = cents !== null && Math.abs(cents) <= 100;
  const centered = fresh && cents !== null && Math.abs(cents) <= 5;
  const tuningMessage = !tuner.isListening
    ? "Ative o microfone"
    : tuning.complete
      ? "Seis cordas conferidas!"
      : tuning.waitingNext
        ? `Agora, toque a ${tuningString}ª corda solta`
        : !fresh
          ? "Toque a corda solta"
          : !nearTarget
            ? "Confira a corda selecionada"
            : centered
              ? "No ponto!"
              : cents! > 0
                ? "Afrouxe um pouquinho"
                : "Aperte um pouquinho";

  function publish(next: Session) {
    sessionRef.current = next;
    setSession(next);
  }
  function stopDemo() {
    if (demoTimer.current) clearTimeout(demoTimer.current);
    demoTimer.current = null;
    if (demoContext.current) void demoContext.current.close();
    demoContext.current = null;
    setDemo(false);
  }
  function pause() {
    runToken.current++;
    setRunning(false);
  }
  function go(next: View) {
    pause();
    stopDemo();
    setView(next);
    if (next === "tuner" && !tuner.isListening && !tuner.starting)
      void tuner.start(device);
  }
  function reset(index = range.start) {
    pause();
    stopDemo();
    follower.current.reset();
    publish({ ...initialSession(), index });
    setLaps(0);
  }
  function selectLesson(id: string) {
    reset(0);
    setRange({
      start: 0,
      end: BLUES.find((l) => l.id === id)!.notes.length - 1,
    });
    setLessonId(id);
    setView("practice");
  }
  function changeRange(start: number, end: number) {
    const from = Math.max(0, Math.min(lesson.notes.length - 1, start));
    const to = Math.max(from, Math.min(lesson.notes.length - 1, end));
    setRange({ start: from, end: to });
    reset(from);
  }
  function pauseForRecording() {
    pause();
    stopDemo();
    tuner.stop();
  }
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", dark ? "#191b1d" : "#f9f9f6");
    try {
      localStorage.setItem("notas-theme", dark ? "dark" : "light");
    } catch {
      /* Optional preference. */
    }
  }, [dark]);
  useEffect(() => {
    const suspend = () => {
      if (document.hidden && !tuner.isStarting()) {
        pause();
        stopDemo();
        tuner.stop();
      }
    };
    document.addEventListener("visibilitychange", suspend);
    return () => document.removeEventListener("visibilitychange", suspend);
  }, [tuner.stop, tuner.isStarting]);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listeners = [
      NativeApp.addListener("appStateChange", ({ isActive }) => {
        if (!isActive && !tuner.isStarting()) {
          pause();
          stopDemo();
          tuner.stop();
        }
      }),
      NativeApp.addListener("backButton", () => {
        if (help) setHelp(null);
        else if (view !== "practice") go("practice");
        else {
          pauseForRecording();
          void NativeApp.minimizeApp();
        }
      }),
    ];
    return () =>
      listeners.forEach((listener) => {
        void listener.then((handle) => handle.remove());
      });
  }, [view, help, tuner.stop, tuner.isStarting]);
  async function togglePractice() {
    if (running) {
      pause();
      return;
    }
    stopDemo();
    const token = ++runToken.current;
    const ready = tuner.isListening || (await tuner.start(device));
    if (ready && runToken.current === token) {
      follower.current.reset();
      publish({ ...sessionRef.current, feedback: "waiting", midi: null });
      setRunning(true);
    }
  }
  async function preview(all = false) {
    pause();
    stopDemo();
    tuner.stop();
    const audio = new AudioContext();
    demoContext.current = audio;
    setDemo(true);
    await audio.resume();
    if (demoContext.current !== audio) return;
    const notes = all
      ? lesson.notes.slice(
          session.index,
          Math.min(session.index + 8, range.end + 1),
        )
      : [current];
    let elapsed = 0;
    for (const note of notes) {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const start = audio.currentTime + elapsed;
      oscillator.type = "triangle";
      oscillator.frequency.value = midiFrequency(noteMidi(note), reference);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.55);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.6);
      elapsed +=
        lesson.id === "shuffle"
          ? notes.indexOf(note) % 2 === 0
            ? 0.8
            : 0.4
          : 0.65;
    }
    demoTimer.current = setTimeout(stopDemo, elapsed * 1000 + 300);
  }
  useEffect(
    () => () => {
      runToken.current++;
      if (demoTimer.current) clearTimeout(demoTimer.current);
      if (demoContext.current) void demoContext.current.close();
    },
    [],
  );

  useEffect(() => {
    if (consumedSample.current === tuner.sampleId) return;
    consumedSample.current = tuner.sampleId;
    if (
      !running ||
      view !== "practice" ||
      !tuner.isListening ||
      sessionRef.current.complete ||
      demo
    )
      return;
    const before = sessionRef.current;
    const result = follower.current.push(
      tuner.practicePitch,
      noteMidi(lesson.notes[before.index]),
      tuner.at,
      reference,
    );
    const reachedEnd = result.advance && before.index === range.end;
    const complete = reachedEnd && !loop;
    const index =
      reachedEnd && loop
        ? range.start
        : result.advance && !complete
          ? before.index + 1
          : before.index;
    publish({ ...result, index, complete });
    if (reachedEnd) setLaps((old) => old + 1);
    if (result.advance && fullRange) {
      const value = reachedEnd
        ? 100
        : Math.round((index / lesson.notes.length) * 100);
      setProgress((old) => {
        const next = {
          ...old,
          [lesson.id]: Math.max(old[lesson.id] ?? 0, value),
        };
        writeProgress(next);
        return next;
      });
    }
    if (complete) setRunning(false);
  }, [
    tuner.sampleId,
    tuner.rawPitch,
    tuner.practicePitch,
    tuner.practiceOnset,
    tuner.at,
    tuner.isListening,
    running,
    view,
    lesson,
    reference,
    demo,
    range,
    loop,
    fullRange,
  ]);

  useEffect(() => {
    if (view !== "tuner" || !tuner.isListening) return;
    const next = guide.current.observe(
      tuner.rawPitch,
      tuner.at,
      autoTuning,
      reference,
      offset,
    );
    setTuning((old) =>
      old.string === next.string &&
      old.waitingNext === next.waitingNext &&
      old.complete === next.complete &&
      old.checked.join(",") === next.checked.join(",")
        ? old
        : next,
    );
  }, [
    view,
    tuner.rawPitch,
    tuner.at,
    tuner.isListening,
    autoTuning,
    reference,
    offset,
  ]);

  const feedback = session.complete
    ? fullRange
      ? "Você tocou o blues inteiro!"
      : "Você concluiu o trecho escolhido!"
    : !running
      ? "Seu blues começa com uma nota."
      : session.feedback === "sustain"
        ? "Acertou. Deixe soar e toque a próxima."
        : session.feedback === "correct"
          ? "Isso! Vamos para a próxima nota."
          : wrong
            ? `Ouvi ${pitchLabel(session.midi!)}. Vamos tentar ${pitchLabel(noteMidi(current))}.`
            : session.feedback === "intonation"
              ? "Quase! Confira a pressão do dedo e a afinação."
              : "Estou ouvindo. Toque quando quiser.";

  return (
    <div className="notebook">
      <header className="topbar">
        <button className="brand" onClick={() => go("practice")}>
          <Guitar size={28} />
          <span>
            Notas<span className="brand-script">no Bolso</span>
          </span>
        </button>
        <nav aria-label="Menu principal">
          <button
            className={view === "practice" ? "selected" : ""}
            onClick={() => go("practice")}
          >
            <Play size={16} />
            Praticar
          </button>
          <button
            className={view === "library" ? "selected" : ""}
            onClick={() => go("library")}
          >
            <BookOpen size={16} />
            Biblioteca
          </button>
          <button
            className={view === "tuner" ? "selected" : ""}
            onClick={() => go("tuner")}
          >
            <SlidersHorizontal size={16} />
            Afinador
          </button>
        </nav>
        <div className="header-tools">
          <button
            className="icon-button"
            title={dark ? "Modo claro" : "Modo escuro"}
            aria-label={dark ? "Modo claro" : "Modo escuro"}
            onClick={() => setDark((v) => !v)}
          >
            {dark ? <Sun size={21} /> : <Moon size={21} />}
          </button>
          <button
            className="icon-button help-button"
            title="Ajuda"
            aria-label="Ajuda"
            onClick={() => setHelp("tab")}
          >
            <CircleHelp size={22} />
          </button>
        </div>
      </header>

      <main>
        {view === "practice" && (
          <>
            <div className="page-heading">
              <div>
                <span className="eyebrow">
                  CADERNO DE BLUES / ESTUDO {BLUES.indexOf(lesson) + 1}
                </span>
                <h1>{lesson.title}</h1>
                <p>{lesson.subtitle}</p>
                <button
                  className="text-button song-key-button"
                  aria-expanded={keyInfo}
                  onClick={() => setKeyInfo((v) => !v)}
                >
                  <Guitar size={17} /> Tom da música: {lesson.key}{" "}
                  <CircleHelp size={16} />
                </button>
                {keyInfo && (
                  <div className="song-key-info">
                    <strong>Tom: {lesson.key} · Afinação padrão</strong>
                    <p>
                      O tom vem das notas e dos acordes que você toca nas casas.
                      Mantenha as cordas soltas em Mi, Lá, Ré, Sol, Si, Mi; não
                      é preciso mudar a afinação para este arranjo.
                    </p>
                    <p>
                      Acordes do estudo:{" "}
                      {[...new Set(lesson.notes.map((n) => n.chord))].join(
                        " · ",
                      )}
                    </p>
                    {lesson.tuningNote && <p>{lesson.tuningNote}</p>}
                  </div>
                )}
                {lesson.youtube && (
                  <a
                    className="recording-link"
                    href={lesson.youtube}
                    target="_blank"
                    rel="noreferrer"
                    onClick={pauseForRecording}
                  >
                    <Youtube size={18} /> Ouvir gravação · {lesson.recording}
                  </a>
                )}
              </div>
              <span className="hand-note">
                Uma nota de cada vez.
                <br />
                No seu tempo.
              </span>
            </div>
            <details className="practice-range">
              <summary>
                <Repeat2 size={18} /> Trecho de prática{" "}
                <span>
                  {fullRange
                    ? "Estudo inteiro"
                    : `Notas ${range.start + 1} a ${range.end + 1}`}
                  {laps > 0 ? ` · ${laps} volta(s)` : ""}
                </span>
              </summary>
              <div className="range-controls">
                <label>
                  Da parte
                  <select
                    aria-label="Da parte"
                    value={sections.findIndex(
                      (s) => range.start >= s.start && range.start <= s.end,
                    )}
                    onChange={(e) => {
                      const s = sections[Number(e.target.value)];
                      changeRange(s.start, Math.max(s.end, range.end));
                    }}
                  >
                    {sections.map((s, i) => (
                      <option key={s.title} value={i}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Até a parte
                  <select
                    aria-label="Até a parte"
                    value={sections.findIndex(
                      (s) => range.end >= s.start && range.end <= s.end,
                    )}
                    onChange={(e) => {
                      const s = sections[Number(e.target.value)];
                      changeRange(Math.min(range.start, s.start), s.end);
                    }}
                  >
                    {sections.map((s, i) => (
                      <option key={s.title} value={i}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Nota inicial
                  <select
                    aria-label="Nota inicial"
                    value={range.start}
                    onChange={(e) =>
                      changeRange(Number(e.target.value), range.end)
                    }
                  >
                    {noteOptions}
                  </select>
                </label>
                <label>
                  Nota final
                  <select
                    aria-label="Nota final"
                    value={range.end}
                    onChange={(e) =>
                      changeRange(
                        Math.min(range.start, Number(e.target.value)),
                        Number(e.target.value),
                      )
                    }
                  >
                    {noteOptions}
                  </select>
                </label>
                <label className="loop-toggle">
                  <input
                    type="checkbox"
                    checked={loop}
                    onChange={(e) => setLoop(e.target.checked)}
                  />{" "}
                  Repetir trecho
                </label>
                <button
                  className="text-button"
                  onClick={() => changeRange(0, lesson.notes.length - 1)}
                >
                  Estudo inteiro <RotateCcw size={16} />
                </button>
              </div>
            </details>
            <div className="section-strip" aria-label="Partes do estudo">
              {sections.map((s) => (
                <button
                  key={s.title}
                  className={activeSection === s ? "active" : ""}
                  aria-pressed={range.start === s.start && range.end === s.end}
                  onClick={() => changeRange(s.start, s.end)}
                >
                  {s.title}
                </button>
              ))}
            </div>
            <div className="practice-grid">
              <section
                className="lesson-paper"
                aria-label="Treino de tablatura"
              >
                <div className="lesson-toolbar">
                  <span>
                    <b>{current.chord}</b> · Tom de {lesson.key}
                  </span>
                  <span>
                    {lesson.artist ? "Bloco" : "Compasso"} {current.bar} /{" "}
                    {lesson.notes[lesson.notes.length - 1].bar}
                  </span>
                  <button
                    className="icon-button"
                    title="Ler a tablatura"
                    aria-label="Ler a tablatura"
                    onClick={() => setHelp("tab")}
                  >
                    <CircleHelp size={18} />
                  </button>
                </div>
                <div className="tab-caption">
                  <span className="pencil-label">
                    {session.complete ? "Feito!" : "Toque esta nota"}{" "}
                    <span>↓</span>
                  </span>
                  <span className="tab-legend">número = casa</span>
                </div>
                <div className="mobile-cue">
                  {current.string}ª corda ·{" "}
                  {current.fret === 0
                    ? "solta"
                    : `casa ${current.fret} · dedo ${current.finger}`}
                </div>
                <div
                  className="tab-window"
                  role="img"
                  aria-label={`Tablatura: corda ${current.string}, casa ${current.fret}, ${FINGERS[current.finger]}`}
                >
                  <div className="tab-target" />
                  {STRINGS.map((_, stringIndex) => (
                    <div
                      className={`tab-string ${wrong && possible.some((p) => p.string === stringIndex + 1) ? "wrong-string" : ""}`}
                      key={stringIndex}
                      data-string={stringIndex + 1}
                    >
                      <span className="tab-string-name">
                        {["e", "B", "G", "D", "A", "E"][stringIndex]}
                        <small>{stringIndex + 1}</small>
                      </span>
                      {Array.from({ length: 8 }, (_, i) => {
                        const note =
                          session.index + i <= range.end
                            ? lesson.notes[session.index + i]
                            : undefined;
                        return (
                          <span
                            className={`tab-cell ${i === 0 ? "current" : ""}`}
                            key={i}
                          >
                            {note?.string === stringIndex + 1 && (
                              <b
                                key={`${session.index}-${i}`}
                                className={i === 0 ? "note-dot" : "future-note"}
                              >
                                {note.fret}
                              </b>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  ))}
                </div>
                <div className="tab-footer">
                  <span>↑ corda fina &nbsp; · &nbsp; ↓ corda grossa</span>
                  <span>
                    {session.complete ? total : session.index - range.start} /{" "}
                    {total} notas
                  </span>
                </div>
                <div
                  className="lesson-feedback"
                  data-feedback={session.feedback}
                  aria-live="polite"
                >
                  <span className={`feedback-icon ${wrong ? "wrong" : ""}`}>
                    {wrong ? (
                      <X />
                    ) : session.complete ||
                      session.feedback === "sustain" ||
                      session.feedback === "correct" ? (
                      <Check />
                    ) : (
                      <Headphones />
                    )}
                  </span>
                  <div>
                    <strong>{feedback}</strong>
                    <p>
                      {wrong
                        ? possible.length === 1
                          ? `Posição possível: corda ${possible[0].string}, casa ${possible[0].fret}.`
                          : "Esse som existe em mais de uma corda. As posições possíveis piscam em vermelho."
                        : session.feedback === "sustain" &&
                            session.midi === noteMidi(current)
                          ? "Para repetir a nota, abafe por um instante e dedilhe novamente."
                          : session.feedback === "intonation"
                            ? "Não gire a tarraxa com a casa pressionada. Confira a corda solta no afinador."
                            : "Sem contagem regressiva. Sem perder pontos."}
                    </p>
                  </div>
                </div>
                <div className="practice-actions">
                  <button
                    className="primary"
                    disabled={tuner.starting || session.complete}
                    onClick={togglePractice}
                  >
                    {running ? <Pause size={18} /> : <Mic size={18} />}{" "}
                    {tuner.starting
                      ? "Abrindo microfone…"
                      : running
                        ? "Pausar"
                        : "Começar a tocar"}
                  </button>
                  <button
                    className="secondary"
                    onClick={() => (demo ? stopDemo() : void preview(true))}
                  >
                    {demo ? <Pause size={17} /> : <Volume2 size={17} />}{" "}
                    {demo ? "Parar exemplo" : "Ouvir trecho"}
                  </button>
                  <button
                    className="icon-button"
                    title="Recomeçar estudo"
                    aria-label="Recomeçar estudo"
                    onClick={() => reset()}
                  >
                    <RotateCcw size={20} />
                  </button>
                </div>
                <div
                  className="progress-line"
                  role="progressbar"
                  aria-label="Progresso do estudo"
                  aria-valuenow={Math.round(practiceProgress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span style={{ width: `${practiceProgress}%` }} />
                </div>
              </section>
              <aside className="coach">
                <div className="coach-top">
                  <span className="eyebrow">SUA PRÓXIMA NOTA</span>
                  <button
                    className="icon-button"
                    title="Ouvir esta nota"
                    aria-label="Ouvir esta nota"
                    onClick={() => void preview()}
                  >
                    <Volume2 size={19} />
                  </button>
                </div>
                <div className="instruction-number">
                  <strong>
                    {current.string}
                    <small>ª</small>
                  </strong>
                  <div>
                    corda<span>{STRING_NAMES[current.string - 1]}</span>
                  </div>
                </div>
                <dl className="finger-directions">
                  <div>
                    <dt>Casa</dt>
                    <dd>{current.fret === 0 ? "0 · solta" : current.fret}</dd>
                  </div>
                  <div>
                    <dt>Dedo</dt>
                    <dd>
                      {current.fret === 0
                        ? "Nenhum"
                        : `${current.finger} · ${FINGERS[current.finger]}`}
                    </dd>
                  </div>
                  <div>
                    <dt>Som esperado</dt>
                    <dd>{pitchLabel(noteMidi(current))}</dd>
                  </div>
                </dl>
                <div
                  className="mini-neck"
                  aria-label="Posição do dedo no braço"
                >
                  {[1, 2, 3, 4, 5, 6].map((s) => (
                    <div key={s}>
                      <small>{s}</small>
                      {neckFrets.map((f) => (
                        <span key={f}>
                          {s === current.string && f === current.fret ? (
                            <b>{current.finger || "○"}</b>
                          ) : null}
                        </span>
                      ))}
                    </div>
                  ))}
                  <footer>
                    {neckFrets.map((f) => (
                      <span key={f}>{f === 0 ? "solta" : f}</span>
                    ))}
                  </footer>
                </div>
                <button
                  className="text-button"
                  onClick={() => setHelp("lesson")}
                >
                  <Sparkles size={17} /> Um conselho para este blues{" "}
                  <ChevronRight size={15} />
                </button>
              </aside>
            </div>
            <div className="under-practice">
              <img
                className="buddy"
                src="./blues-buddy.svg"
                alt="Violão desenhado com chapéu de blues"
              />
              <p className="hand-note">
                Errar faz parte.
                <br />A próxima tentativa é sua.
              </p>
              <div className="tuning-reminder">
                <Guitar size={24} />
                <div>
                  <strong>
                    {checked.length === 6 && offset === 0
                      ? "Seis cordas conferidas."
                      : "Seu violão está afinado?"}
                  </strong>
                  <p>Padrão Mi · Lá · Ré · Sol · Si · Mi</p>
                </div>
                <button className="text-button" onClick={() => go("tuner")}>
                  Conferir <ArrowRight size={17} />
                </button>
              </div>
            </div>
            {session.complete && (
              <div className="completion" role="status">
                <Check />
                <strong>
                  {fullRange
                    ? "Estudo concluído. Seu blues ganhou vida!"
                    : "Trecho concluído. Mais uma volta?"}
                </strong>
                <button className="secondary" onClick={() => reset()}>
                  Repetir trecho <Repeat2 size={18} />
                </button>
                <button
                  className="secondary"
                  onClick={() =>
                    selectLesson(
                      BLUES[(BLUES.indexOf(lesson) + 1) % BLUES.length].id,
                    )
                  }
                >
                  Próximo blues <ArrowRight size={18} />
                </button>
              </div>
            )}
          </>
        )}

        {view === "library" && (
          <>
            <div className="page-heading">
              <div>
                <span className="eyebrow">SEU REPERTÓRIO</span>
                <h1>Um caderno cheio de blues.</h1>
                <p>
                  5 estudos iniciais e 9 músicas em versões didáticas, corda por
                  corda.
                </p>
              </div>
              <img
                className="library-buddy"
                src="./blues-buddy.svg"
                alt="Violão de blues desenhado"
              />
            </div>
            <label className="library-search">
              <Search size={20} />
              <input
                aria-label="Buscar música ou artista"
                placeholder="Música ou artista"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <div className="lesson-list">
              {BLUES.filter((item) =>
                `${item.title} ${item.artist ?? ""}`
                  .toLocaleLowerCase()
                  .includes(search.toLocaleLowerCase()),
              ).map((item) => (
                <article key={item.id}>
                  <span className="lesson-index">
                    {String(BLUES.indexOf(item) + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h2>{item.title}</h2>
                    <p>{item.subtitle}</p>
                    <small>
                      {item.notes.length} notas · {item.key} ·{" "}
                      {lessonSections(item).length} partes
                    </small>
                  </div>
                  <div className="library-progress">
                    {progress[item.id] === 100 ? (
                      <Check size={22} />
                    ) : (
                      <span>{progress[item.id] ?? 0}%</span>
                    )}
                    <small>praticado</small>
                  </div>
                  <button
                    className="secondary"
                    onClick={() => selectLesson(item.id)}
                  >
                    Praticar <ArrowRight size={18} />
                  </button>
                  <div className="library-links">
                    <a
                      href={item.source}
                      target="_blank"
                      rel="noreferrer"
                      onClick={pauseForRecording}
                    >
                      {item.artist
                        ? "Cifra de referência"
                        : "Referência didática"}
                    </a>
                    {item.youtube && (
                      <a
                        href={item.youtube}
                        target="_blank"
                        rel="noreferrer"
                        onClick={pauseForRecording}
                      >
                        <Youtube size={16} /> Ouvir gravação
                      </a>
                    )}
                  </div>
                </article>
              ))}
              {!BLUES.some((item) =>
                `${item.title} ${item.artist ?? ""}`
                  .toLocaleLowerCase()
                  .includes(search.toLocaleLowerCase()),
              ) && <p>Nenhuma música encontrada.</p>}
            </div>
          </>
        )}

        {view === "tuner" && (
          <>
            <div className="page-heading">
              <div>
                <span className="eyebrow">ANTES DO PRIMEIRO BLUES</span>
                <h1>Vamos afinar o ouvido.</h1>
                <p>
                  Toque uma corda solta ou escolha uma abaixo. Lá = {reference}{" "}
                  Hz.
                </p>
              </div>
              <button className="secondary" onClick={() => go("practice")}>
                <ArrowLeft size={17} /> Voltar ao blues
              </button>
            </div>
            <div className="tuner-layout">
              <section className="tuner-paper">
                <div className="tuner-mode" aria-label="Modo do afinador">
                  <button
                    aria-pressed={autoTuning}
                    onClick={() => setAutoTuning(true)}
                  >
                    Detectar corda
                  </button>
                  <button
                    aria-pressed={!autoTuning}
                    onClick={() => setAutoTuning(false)}
                  >
                    Escolher corda
                  </button>
                </div>
                <div className="string-pickers" aria-label="Escolher corda">
                  {[6, 5, 4, 3, 2, 1].map((s) => (
                    <button
                      className={tuningString === s ? "selected" : ""}
                      key={s}
                      aria-pressed={tuningString === s}
                      onClick={() => {
                        setAutoTuning(false);
                        setTuning(guide.current.select(s));
                        if (!tuner.isListening && !tuner.starting)
                          void tuner.start(device);
                      }}
                    >
                      <small>{s}ª</small>
                      <b>{pitchLabel(STRINGS[s - 1]).slice(0, -1)}</b>
                      {checked.includes(s) ? <Check size={14} /> : <span />}
                    </button>
                  ))}
                </div>
                <div className={`tuner-note ${centered ? "tuned" : ""}`}>
                  <span>{STRING_NAMES[tuningString - 1]}</span>
                  <strong>{pitchLabel(STRINGS[tuningString - 1])}</strong>
                  <span>{tuningFrequency.toFixed(2)} Hz · alvo</span>
                </div>
                <div className="tuning-meter">
                  <div className="tuning-center" />
                  <span
                    className="meter-needle"
                    style={{
                      left: `${!fresh || cents === null ? 50 : 50 + Math.max(-50, Math.min(50, cents)) * 0.9}%`,
                      opacity: fresh ? 1 : 0,
                    }}
                  />
                  <div className="meter-ticks">
                    {Array.from({ length: 21 }, (_, i) => (
                      <i key={i} />
                    ))}
                  </div>
                </div>
                <div className="meter-labels">
                  <span>Mais grave</span>
                  <b>no centro</b>
                  <span>Mais agudo</span>
                </div>
                <div className="tuning-status" aria-live="polite">
                  <strong>{tuningMessage}</strong>
                  <p>
                    {tuning.complete
                      ? offset === 0
                        ? "Seu violão está pronto para praticar em afinação padrão."
                        : "Seis cordas conferidas na referência escolhida."
                      : tuning.waitingNext
                        ? "A corda anterior está conferida. Pode deixá-la soar enquanto prepara a próxima."
                        : !fresh
                          ? "A leitura só orienta ajustes enquanto a nota está sendo ouvida."
                          : !nearTarget
                            ? "O som está distante do alvo. Confirme a corda e a oitava antes de girar a tarraxa."
                            : centered
                              ? "Pode parar de girar a tarraxa."
                              : "Faça um ajuste pequeno e toque de novo."}
                  </p>
                  <span>
                    {fresh && cents !== null
                      ? `${cents > 0 ? "+" : ""}${cents.toFixed(1)} cents · ouvido ${tuner.pitch!.frequency.toFixed(2)} Hz`
                      : (tuning.waitingNext || tuning.complete) &&
                          tuner.pitch &&
                          !tuner.pitch.held
                        ? `Som atual: ${tuner.pitch.frequency.toFixed(2)} Hz · medindo`
                        : tuning.waitingNext || tuning.complete
                          ? "Corda conferida · aguardando próximo som"
                          : tuner.pitch?.held
                            ? `Última leitura: ${tuner.pitch.frequency.toFixed(2)} Hz · sinal fraco`
                            : "— cents · aguardando som"}
                  </span>
                </div>
                <div className="practice-actions">
                  <button
                    className="primary"
                    disabled={tuner.starting}
                    onClick={() => {
                      stopDemo();
                      if (tuner.isListening) tuner.stop();
                      else void tuner.start(device);
                    }}
                  >
                    <Mic size={18} />
                    {tuner.isListening
                      ? "Desligar microfone"
                      : "Ativar microfone"}
                  </button>
                  <span>{checked.length}/6 conferidas</span>
                  <button
                    className="icon-button"
                    title="Conferir as seis cordas novamente"
                    aria-label="Conferir as seis cordas novamente"
                    onClick={() => setTuning(guide.current.reset())}
                  >
                    <RotateCcw size={18} />
                  </button>
                </div>
                {tuning.complete && (
                  <div className="tuning-complete">
                    <p>
                      {offset === 0
                        ? `Que tal tocar ${BLUES[(BLUES.indexOf(lesson) + 1) % BLUES.length].title}?`
                        : "Conferência concluída. Para os estudos da biblioteca, use a afinação padrão."}
                    </p>
                    <button
                      className="secondary"
                      onClick={() => {
                        selectLesson(
                          BLUES[(BLUES.indexOf(lesson) + 1) % BLUES.length].id,
                        );
                      }}
                    >
                      Escolher próximo estudo <ArrowRight size={17} />
                    </button>
                  </div>
                )}
              </section>
              <aside className="tuner-notes">
                <img src="./blues-buddy.svg" alt="Violão de blues desenhado" />
                <h2>Sem pressa na tarraxa.</h2>
                <p>
                  Toque uma corda de cada vez. O verde aparece quando o som
                  permanece próximo do alvo.
                </p>
                <button
                  className="text-button"
                  onClick={() => setHelp("audio")}
                >
                  <CircleHelp size={18} /> Microfone e afinação
                </button>
                <button
                  className="text-button"
                  onClick={() => setAdvanced((v) => !v)}
                  aria-expanded={advanced}
                >
                  <Settings2 size={18} /> Ajustes de referência
                </button>
                {advanced && (
                  <div className="calibration">
                    <label>
                      Lá de referência{" "}
                      <input
                        type="number"
                        min="432"
                        max="445"
                        value={reference}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (n >= 432 && n <= 445) {
                            setReference(n);
                            setTuning(guide.current.reset());
                          }
                        }}
                      />
                      <small>Hz</small>
                    </label>
                    <label>
                      Afinação{" "}
                      <select
                        value={offset}
                        onChange={(e) => {
                          setOffset(Number(e.target.value));
                          setTuning(guide.current.reset());
                        }}
                      >
                        <option value={0}>Padrão</option>
                        <option value={-50}>1/4 de tom abaixo</option>
                        <option value={-100}>1/2 tom abaixo</option>
                        <option value={-200}>1 tom abaixo</option>
                      </select>
                    </label>
                    {offset !== 0 && (
                      <p>
                        Os estudos da biblioteca pedem afinação padrão. Volte a
                        Padrão antes de praticar.
                      </p>
                    )}
                    <button
                      className="text-button"
                      onClick={() => {
                        setReference(440);
                        setOffset(0);
                        setTuning(guide.current.reset());
                      }}
                    >
                      Restaurar 440 Hz / Padrão
                    </button>
                  </div>
                )}
              </aside>
            </div>
          </>
        )}

        <footer className="audio-footer">
          <span className={`record-dot ${tuner.isListening ? "active" : ""}`} />
          <span>
            {demo
              ? "Ouvindo exemplo · microfone pausado"
              : tuner.isListening
                ? "Microfone ligado"
                : "Microfone desligado"}
          </span>
          <div className="input-meter" aria-label="Nível de entrada">
            <span style={{ width: `${Math.min(100, tuner.rms * 600)}%` }} />
          </div>
          <button
            className="icon-button"
            title="Configurar microfone"
            aria-label="Configurar microfone"
            onClick={() => setHelp("audio")}
          >
            <Settings2 size={16} />
          </button>
          <span className="footer-motto">
            Feito para aprender, não para correr.
          </span>
        </footer>
        {tuner.error && (
          <div role="alert" className="error-banner">
            {tuner.error}
            <button onClick={() => void tuner.start(device)}>
              Tentar novamente
            </button>
          </div>
        )}
      </main>
      {help && (
        <div className="modal-backdrop" onClick={() => setHelp(null)}>
          <HelpDialog
            help={help}
            lesson={lesson}
            device={device}
            devices={tuner.devices}
            setDevice={(id) => {
              pause();
              tuner.stop();
              setDevice(id);
            }}
            close={() => setHelp(null)}
          />
        </div>
      )}
    </div>
  );
}

function HelpDialog({
  help,
  lesson,
  device,
  devices,
  setDevice,
  close,
}: {
  help: "tab" | "lesson" | "audio";
  lesson: BluesLesson;
  device: string;
  devices: MediaDeviceInfo[];
  setDevice: (value: string) => void;
  close: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    return () => previous?.focus();
  }, []);
  return (
    <div
      className="help-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-title"
      tabIndex={-1}
      ref={ref}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === "Escape") close();
        if (e.key === "Tab") {
          const nodes = ref.current?.querySelectorAll<HTMLElement>(
            "button, select, a[href]",
          );
          if (!nodes?.length) return;
          if (
            e.shiftKey &&
            (document.activeElement === nodes[0] ||
              document.activeElement === ref.current)
          ) {
            e.preventDefault();
            nodes[nodes.length - 1].focus();
          } else if (
            !e.shiftKey &&
            document.activeElement === nodes[nodes.length - 1]
          ) {
            e.preventDefault();
            nodes[0].focus();
          }
        }
      }}
    >
      <button
        className="icon-button modal-close"
        aria-label="Fechar ajuda"
        onClick={close}
      >
        <X />
      </button>
      <CircleHelp size={32} />
      <h2 id="help-title">
        {help === "tab"
          ? "Sua primeira tablatura"
          : help === "lesson"
            ? lesson.title
            : "Vamos ouvir seu violão"}
      </h2>
      {help === "tab" ? (
        <>
          <p>
            As seis linhas são as cordas. A linha de cima é a corda 1, a mais
            fina. A de baixo é a corda 6, a mais grossa.
          </p>
          <p>
            O número na linha é a casa: <b>0 significa corda solta</b>. Toque a
            nota dentro da faixa marcada. Ao acertar, a próxima chega até você.
          </p>
          <p>
            Dedos: 1 indicador, 2 médio, 3 anelar, 4 mínimo. Pressione perto do
            traste, sem encostar nele.
          </p>
          <p>
            O microfone compara notas individuais. Notas iguais em cordas
            diferentes não podem ser distinguidas com certeza. No erro, marcamos
            as posições possíveis.
          </p>
        </>
      ) : help === "lesson" ? (
        <>
          <p>{lesson.tip}</p>
          {lesson.artist && (
            <p>
              {lesson.tuningNote ??
                "Afinação padrão: E A D G B E. Dedilhe uma corda por vez; o exercício avalia notas individuais."}
            </p>
          )}
          <p>
            Arranjo didático próprio, com notas separadas para praticar. Não é
            uma transcrição de gravação comercial.
          </p>
          <a href={lesson.source} target="_blank" rel="noreferrer">
            Abrir referência didática
          </a>
        </>
      ) : (
        <>
          <p>
            Prefira um ambiente silencioso. Toque uma corda de cada vez perto do
            microfone. Use fones ao ouvir um exemplo.
          </p>
          <label>
            Entrada de áudio
            <select value={device} onChange={(e) => setDevice(e.target.value)}>
              <option value="">Microfone padrão</option>
              {devices.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>
                  {d.label || `Microfone ${i + 1}`}
                </option>
              ))}
            </select>
          </label>
          <p>
            As entradas aparecem após conceder permissão. Trocar de entrada
            pausa a captura; ative o microfone novamente.
          </p>
          <p>
            A referência padrão é Lá = 440 Hz. Não use uma casa pressionada para
            ajustar a tarraxa. Se a leitura estiver muito longe do alvo,
            confirme a corda primeiro.
          </p>
        </>
      )}
      <button className="primary" onClick={close}>
        Entendi <Check size={17} />
      </button>
    </div>
  );
}
