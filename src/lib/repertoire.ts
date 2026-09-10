import { BLUES, type BluesLesson, type TabNote } from "./blues";

// Voicings are picked one string at a time; these are study arrangements,
// not a claim to transcribe the recording's rhythm, bends or full guitar part.
type Position = [number, number, number?];
const voicings: Record<string, Position[]> = {
  A: [
    [5, 0],
    [4, 2, 1],
    [3, 2, 2],
    [2, 2, 3],
  ],
  A5: [
    [5, 0],
    [4, 2, 1],
    [5, 0],
    [4, 4, 3],
  ],
  A7: [
    [5, 0],
    [4, 2, 2],
    [3, 0],
    [2, 2, 3],
  ],
  A6: [
    [5, 0],
    [4, 2, 1],
    [2, 2, 2],
    [1, 2, 4],
  ],
  "A5+": [
    [5, 0],
    [4, 3, 3],
    [3, 2, 2],
    [2, 2, 1],
  ],
  "Am7(5-)": [
    [5, 0],
    [4, 1, 1],
    [3, 0],
    [2, 1, 2],
  ],
  Am: [
    [5, 0],
    [4, 2, 2],
    [3, 2, 3],
    [2, 1, 1],
  ],
  B7: [
    [5, 2, 2],
    [4, 1, 1],
    [3, 2, 3],
    [1, 2, 4],
  ],
  Bm: [
    [5, 2, 1],
    [4, 4, 3],
    [3, 4, 4],
    [2, 3, 2],
  ],
  Bm7: [
    [5, 2, 1],
    [4, 4, 3],
    [3, 2, 1],
    [2, 3, 2],
  ],
  C: [
    [5, 3, 3],
    [4, 2, 2],
    [3, 0],
    [2, 1, 1],
  ],
  C7: [
    [5, 3, 3],
    [4, 2, 2],
    [3, 3, 4],
    [2, 1, 1],
  ],
  Db7: [
    [5, 4, 3],
    [4, 3, 2],
    [3, 4, 4],
    [2, 2, 1],
  ],
  D: [
    [4, 0],
    [3, 2, 1],
    [2, 3, 3],
    [1, 2, 2],
  ],
  D5: [
    [4, 0],
    [3, 2, 1],
    [4, 0],
    [3, 4, 3],
  ],
  D7: [
    [4, 0],
    [3, 2, 2],
    [2, 1, 1],
    [1, 2, 3],
  ],
  "D7/F#": [
    [6, 2, 2],
    [4, 0],
    [3, 2, 3],
    [2, 1, 1],
  ],
  Dm: [
    [4, 0],
    [3, 2, 2],
    [2, 3, 3],
    [1, 1, 1],
  ],
  Dm6: [
    [4, 0],
    [3, 2, 2],
    [2, 0],
    [1, 1, 1],
  ],
  E: [
    [6, 0],
    [5, 2, 2],
    [4, 2, 3],
    [3, 1, 1],
  ],
  E5: [
    [6, 0],
    [5, 2, 1],
    [6, 0],
    [5, 4, 3],
  ],
  E7: [
    [6, 0],
    [5, 2, 2],
    [4, 0],
    [3, 1, 1],
  ],
  Em7: [
    [6, 0],
    [5, 2, 2],
    [4, 0],
    [3, 0],
  ],
  F: [
    [4, 3, 3],
    [3, 2, 2],
    [2, 1, 1],
    [1, 1, 1],
  ],
  F7: [
    [4, 3, 3],
    [3, 2, 2],
    [2, 1, 1],
    [1, 1, 1],
    [4, 1, 1],
    [3, 2, 2],
  ],
  "F#m": [
    [6, 2, 1],
    [5, 4, 3],
    [4, 4, 4],
    [3, 2, 1],
  ],
  "F#7": [
    [6, 2, 1],
    [4, 2, 1],
    [3, 3, 2],
    [2, 2, 1],
  ],
  "F#7(9)": [
    [6, 2, 1],
    [4, 2, 1],
    [3, 3, 2],
    [1, 4, 4],
  ],
  G7: [
    [6, 3, 3],
    [5, 2, 2],
    [4, 0],
    [1, 1, 1],
  ],
  "G7(9)": [
    [6, 3, 3],
    [4, 3, 2],
    [3, 2, 1],
    [2, 0],
  ],
  Gm: [
    [6, 3, 1],
    [5, 5, 3],
    [4, 5, 4],
    [3, 3, 1],
  ],
  "G#m": [
    [6, 4, 1],
    [5, 6, 3],
    [4, 6, 4],
    [3, 4, 1],
  ],
  Bb: [
    [5, 1, 1],
    [4, 3, 3],
    [3, 3, 3],
    [2, 3, 3],
  ],
  Eb: [
    [5, 6, 1],
    [4, 8, 3],
    [3, 8, 3],
    [2, 8, 3],
  ],
};
type Part = { title: string; chords: string[]; melody?: Position[] };
const part = (title: string, chords: string): Part => ({
  title,
  chords: chords.split(" "),
});
function song(
  meta: Omit<BluesLesson, "notes" | "sections" | "subtitle">,
  parts: Part[],
): BluesLesson {
  const notes: TabNote[] = [];
  let bar = 0;
  const sections = parts.map((p) => {
    const start = notes.length;
    if (p.melody) {
      const firstBar = ++bar;
      p.melody.forEach(([string, fret, finger], i) =>
        notes.push({
          string,
          fret,
          finger: finger ?? (fret === 0 ? 0 : ((fret - 1) % 4) + 1),
          chord: p.chords[0],
          bar: firstBar + Math.floor(i / 4),
        }),
      );
      bar = notes[notes.length - 1].bar;
    } else {
      for (const chord of p.chords) {
        const positions = voicings[chord];
        if (!positions) throw new Error(`Missing voicing: ${chord}`);
        bar++;
        for (const [string, fret, finger] of positions)
          notes.push({ string, fret, finger: finger ?? 0, chord, bar });
      }
    }
    return { title: p.title, start, end: notes.length - 1 };
  });
  return {
    ...meta,
    subtitle: `${meta.artist} · ${meta.arrangement}`,
    notes,
    sections,
  };
}
type MelodyEvent = number | [midi: number, beats: number];
type MelodyPhrase = {
  title: string;
  chord: string;
  events: MelodyEvent[];
};
const firstPosition: Record<number, Position> = {
  52: [4, 2, 1],
  54: [4, 4, 3],
  55: [3, 0, 0],
  57: [3, 2, 2],
  59: [2, 0, 0],
  60: [2, 1, 1],
  61: [2, 2, 2],
  62: [2, 3, 3],
  63: [2, 4, 4],
  64: [1, 0, 0],
  65: [1, 1, 1],
  66: [1, 2, 2],
  67: [1, 3, 3],
};
const melody = (...events: MelodyEvent[]) => events;
function beginnerSong(
  meta: Omit<BluesLesson, "notes" | "sections" | "subtitle">,
  phrases: MelodyPhrase[],
): BluesLesson {
  const notes: TabNote[] = [];
  const beatsPerBar = meta.meter === "3/4" ? 3 : 4;
  let bar = 1;
  let beat = 0;
  const sections = phrases.map((phrase) => {
    const start = notes.length;
    for (const event of phrase.events) {
      const [midi, beats] = Array.isArray(event) ? event : [event, 1];
      const position = firstPosition[midi];
      if (!position) throw new Error(`Missing beginner position: ${midi}`);
      const [string, fret, finger] = position;
      notes.push({ string, fret, finger: finger ?? 0, chord: phrase.chord, bar, beats });
      beat += beats;
      while (beat >= beatsPerBar - 0.001) {
        beat -= beatsPerBar;
        bar++;
      }
    }
    if (beat > 0.001) {
      beat = 0;
      bar++;
    }
    return { title: phrase.title, start, end: notes.length - 1 };
  });
  return {
    ...meta,
    subtitle: `${meta.artist} · ${meta.arrangement}`,
    notes,
    sections,
  };
}
const G3 = 55;
const A3 = 57;
const B3 = 59;
const C4 = 60;
const D4 = 62;
const E4 = 64;
const F4 = 65;
const FS4 = 66;
const G4 = 67;
const publicDomain = "https://tonewright.app/songs/";
export const BEGINNER_SONGS: BluesLesson[] = [
  beginnerSong(
    {
      id: "mary-little-lamb",
      title: "Mary Had a Little Lamb",
      artist: "Canção tradicional",
      key: "Dó",
      arrangement: "Melodia completa em quatro notas",
      source: publicDomain + "mary-had-a-little-lamb/",
      youtube: "https://www.youtube.com/watch?v=WkAImciJiF4",
      recording: "Vídeo-aula para iniciantes · Kids Guitar Zone",
      bpm: 100,
      meter: "4/4",
      level: "Primeiros passos",
      kind: "Melodia",
      tip: "Comece aqui. São só quatro sons e nenhuma casa passa da terceira. Cante mentalmente a frase e deixe as notas longas respirarem no fim de cada linha.",
    },
    [
      { title: "Frase 1", chord: "C", events: melody(E4, D4, C4, D4, E4, E4, [E4, 2]) },
      { title: "Frase 2", chord: "G", events: melody(D4, D4, [D4, 2], E4, G4, [G4, 2]) },
      { title: "Frase 3", chord: "C", events: melody(E4, D4, C4, D4, E4, E4, E4, E4) },
      { title: "Final", chord: "C", events: melody(D4, D4, E4, D4, [C4, 4]) },
    ],
  ),
  beginnerSong(
    {
      id: "twinkle-little-star",
      title: "Brilha, Brilha, Estrelinha",
      artist: "Melodia tradicional francesa",
      key: "Sol",
      arrangement: "Melodia completa em primeira posição",
      source: publicDomain + "twinkle-twinkle-little-star/",
      youtube: "https://www.youtube.com/watch?v=L9Z6OONa84g",
      recording: "Vídeo-aula com tablatura · GuitarNick",
      bpm: 100,
      meter: "4/4",
      level: "Primeiros passos",
      kind: "Melodia",
      tip: "As seis frases têm o mesmo desenho de pergunta e resposta. Toque cada par com calma e segure a última nota de cada frase por dois tempos.",
    },
    [
      { title: "Brilha, estrelinha", chord: "G", events: melody(G3, G3, D4, D4, E4, E4, [D4, 2]) },
      { title: "Quero ver você brilhar", chord: "G", events: melody(C4, C4, B3, B3, A3, A3, [G3, 2]) },
      { title: "Lá no alto", chord: "D", events: melody(D4, D4, C4, C4, B3, B3, [A3, 2]) },
      { title: "Como um diamante", chord: "D", events: melody(D4, D4, C4, C4, B3, B3, [A3, 2]) },
      { title: "Brilha outra vez", chord: "G", events: melody(G3, G3, D4, D4, E4, E4, [D4, 2]) },
      { title: "Resposta final", chord: "G", events: melody(C4, C4, B3, B3, A3, A3, [G3, 2]) },
    ],
  ),
  beginnerSong(
    {
      id: "ode-to-joy",
      title: "Ode à Alegria",
      artist: "Ludwig van Beethoven",
      key: "Sol",
      arrangement: "Tema completo da Nona Sinfonia",
      source: "https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=528",
      youtube: "https://www.youtube.com/watch?v=-BsSmMhuj7c",
      recording: "Vídeo-aula fácil · GuitarNick",
      bpm: 112,
      meter: "4/4",
      level: "Fácil",
      kind: "Melodia",
      tip: "A primeira ideia volta no final. Repare no miolo, onde aparecem notas mais curtas; ouça a frase antes e depois repita sem se preocupar com velocidade.",
    },
    [
      { title: "Tema A", chord: "G", events: melody(B3, B3, C4, D4, D4, C4, B3, A3, G3, G3, A3, B3, [B3, 1.5], [A3, 0.5], [A3, 2]) },
      { title: "Tema B", chord: "G", events: melody(B3, B3, C4, D4, D4, C4, B3, A3, G3, G3, A3, B3, [A3, 1.5], [G3, 0.5], [G3, 2]) },
      { title: "Ponte", chord: "D", events: melody([A3, 0.5], [A3, 0.5], B3, G3, A3, [B3, 0.5], [C4, 0.5], B3, G3, A3, [B3, 0.5], [C4, 0.5], B3, A3, G3, A3, [D4, 3]) },
      { title: "Tema final", chord: "G", events: melody(B3, B3, C4, D4, D4, C4, B3, A3, G3, G3, A3, B3, [A3, 1.5], [G3, 0.5], [G3, 2]) },
    ],
  ),
  beginnerSong(
    {
      id: "happy-birthday",
      title: "Parabéns pra Você",
      artist: "Mildred J. Hill · melodia tradicional",
      key: "Dó",
      arrangement: "Melodia completa sem sair da terceira casa",
      source: publicDomain + "happy-birthday-to-you/",
      youtube: "https://www.youtube.com/watch?v=On_boyDfRek",
      recording: "Vídeo-aula para iniciantes · FUXiNO",
      bpm: 100,
      meter: "3/4",
      level: "Fácil",
      kind: "Melodia",
      tip: "O segredo está nas duas notas curtas que abrem cada frase. Ouça o exemplo, conte um-dois-três e toque como você cantaria.",
    },
    [
      { title: "Parabéns pra você", chord: "C", events: melody([G3, 0.5], [G3, 0.5], A3, G3, C4, [B3, 2]) },
      { title: "Nesta data querida", chord: "G7", events: melody([G3, 0.5], [G3, 0.5], A3, G3, D4, [C4, 2]) },
      { title: "Muitas felicidades", chord: "C", events: melody([G3, 0.5], [G3, 0.5], G4, E4, C4, B3, [A3, 2]) },
      { title: "Muitos anos de vida", chord: "F", events: melody([F4, 0.5], [F4, 0.5], E4, C4, D4, [C4, 2]) },
    ],
  ),
  beginnerSong(
    {
      id: "amazing-grace",
      title: "Amazing Grace",
      artist: "Hino tradicional · melodia New Britain",
      key: "Dó",
      arrangement: "Melodia cantável em quatro frases",
      source: publicDomain + "amazing-grace/",
      youtube: "https://www.youtube.com/watch?v=AgwZ53ySEJo",
      recording: "Vídeo-aula e play-along · Lauren Bateman",
      bpm: 92,
      meter: "3/4",
      level: "Fácil",
      kind: "Melodia",
      tip: "Esta música ensina a sustentar o som. Não repita as notas longas: deixe a corda cantar pelo número de tempos indicado e siga para a próxima articulação.",
    },
    [
      { title: "Amazing grace", chord: "C", events: melody([G3, 1], [C4, 2], E4, [C4, 0.5], [E4, 0.5], [D4, 2], [C4, 2], A3, [G3, 2]) },
      { title: "That saved a wretch", chord: "G", events: melody(G3, [C4, 2], E4, [C4, 0.5], [E4, 0.5], [D4, 2], [G4, 3]) },
      { title: "I once was lost", chord: "F", events: melody(E4, [G4, 2], E4, G4, E4, [C4, 2], G3, A3, C4, [C4, 2], A3, [G3, 2]) },
      { title: "But now I see", chord: "C", events: melody(G3, [C4, 2], E4, [C4, 0.5], [E4, 0.5], [D4, 2], [C4, 3]) },
    ],
  ),
];
const E3 = 52;
const FS3 = 54;
const bluesLessonSource =
  "https://www.guitarlessons.com/guitar-lessons/blues-guitar-quick-start-series/the-12-bar-blues-progression";
