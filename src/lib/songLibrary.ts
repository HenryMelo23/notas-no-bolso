import { chordToneNames, transposeChord, transposeNote } from './chords';

export type LessonStep = {
  id: string;
  section: string;
  chord: string;
  target: string;
  duration: number;
  positions?: FretPosition[];
};

export type FretPosition = {
  string: string;
  fret: number;
  finger?: number;
};

export type LessonSong = {
  id: string;
  title: string;
  artist: string;
  originalKey: string;
  level: 'iniciante' | 'intermediario' | 'avancado';
  tuningId: string;
  bpm: number;
  steps: LessonStep[];
};

type SongPart = {
  section: string;
  chords: string[];
};

type NotePart = {
  section: string;
  notes: string[];
};

const OPEN_STRING_IDS = ['e2', 'a2', 'd3', 'g3', 'b3', 'e4'];

const rollingInTheDeepParts: SongPart[] = [
  { section: 'Intro', chords: ['Cm', 'G#', 'A#', 'G#'] },
  { section: 'Verso', chords: ['Cm', 'G#', 'A#', 'G#', 'Cm', 'G#', 'A#', 'G#'] },
  { section: 'Pre', chords: ['G#', 'A#', 'Cm', 'A#', 'G#', 'A#', 'G'] },
  { section: 'Refrao', chords: ['Cm', 'A#', 'G#', 'A#', 'Cm', 'A#', 'G#', 'A#'] },
  { section: 'Ponte', chords: ['G#', 'A#', 'Cm', 'A#', 'G#', 'A#', 'G#'] }
];

const emTabTrainingParts: NotePart[] = [
  { section: 'Intro 1', notes: ['E', 'B', 'G', 'E', 'B', 'G', 'E', 'B'] },
  { section: 'Intro 2', notes: ['G', 'E', 'B', 'G', 'E', 'B', 'G', 'E'] },
  { section: 'Primeira parte', notes: ['G', 'E', 'A', 'F#', 'G', 'E', 'G', 'E'] },
  { section: 'Ligados', notes: ['G', 'A', 'G', 'E', 'A', 'F#', 'G', 'E'] },
  { section: 'Segunda parte', notes: ['B', 'D', 'E', 'C#', 'A', 'E', 'C', 'B'] },
  { section: 'Descida', notes: ['A', 'G', 'F#', 'E', 'D', 'C', 'B', 'E'] },
  { section: 'Terceira parte', notes: ['C', 'E', 'G', 'B', 'G', 'B', 'D', 'G'] },
  { section: 'Final', notes: ['F', 'E', 'D', 'C', 'B', 'E', 'G', 'E'] }
];

const nadaIgualParts: SongPart[] = [
  { section: 'Intro', chords: ['G7M', 'G7M', 'Em7(9)', 'Em9', 'C7M', 'G/B', 'Am7(9)'] },
  { section: 'Primeira parte', chords: ['G7M', 'G7M', 'Em7(9)', 'Em9', 'C7M', 'G/B', 'Am7(9)', 'C7M/D'] },
  { section: 'Pre', chords: ['C7M(11+)', 'D9(11)', 'Em7(9)', 'Am7(9)', 'Am7(9)/G', 'F7M(11+)', 'D/F#'] },
  { section: 'Refrao', chords: ['G9', 'G5', 'G7M', 'Em7(9)', 'Em9', 'C7M', 'G/B', 'Am7(9)', 'C7M/D'] }
];

export const LESSON_LIBRARY: LessonSong[] = [
  {
    id: 'rolling-in-the-deep-training',
    title: 'Rolling in the Deep',
    artist: 'Adele',
    originalKey: 'C',
    level: 'intermediario',
    tuningId: 'standard',
    bpm: 105,
    steps: createChordLessonSteps(rollingInTheDeepParts)
  },
  {
    id: 'em-tab-training',
    title: 'Treino Em',
    artist: 'Tab colada',
    originalKey: 'E',
    level: 'intermediario',
    tuningId: 'standard',
    bpm: 82,
    steps: createNoteLessonSteps(emTabTrainingParts)
  },
  {
    id: 'nada-igual-training',
    title: 'Nada e Igual',
    artist: 'Cifra colada',
    originalKey: 'G',
    level: 'intermediario',
    tuningId: 'standard',
    bpm: 76,
    steps: createChordLessonSteps(nadaIgualParts)
  }
];

function createChordLessonSteps(parts: SongPart[]) {
  return parts.flatMap((part) =>
    part.chords.map((chord, index) => ({
      id: `${part.section}-${index}-${chord}`,
      section: part.section,
      chord,
      target: chordToneNames(chord)[0] ?? chord,
      duration: 1,
      positions: chordPositions(chord)
    }))
  );
}

function createNoteLessonSteps(parts: NotePart[]) {
  return parts.flatMap((part) =>
    part.notes.map((note, index) => ({
      id: `${part.section}-${index}-${note}`,
      section: part.section,
      chord: note,
      target: note,
      duration: 1,
      positions: [{ string: OPEN_STRING_IDS[index % OPEN_STRING_IDS.length], fret: 0, finger: 0 }]
    }))
  );
}

function chordPositions(chord: string): FretPosition[] {
  const root = chordToneNames(chord)[0] ?? 'C';
  const shapes: Record<string, FretPosition[]> = {
    C: [{ string: 'a2', fret: 3, finger: 3 }, { string: 'd3', fret: 2, finger: 2 }, { string: 'b3', fret: 1, finger: 1 }],
    D: [{ string: 'g3', fret: 2, finger: 1 }, { string: 'e4', fret: 2, finger: 2 }, { string: 'b3', fret: 3, finger: 3 }],
    E: [{ string: 'a2', fret: 2, finger: 2 }, { string: 'd3', fret: 2, finger: 3 }, { string: 'g3', fret: 1, finger: 1 }],
    F: [{ string: 'b3', fret: 1, finger: 1 }, { string: 'g3', fret: 2, finger: 2 }, { string: 'd3', fret: 3, finger: 3 }],
    G: [{ string: 'e2', fret: 3, finger: 2 }, { string: 'a2', fret: 2, finger: 1 }, { string: 'e4', fret: 3, finger: 3 }],
    A: [{ string: 'd3', fret: 2, finger: 1 }, { string: 'g3', fret: 2, finger: 2 }, { string: 'b3', fret: 2, finger: 3 }],
    B: [{ string: 'a2', fret: 2, finger: 1 }, { string: 'd3', fret: 4, finger: 3 }, { string: 'g3', fret: 4, finger: 4 }]
  };

  return shapes[root.replace('#', '')] ?? [{ string: 'e4', fret: 0, finger: 0 }];
}

export function transposeLesson(song: LessonSong, semitones: number): LessonSong {
  return {
    ...song,
    steps: song.steps.map((step) => ({
      ...step,
      chord: transposeChord(step.chord, semitones),
      target: transposeNote(step.target, semitones)
    }))
  };
}

export function lessonProgress(currentStep: number, totalSteps: number) {
  if (totalSteps <= 0) {
    return 0;
  }

  if (totalSteps === 1) {
    return 100;
  }

  return Math.min(100, Math.max(0, (currentStep / (totalSteps - 1)) * 100));
}
