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
export const LESSONS = [...BLUES, ...SONGS];
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