const bluesBackingTrack = "https://www.youtube.com/watch?v=3nT5NyA8HEw";
const bluesBar = (title: string, chord: string, events: MelodyEvent[]) => ({
  title,
  chord,
  events,
});
const eShuffle = melody(
  [E3, 0.5],
  [B3, 0.5],
  [E3, 0.5],
  [G3, 0.5],
  [A3, 0.5],
  [G3, 0.5],
  [E3, 0.5],
  [D4, 0.5],
);
const aShuffle = melody(
  [A3, 0.5],
  [E4, 0.5],
  [A3, 0.5],
  [C4, 0.5],
  [D4, 0.5],
  [C4, 0.5],
  [A3, 0.5],
  [G4, 0.5],
);
const bShuffle = melody(
  [B3, 0.5],
  [FS3, 0.5],
  [B3, 0.5],
  [D4, 0.5],
  [E4, 0.5],
  [D4, 0.5],
  [B3, 0.5],
  [A3, 0.5],
);
export const BLUES_SONGS: BluesLesson[] = [
  beginnerSong(
    {
      id: "blues-de-varanda",
      title: "Blues de varanda",
      artist: "Composição didática Notas no Bolso",
      key: "Mi",
      arrangement: "12 compassos com shuffle e turnaround",
      source: bluesLessonSource,
      youtube: bluesBackingTrack,
      recording: "Backing track em E7 · A7 · B7",
      bpm: 86,
      meter: "4/4",
      level: "Fácil",
      kind: "Blues",
      tip: "Este é um blues inteiro: quatro compassos em Mi, dois em Lá, dois de volta em Mi, e a tensão de Si-Lá-Mi-Si no final. O balanço vem do par grave-agudo, não da pressa.",
    },
    [
      bluesBar("1 · Mi", "E7", eShuffle),
      bluesBar("2 · Mi", "E7", eShuffle),
      bluesBar("3 · Mi", "E7", eShuffle),
      bluesBar("4 · Mi", "E7", eShuffle),
      bluesBar("5 · Lá", "A7", aShuffle),
      bluesBar("6 · Lá", "A7", aShuffle),
      bluesBar("7 · Mi", "E7", eShuffle),
      bluesBar("8 · Mi", "E7", eShuffle),
      bluesBar("9 · Si", "B7", bShuffle),
      bluesBar("10 · Lá", "A7", aShuffle),
      bluesBar("11 · Mi", "E7", eShuffle),
      bluesBar("12 · Volta", "B7", bShuffle),
    ],
  ),
  beginnerSong(
    {
      id: "blues-pergunta-resposta",
      title: "Blues: pergunta e resposta",
      artist: "Composição didática Notas no Bolso",
      key: "Mi",
      arrangement: "Frases curtas da pentatônica menor",
      source: "https://www.justinguitar.com/modules/blues-guitar-easy-improvisation",
      youtube: "https://www.youtube.com/watch?v=-csesR_3EKI",
      recording: "Aula de shuffle em Mi para iniciantes",
      bpm: 78,
      meter: "4/4",
      level: "Fácil",
      kind: "Blues",
      tip: "O blues conversa. Toque a pergunta, respire no último tempo e responda usando Mi, Sol, Lá, Si e Ré. A terça menor dá a cor; o acorde E7 mantém o chão.",
    },
    [
      bluesBar("Pergunta", "E7", melody([E3, 0.5], [G3, 0.5], [A3, 0.5], [B3, 0.5], [D4, 1.5], [B3, 0.5])),
      bluesBar("Resposta", "E7", melody([B3, 0.5], [A3, 0.5], [G3, 0.5], [E3, 1.5], [D4, 0.5], [E3, 0.5])),
      bluesBar("Pergunta em Lá", "A7", melody([A3, 0.5], [C4, 0.5], [D4, 0.5], [E4, 0.5], [G4, 1], [E4, 1])),
      bluesBar("Resposta em Lá", "A7", melody([E4, 0.5], [D4, 0.5], [C4, 0.5], [A3, 1.5], [G3, 0.5], [A3, 0.5])),
      bluesBar("Volta ao Mi", "E7", eShuffle),
      bluesBar("Volta ao Mi", "E7", eShuffle),
      bluesBar("Resposta curta", "E7", melody([G3, 0.5], [A3, 0.5], [B3, 0.5], [D4, 1], [B3, 1.5])),
      bluesBar("Resposta curta", "E7", melody([A3, 0.5], [G3, 0.5], [E3, 0.5], [D4, 1], [E3, 1.5])),
      bluesBar("Tensão", "B7", bShuffle),
      bluesBar("Desce", "A7", aShuffle),
      bluesBar("Resolve", "E7", eShuffle),
      bluesBar("Turnaround", "B7", melody([B3, 0.5], [A3, 0.5], [G3, 0.5], [FS3, 0.5], [E3, 2])),
    ],
  ),
  beginnerSong(
    {
      id: "blues-no-quintal",
      title: "Blues no quintal",
      artist: "Composição didática Notas no Bolso",
      key: "Lá",
      arrangement: "12 compassos em Lá com frase cantável",
      source: "https://guitarcompass.com/free-lessons/blues/12-bar-blues/",
      youtube: "https://www.youtube.com/watch?v=3nT5NyA8HEw",
      recording: "Backing track de 12 compassos",
      bpm: 82,
      meter: "4/4",
      level: "Fácil",
      kind: "Blues",
      tip: "Agora o mesmo mapa está em Lá. Ouça como a nota A3 continua sendo o repouso e como D7 e E7 criam movimento. Isso é a forma I-IV-V funcionando como uma música.",
    },
    [
      bluesBar("1 · Lá", "A7", aShuffle),
      bluesBar("2 · Lá", "A7", aShuffle),
      bluesBar("3 · Lá", "A7", aShuffle),
      bluesBar("4 · Lá", "A7", aShuffle),
      bluesBar("5 · Ré", "D7", melody([D4, 0.5], [A3, 0.5], [D4, 0.5], [C4, 0.5], [D4, 0.5], [A3, 0.5], [G3, 0.5], [A3, 0.5])),
      bluesBar("6 · Ré", "D7", melody([D4, 0.5], [A3, 0.5], [D4, 0.5], [C4, 0.5], [E4, 0.5], [D4, 0.5], [C4, 0.5], [A3, 0.5])),
      bluesBar("7 · Lá", "A7", aShuffle),
      bluesBar("8 · Lá", "A7", aShuffle),
      bluesBar("9 · Mi", "E7", eShuffle),
      bluesBar("10 · Ré", "D7", melody([D4, 0.5], [A3, 0.5], [D4, 0.5], [C4, 0.5], [E4, 0.5], [D4, 0.5], [C4, 0.5], [A3, 0.5])),
      bluesBar("11 · Lá", "A7", aShuffle),
      bluesBar("12 · Volta", "E7", eShuffle),
    ],
  ),
];
const c = "https://www.cifraclub.com.br/";
const y = (id: string) => `https://www.youtube.com/watch?v=${id}`;
const minorCycle = "Bm7 Bm7 Bm7 Bm7 Em7 Em7 Bm7 Bm7 G7(9) F#7(9) Bm7 F#7(9)";
const accuseCycle = "E5 A5 E5 E5 A5 A5 E5 E5 B7 A7 E5 B7";
const devilVerse = "A7 A7 Am7(5-) A7 D7 D7 A7 A7 E7 D7";
const devilEnd = "A A7 A6 A5+ A E7";
const lifeVerse = "A5 E5 F#m D5 A5 E5 F#m D5";
const lifeChorus = "F#m D5 E5 F#m D5 E5 F#m D7 E A5";
const boomCycle = "F Bb Bb F F Bb Bb F Bb Eb Eb Bb F Bb Bb F C F F C F Bb Bb F";
const lonesomeVerse = "Dm Gm Dm Dm Gm Gm Dm Dm A7 G#m Gm Dm";
const manVerse = "C7 F7 C7 C7 F7 F7 D7/F# C7 G7 F7 C7 F7 C7 G7";
export const SONGS: BluesLesson[] = [
  song(
    {
      id: "thrill-is-gone",
      title: "The Thrill Is Gone",
      artist: "B.B. King",
      key: "Si menor",
      arrangement: "Tema simplificado e acompanhamento",
      source: c + "bb-king/the-thrill-is-gone/",
      youtube: y("CzUgX-HB9tA"),
      recording: "B.B. King · apresentação ao vivo no canal oficial",
      tip: "O material enviado usa Bm7, apesar do cabeçalho em Ré. O tema abaixo simplifica os bends em notas pressionadas. O acompanhamento trabalha cada acorde em separado; não é o solo integral.",
      tuningNote: "Padrão E A D G B E · estudo em Si menor.",
    },
    [
      {
        title: "Tema · notas do início",
        chords: ["Bm7"],
        melody: [
          [2, 12, 4],
          [2, 12, 4],
          [2, 12, 4],
          [2, 10, 2],
          [3, 11, 4],
          [3, 7, 1],
          [3, 7, 1],
          [3, 9, 3],
          [4, 9, 3],
          [3, 7, 1],
          [4, 9, 3],
          [4, 9, 3],
        ],
      },
      part("Base · primeira volta", minorCycle),
      part("Base · segunda volta", minorCycle),
      part("Base · terceira volta", minorCycle),
      part("Final · resolução", "G7(9) F#7(9) Bm7 Bm7"),
    ],
  ),
  song(
    {
      id: "before-you-accuse-me",
      title: "Before You Accuse Me",
      artist: "Eric Clapton · composição de Bo Diddley",
      key: "Mi",
      arrangement: "Shuffle dedilhado",
      source: c + "eric-clapton/before-you-accuse-me/",
      youtube: y("Ft9_rhd03Rg"),
      recording: "Eric Clapton · Version 1, álbum Blues",
      tip: "A base alterna quinta e sexta. As duplas da cifra viraram notas separadas; deixe o polegar cuidar dos baixos. As seções de base substituem os solos por acompanhamento.",
    },
    [
      part("Preparação · E e A", "E5 E5 A5 A5 E5 E5 B7 B7"),
      part("Parte 1 · primeira volta", accuseCycle),
      part("Parte 1 · segunda volta", accuseCycle),
      part("Base para solo", accuseCycle),
      part("Parte 2", accuseCycle),
      part("Final", "A5 A7 E5 B7 E"),
    ],
  ),
  song(
    {
      id: "me-and-the-devil",
      title: "Me And The Devil Blues",
      artist: "Robert Johnson",
      key: "Lá",
      arrangement: "Harmonia dedilhada",
      source: c + "johnson-robert/me-and-the-devil-blues/",
      youtube: y("p9CDKtc1Cno"),
      recording: "Robert Johnson · King of the Delta Blues Singers",
      tip: "O encadeamento A, A7, A6 e A aumentado colore a volta. Toque cada nota do acorde devagar. O dedilhado é uma adaptação da cifra enviada; a gravação tem variações de tempo.",
    },
    [
      part("Introdução", "A7 Am7(5-) Dm6 A A7 A6 A5+ A E7"),
      part("Primeira parte", "A7 A7 Am7(5-) A7 D7/F# D7/F# A7 A7 E7 D7"),
      part("Volta 1", devilEnd),
      part("Segunda parte", devilVerse),
      part("Volta 2", devilEnd),
      part("Terceira parte", devilVerse),
      part("Volta 3", devilEnd),
      part("Quarta parte", devilVerse),
      part("Final", devilEnd + " A7"),
    ],
  ),
  song(
    {
      id: "life-by-the-drop",
      title: "Life By The Drop",
      artist: "Stevie Ray Vaughan",
      key: "Lá",
      arrangement: "Introdução e base acústica",
      source: c + "vaughan-stevie-ray/life-by-the-drop/",
      youtube: y("Fvr8upD1KAI"),
      recording: "Stevie Ray Vaughan & Double Trouble · áudio oficial",
      tip: "A introdução preserva a sequência de alturas enviada, com hammer-ons e pull-offs separados em dedilhadas. A base é simplificada em notas alternadas. Comece isolando só a introdução.",
    },
    [
      {
        title: "Introdução · frase acústica",
        chords: ["A"],
        melody: [
          [5, 0],
          [5, 3, 3],
          [4, 0],
          [4, 1, 1],
          [4, 2, 2],
          [3, 0],
          [4, 0],
          [4, 1, 1],
          [4, 0],
          [5, 3, 3],
          [4, 0],
          [5, 3, 3],
          [3, 0],
          [3, 2, 2],
          [3, 0],
          [4, 2, 2],
          [4, 1, 1],
          [4, 0],
          [4, 1, 1],
          [4, 0],
          [5, 3, 3],
          [4, 0],
          [5, 3, 3],
          [4, 0],
          [5, 3, 3],
          [5, 0],
          [3, 2, 2],
        ],
      },
      part("Primeiro verso", lifeVerse),
      part("Refrão 1", lifeChorus),
      part("Segundo verso", lifeVerse),
      part("Refrão 2", lifeChorus),
      part("Terceiro verso", lifeVerse),
      {
        title: "Ponte · resposta",
        chords: ["F#m"],
        melody: [
          [4, 0],
          [4, 2, 1],
          [4, 2, 1],
          [4, 4, 3],
          [4, 2, 1],
          [4, 2, 1],
          [4, 2, 1],
          [4, 4, 3],
          [4, 2, 1],
          [5, 4, 3],
          [4, 0],
          [4, 2, 1],
          [4, 2, 1],
          [4, 4, 3],
          [4, 2, 1],
          [4, 2, 1],
          [4, 2, 1],
          [4, 4, 3],
          [4, 2, 1],
          [5, 4, 3],
        ],
      },
      part("Final", "F#m D7 E A"),
    ],
  ),
  song(
    {
      id: "boom-boom",
      title: "Boom Boom",
      artist: "John Lee Hooker",
      key: "Fá",
      arrangement: "Frase de entrada e respostas",
      source: c + "john-lee-hooker/boom-boom/",
      youtube: y("jZv04xAejrc"),
      recording: "John Lee Hooker · vídeo oficial com letra",
      tip: "Estudo no tom de Fá da cifra enviada. A frase abre a conversa; os acordes respondem, dedilhados uma nota de cada vez. O slide inicial vira uma nota fixa. Não inclui todos os solos da gravação.",
    },
    [
      {
        title: "Entrada · chamada",
        chords: ["F"],
        melody: [
          [3, 5, 3],
          [2, 4, 2],
          [3, 5, 3],
          [3, 3, 3],
          [3, 1, 1],
          [4, 3, 3],
        ],
      },
      part(
        "Introdução · respostas",
        "F Bb Bb F F Bb Bb F Bb Eb Eb Bb F Bb Bb F C F F C",
      ),
      part("Parte cantada", boomCycle),
      part("Base instrumental", boomCycle),
      part("Última volta", boomCycle),
      part("Final", "F Bb Bb F"),
    ],
  ),
  song(
    {
      id: "rather-go-blind",
      title: "I'd Rather Go Blind",
      artist: "Etta James",
      key: "Lá",
      arrangement: "Entrada e arpejos de A e Bm",
      source: c + "etta-james/id-rather-go-blind/",
      youtube: y("Bcus42ihkTI"),
      recording: "Etta James · Tell Mama",
      tip: "A cifra fornecida diz Mi no cabeçalho, mas os acordes são A e Bm. Este estudo segue esses acordes em Lá. A entrada usa a primeira frase enviada e os versos usam arpejos didáticos.",
    },
    [
      {
        title: "Entrada · primeiros baixos",
        chords: ["A"],
        melody: [
          [6, 0],
          [6, 2, 2],
          [5, 0],
          [5, 0],
          [5, 2, 1],
          [5, 4, 3],
          [4, 2, 1],
          [5, 4, 3],
          [5, 2, 1],
          [6, 2, 2],
          [5, 2, 1],
          [6, 0],
          [6, 2, 2],
          [5, 0],
          [6, 2, 2],
          [5, 0],
        ],
      },
      part("Verso 1", "A A Bm Bm A A Bm Bm"),
      part("Refrão 1", "A A Bm Bm A A Bm Bm"),
      part("Verso 2", "A A Bm Bm A A Bm Bm"),
      part("Refrão 2", "A A Bm Bm A A Bm Bm"),
      part("Final", "A A Bm Bm A A"),
    ],
  ),
  song(
    {
      id: "blue-and-lonesome",
      title: "Blue And Lonesome",
      artist: "Little Walter",
      key: "Ré menor",
      arrangement: "Adaptação em afinação padrão",
      source: c + "little-walter/blue-and-lonesome/",
      youtube: y("KNqeUV4Lunk"),
      recording: "Little Walter · Hate to See You Go",
      tuningNote:
        "Adaptação: E A D G B E. Não use a indicação Open G minor da cifra neste estudo.",
      tip: "O texto mistura afinação padrão e Open G minor. Os dedilhados aqui foram construídos para a afinação padrão, seguindo Dm, Gm e A7 da cifra. A passagem G#m → Gm desce uma casa.",
    },
    [
      part("Introdução", "Dm Gm Dm A7"),
      part("Primeira parte", lonesomeVerse),
      part("Segunda parte", lonesomeVerse),
      part("Base para solo", "Dm Gm Dm Gm Dm"),
      part("Terceira parte", lonesomeVerse),
      part("Final", "A7 G#m Gm Dm"),
    ],
  ),
  song(
    {
      id: "a-man-and-the-blues",
      title: "A Man And The Blues",
      artist: "Buddy Guy",
      key: "Dó",
      arrangement: "Acompanhamento com sétimas",
      source: c + "buddy-guy/a-man-and-the-blues/",
      youtube: y("SqDYo4m-hPA"),
      recording: "Buddy Guy · álbum A Man and the Blues, Craft Recordings",
      tip: "Escute a sétima de cada acorde. O baixo F# em D7/F# prepara a mudança. Os versos repetem a harmonia fornecida, em um dedilhado de estudo sem os solos improvisados.",
    },
    [
      part("Primeiro verso", manVerse),
      part("Segundo verso", manVerse),
      part("Terceiro verso", manVerse),
      part("Final", "C7 F7 C7 G7 C7"),
    ],
  ),
  song(
    {
      id: "lose-control",
      title: "Lose Control",
      artist: "Teddy Swims",
      key: "Fá sustenido menor",
      arrangement: "Soul · acompanhamento dedilhado",
      source: c + "teddy-swims/lose-control/",
      youtube: y("FkOpwodhROI"),
      recording: "Teddy Swims · vídeo oficial com letra",
      tip: "A sequência F#m, A, D e Db7 se repete. Este estudo ensina o acompanhamento em posições baixas; a seção instrumental mantém a base em vez do solo com bends nas casas altas.",
    },
    [
      part("Introdução", "F#m F#m"),
      part("Primeiro verso", "F#m A D Db7 F#m A D Db7"),
      part("Refrão 1", "F#m A D Db7 F#m A D Db7"),
      part("Segundo verso", "F#m A D Db7 F#m A D Db7"),
      part("Refrão 2", "F#m A D Db7 F#m A D Db7"),
      part("Base instrumental", "F#m A D Db7"),
      part("Refrão final", "F#m A D Db7 F#m A D Db7 F#m"),
    ],
  ),
];
export const LESSONS = [
  ...BEGINNER_SONGS,
  ...BLUES_SONGS,
  ...BLUES,
  ...SONGS,
];
export function lessonSections(lesson: BluesLesson) {
  return (
    lesson.sections ??
    Array.from(new Set(lesson.notes.map((n) => n.bar)), (bar) => ({
      title: `Compasso ${bar}`,
      start: lesson.notes.findIndex((n) => n.bar === bar),
      end: lesson.notes.map((n) => n.bar).lastIndexOf(bar),
    }))
  );
}
