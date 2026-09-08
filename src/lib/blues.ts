export const STRINGS = [64, 59, 55, 50, 45, 40];
export const STRING_NAMES = ["Mi agudo", "Si", "Sol", "Ré", "Lá", "Mi grave"];
export const FINGERS = [
  "Corda solta",
  "Indicador",
  "Médio",
  "Anelar",
  "Mínimo",
];
export type TabNote = {
  string: number;
  fret: number;
  finger: number;
  chord: string;
  bar: number;
};
export type BluesLesson = {
  id: string;
  title: string;
  subtitle: string;
  key: string;
  tip: string;
  source: string;
  notes: TabNote[];
  artist?: string;
  arrangement?: string;
  tuningNote?: string;
  youtube?: string;
  recording?: string;
  sections?: { title: string; start: number; end: number }[];
};
const base =
  "https://www.guitarlessons.com/guitar-lessons/blues-guitar-quick-start-series/";
const phrase = (chord: string, bar: number, positions: number[][]): TabNote[] =>
  positions.map(([string, fret, finger]) => ({
    string,
    fret,
    finger: finger ?? Math.min(fret, 4),
    chord,
    bar,
  }));
const progression = [
  "E7",
  "E7",
  "E7",
  "E7",
  "A7",
  "A7",
  "E7",
  "E7",
  "B7",
  "A7",
  "E7",
  "B7",
];
export const BLUES: BluesLesson[] = [
  {
    id: "first-blues",
    title: "Meu primeiro blues",
    subtitle: "O caminho dos 12 compassos",
    key: "Mi",
    tip: "Uma nota por vez. Mi, Lá e Si formam o baixo da sequência de blues. O acorde acima da tablatura mostra a harmonia, não uma batida de todas as cordas.",
    source: base + "the-12-bar-blues-progression/",
    notes: progression.flatMap((chord, i) =>
      phrase(
        chord,
        i + 1,
        chord === "E7"
          ? [
              [6, 0],
              [5, 2, 1],
              [6, 0],
              [4, 0],
            ]
          : chord === "A7"
            ? [
                [5, 0],
                [4, 2, 1],
                [5, 0],
                [3, 0],
              ]
            : [
                [5, 2, 1],
                [4, 4, 3],
                [5, 2, 1],
                [5, 0],
              ],
      ),
    ),
  },
  {
    id: "shuffle",
    title: "Passos de shuffle",
    subtitle: "Um passeio entre a quinta e a sexta",
    key: "Mi",
    tip: "Na demonstração, ouça o balanço longo-curto. Aqui as notas são dedilhadas separadamente, sem exigir duas cordas ao mesmo tempo.",
    source: base + "the-basic-12-bar-blues-riff/",
    notes: ["E7", "E7", "A7", "E7"].flatMap((chord, i) =>
      phrase(
        chord,
        i + 1,
        chord === "E7"
          ? [
              [6, 0],
              [5, 2, 1],
              [6, 0],
              [5, 4, 3],
              [6, 0],
              [5, 2, 1],
              [6, 0],
              [5, 4, 3],
            ]
          : [
              [5, 0],
              [4, 2, 1],
              [5, 0],
              [4, 4, 3],
              [5, 0],
              [4, 2, 1],
              [5, 0],
              [4, 4, 3],
            ],
      ),
    ),
  },
  {
    id: "pentatonic",
    title: "Uma conversa em Mi",
    subtitle: "Pergunta e resposta na pentatônica",
    key: "Mi",
    tip: "A pentatônica menor de Mi usa Mi, Sol, Lá, Si e Ré. Solte uma frase, respire e toque a resposta. Sem bends nesta primeira conversa.",
    source: "https://www.justinguitar.com/modules/essential-blues-lead-guitar",
    notes: [
      [
        [1, 0],
        [1, 3, 3],
        [2, 0],
        [2, 3, 3],
      ],
      [
        [3, 0],
        [3, 2, 2],
        [2, 0],
        [1, 0],
      ],
      [
        [2, 3, 3],
        [2, 0],
        [3, 2, 2],
        [3, 0],
      ],
      [
        [4, 2, 2],
        [4, 0],
        [5, 2, 2],
        [6, 0],
      ],
    ].flatMap((p, i) => phrase("Em", i + 1, p)),
  },
  {
    id: "sevenths",
    title: "A cor da sétima",
    subtitle: "Conheça E7, A7 e B7 por dentro",
    key: "Mi",
    tip: "Um acorde é um conjunto de notas. Vamos ouvir cada uma separadamente. E7 tem Mi, Sol sustenido, Si e Ré; a sétima dá a cor do blues.",
    source: base + "dominant-seventh-blues-chords/",
    notes: [
      ...phrase("E7", 1, [
        [6, 0],
        [3, 1, 1],
        [2, 0],
        [4, 0],
      ]),
      ...phrase("A7", 2, [
        [5, 0],
        [2, 2, 2],
        [1, 0],
        [3, 0],
      ]),
      ...phrase("B7", 3, [
        [5, 2, 2],
        [4, 1, 1],
        [1, 2, 4],
        [3, 2, 3],
      ]),
      ...phrase("E7", 4, [
        [4, 0],
        [2, 0],
        [3, 1, 1],
        [6, 0],
      ]),
    ],
  },
  {
    id: "turnaround",
    title: "De volta ao começo",
    subtitle: "Seu primeiro turnaround",
    key: "Mi",
    tip: "O turnaround fecha uma ideia e prepara outra. Aqui a descida por casas vizinhas termina em Si, que pede a volta para Mi.",
    source: base + "turnaround-blues-guitar-licks/",
    notes: [
      ...phrase("E7", 1, [
        [1, 0],
        [2, 3, 3],
        [2, 2, 2],
        [2, 1, 1],
      ]),
      ...phrase("A7", 2, [
        [2, 0],
        [3, 2, 2],
        [3, 1, 1],
        [3, 0],
      ]),
      ...phrase("E7", 3, [
        [4, 2, 2],
        [4, 0],
        [5, 2, 2],
        [5, 1, 1],
      ]),
      ...phrase("B7", 4, [
        [5, 2, 2],
        [4, 1, 1],
        [3, 2, 3],
        [6, 0],
      ]),
    ],
  },
];
export const noteMidi = (note: TabNote) => STRINGS[note.string - 1] + note.fret;
export const midiFrequency = (midi: number, reference = 440) =>
  reference * 2 ** ((midi - 69) / 12);
export function pitchLabel(midi: number) {
  return (
    ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][
      ((midi % 12) + 12) % 12
    ] +
    (Math.floor(midi / 12) - 1)
  );
}
export function possiblePositions(midi: number) {
  return STRINGS.flatMap((open, i) =>
    midi >= open && midi - open <= 12
      ? [{ string: i + 1, fret: midi - open }]
      : [],
  );
}
