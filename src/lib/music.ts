export type StringTarget = {
  id: string;
  label: string;
  note: string;
  octave: number;
  frequency: number;
};

export type Tuning = {
  id: string;
  name: string;
  centsOffset: number;
  strings: StringTarget[];
};

export type TunedStringTarget = StringTarget & {
  targetFrequency: number;
  cents: number;
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const STANDARD_STRINGS: StringTarget[] = [
  { id: 'e2', label: '6', note: 'E', octave: 2, frequency: 82.4069 },
  { id: 'a2', label: '5', note: 'A', octave: 2, frequency: 110 },
  { id: 'd3', label: '4', note: 'D', octave: 3, frequency: 146.8324 },
  { id: 'g3', label: '3', note: 'G', octave: 3, frequency: 195.9977 },
  { id: 'b3', label: '2', note: 'B', octave: 3, frequency: 246.9417 },
  { id: 'e4', label: '1', note: 'E', octave: 4, frequency: 329.6276 }
];

export const TUNINGS: Tuning[] = [
  { id: 'standard', name: 'Padrão E', centsOffset: 0, strings: STANDARD_STRINGS },
  { id: 'quarter-down', name: '1/4 abaixo', centsOffset: -50, strings: STANDARD_STRINGS },
  { id: 'half-down', name: 'Meio tom abaixo', centsOffset: -100, strings: STANDARD_STRINGS },
  { id: 'whole-down', name: 'Um tom abaixo', centsOffset: -200, strings: STANDARD_STRINGS },
  {
    id: 'drop-d',
    name: 'Drop D',
    centsOffset: 0,
    strings: [
      { id: 'd2', label: '6', note: 'D', octave: 2, frequency: 73.4162 },
      ...STANDARD_STRINGS.slice(1)
    ]
  },
  {
    id: 'dadgad',
    name: 'DADGAD',
    centsOffset: 0,
    strings: [
      { id: 'd2', label: '6', note: 'D', octave: 2, frequency: 73.4162 },
      { id: 'a2', label: '5', note: 'A', octave: 2, frequency: 110 },
      { id: 'd3', label: '4', note: 'D', octave: 3, frequency: 146.8324 },
      { id: 'g3', label: '3', note: 'G', octave: 3, frequency: 195.9977 },
      { id: 'a3', label: '2', note: 'A', octave: 3, frequency: 220 },
      { id: 'd4', label: '1', note: 'D', octave: 4, frequency: 293.6648 }
    ]
  },
  {
    id: 'open-g',
    name: 'Open G',
    centsOffset: 0,
    strings: [
      { id: 'd2', label: '6', note: 'D', octave: 2, frequency: 73.4162 },
      { id: 'g2', label: '5', note: 'G', octave: 2, frequency: 97.9989 },
      { id: 'd3', label: '4', note: 'D', octave: 3, frequency: 146.8324 },
      { id: 'g3', label: '3', note: 'G', octave: 3, frequency: 195.9977 },
      { id: 'b3', label: '2', note: 'B', octave: 3, frequency: 246.9417 },
      { id: 'd4', label: '1', note: 'D', octave: 4, frequency: 293.6648 }
    ]
  }
];

export function frequencyWithOffsets(frequency: number, referenceA: number, globalCents: number) {
  return frequency * (referenceA / 440) * 2 ** (globalCents / 1200);
}

export function centsBetween(inputFrequency: number, targetFrequency: number) {
  return 1200 * Math.log2(inputFrequency / targetFrequency);
}

export function noteFromFrequency(frequency: number, referenceA = 440) {
  const midi = Math.round(69 + 12 * Math.log2(frequency / referenceA));
  const note = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  const target = referenceA * 2 ** ((midi - 69) / 12);

  return {
    note,
    octave,
    cents: centsBetween(frequency, target)
  };
}

export function tunedStringTarget(
  frequency: number,
  stringTarget: StringTarget,
  tuning: Tuning,
  referenceA: number,
  extraCents: number
): TunedStringTarget {
  const targetFrequency = frequencyWithOffsets(
    stringTarget.frequency,
    referenceA,
    tuning.centsOffset + extraCents
  );

  return {
    ...stringTarget,
    targetFrequency,
    cents: centsBetween(frequency, targetFrequency)
  };
}

export function nearestString(
  frequency: number,
  tuning: Tuning,
  referenceA: number,
  extraCents: number
): TunedStringTarget {
  const firstTargetFrequency = frequencyWithOffsets(
    tuning.strings[0].frequency,
    referenceA,
    tuning.centsOffset + extraCents
  );

  return tuning.strings.reduce<TunedStringTarget>((closest, stringTarget) => {
    const candidate = tunedStringTarget(frequency, stringTarget, tuning, referenceA, extraCents);

    return Math.abs(candidate.cents) < Math.abs(closest.cents) ? candidate : closest;
  }, {
    ...tuning.strings[0],
    targetFrequency: firstTargetFrequency,
    cents: centsBetween(frequency, firstTargetFrequency)
  } satisfies TunedStringTarget);
}
