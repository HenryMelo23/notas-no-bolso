export type ChordToken = {
  raw: string;
  root: string;
  quality: string;
  bass?: string;
};

export type SongStep = {
  id: string;
  chord: string;
  originalChord: string;
  root: string;
  beat: number;
};

const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_TO_SHARP: Record<string, string> = {
  Db: 'C#',
  Eb: 'D#',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
  Cb: 'B',
  Fb: 'E',
  'E#': 'F',
  'B#': 'C'
};

const CHORD_PATTERN = /[A-G](?:#|b)?(?:m|maj|min|dim|aug|sus|add|[0-9]|°|\+|-)?[A-Za-z0-9#b()°+\-/]*/g;
const VALID_QUALITY = /^(?:[A-G](?:#|b)?)(?:m|maj|min|dim|aug|sus|add|[0-9]|°|\+|-|\/|$)/;

export function normalizeNoteName(note: string) {
  return FLAT_TO_SHARP[note] ?? note;
}

export function noteIndex(note: string) {
  return SHARP_NOTES.indexOf(normalizeNoteName(note));
}

export function transposeNote(note: string, semitones: number) {
  const index = noteIndex(note);

  if (index < 0) {
    return note;
  }

  return SHARP_NOTES[((index + semitones) % 12 + 12) % 12];
}

export function transposeChord(chord: string, semitones: number) {
  const token = parseChord(chord);

  if (!token) {
    return chord;
  }

  const root = transposeNote(token.root, semitones);
  const bass = token.bass ? `/${transposeNote(token.bass, semitones)}` : '';

  return `${root}${token.quality}${bass}`;
}

export function parseChord(chord: string): ChordToken | null {
  const match = chord.match(/^([A-G](?:#|b)?)([^/\s]*)(?:\/([A-G](?:#|b)?))?$/);

  if (!match || !VALID_QUALITY.test(chord)) {
    return null;
  }

  const [, root, quality, bass] = match;

  return {
    raw: chord,
    root: normalizeNoteName(root),
    quality: quality ?? '',
    bass: bass ? normalizeNoteName(bass) : undefined
  };
}

export function semitoneDistance(from: string, to: string) {
  const fromIndex = noteIndex(from);
  const toIndex = noteIndex(to);

  if (fromIndex < 0 || toIndex < 0) {
    return 0;
  }

  return toIndex - fromIndex;
}

export function extractChordSequence(text: string) {
  const normalized = text
    .replace(/\r/g, '\n')
    .replace(/[|()[\]{}]/g, ' ')
    .replace(/[^\S\n]+/g, ' ');
  const chords: string[] = [];
  const seenWindows = new Set<string>();
  const lines = normalized.split('\n');

  for (const line of lines) {
    const candidates = line.split(/\s+/)
      .map((candidate) => candidate.trim().replace(/^[^\w#b]+|[^\w#b)]+$/g, ''))
      .filter((candidate) => parseChord(candidate));

    if (candidates.length === 0) {
      continue;
    }

    const chordDensity = candidates.join('').length / Math.max(line.replace(/\s/g, '').length, 1);
    const looksLikeChordLine = candidates.length >= 2 || chordDensity > 0.45;

    if (!looksLikeChordLine) {
      continue;
    }

    const signature = candidates.join(' ');

    if (!seenWindows.has(signature)) {
      seenWindows.add(signature);
      chords.push(...candidates);
    }
  }

  if (chords.length === 0) {
    const fallback = Array.from(normalized.matchAll(CHORD_PATTERN))
      .map((match) => match[0].trim())
      .filter((candidate) => parseChord(candidate));
    chords.push(...fallback);
  }

  return chords.slice(0, 160);
}

export function createSongSteps(chords: string[], semitones: number): SongStep[] {
  return chords.map((chord, index) => {
    const transposed = transposeChord(chord, semitones);
    const parsed = parseChord(transposed);

    return {
      id: `${index}-${chord}`,
      chord: transposed,
      originalChord: chord,
      root: parsed?.root ?? 'C',
      beat: index + 1
    };
  });
}

export function inferOriginalKey(chords: string[]) {
  const first = chords.map(parseChord).find(Boolean);
  return first?.root ?? 'C';
}

export function chordToneNames(chord: string) {
  const parsed = parseChord(chord);

  if (!parsed) {
    return [];
  }

  const minor = /(?:^m(?!aj)|min|-)/.test(parsed.quality);
  const diminished = /dim|°/.test(parsed.quality);
  const augmented = /aug|\+/.test(parsed.quality);
  const rootIndex = noteIndex(parsed.root);

  if (rootIndex < 0) {
    return [parsed.root];
  }

  const third = minor || diminished ? 3 : 4;
  const fifth = diminished ? 6 : augmented ? 8 : 7;

  return [
    SHARP_NOTES[rootIndex],
    SHARP_NOTES[(rootIndex + third) % 12],
    SHARP_NOTES[(rootIndex + fifth) % 12]
  ];
}

export const KEY_OPTIONS = SHARP_NOTES;
