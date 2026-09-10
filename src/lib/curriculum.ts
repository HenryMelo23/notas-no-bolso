export type CurriculumLevel =
  | "Primeiros passos"
  | "Fácil"
  | "Intermediário"
  | "Avançado";

export type CurriculumStep = {
  title: string;
  theory: string;
  practice: string;
  mission: string;
  lessonId: string;
};

export type CourseModule = {
  id: string;
  title: string;
  level: CurriculumLevel;
  eyebrow: string;
  description: string;
  why: string;
  steps: CurriculumStep[];
  sources: { label: string; href: string }[];
};

const fenderGuitar =
  "https://www.fender.com/play/lessons/get-to-know-your-guitar";
const fenderTuning =
  "https://www.fender.com//articles/setup/standard-tuning-how-eadgbe-came-to-be";
const twelveBar =
  "https://www.guitarlessons.com/guitar-lessons/blues-guitar-quick-start-series/the-12-bar-blues-progression";
const dominantSeventh =
  "https://www.guitarlessons.com/guitar-lessons/blues-guitar-quick-start-series/dominant-seventh-blues-chords/";
const bluesImprovisation =
  "https://www.justinguitar.com/modules/blues-guitar-easy-improvisation";
const bluesLead =
  "https://www.justinguitar.com/modules/essential-blues-lead-guitar";
const triads =
  "https://www.open.edu/openlearn/history-the-arts/music/an-introduction-music-theory/content-section-7";

export const CURRICULUM_MODULES: CourseModule[] = [
  {
    id: "braco-e-cordas",
    title: "Braço, cordas e notas",
    level: "Primeiros passos",
    eyebrow: "COMECE PELO MAPA",
    description:
      "Entenda o que o violão está dizendo antes de apertar qualquer casa.",
    why:
      "Quando você reconhece as seis cordas e sabe que cada casa sobe um semitom, a tablatura deixa de ser um desenho misterioso.",
    steps: [
      {
        title: "Leia as seis cordas",
        theory:
          "Na afinação padrão, da mais grave para a mais aguda, elas são Mi, Lá, Ré, Sol, Si e Mi. A mesma nota Mi aparece nas duas pontas, em oitavas diferentes.",
        practice:
          "Toque as seis cordas soltas lentamente e diga o nome de cada uma. A corda 6 é a mais grossa; a 1 é a mais fina.",
        mission: "Reconheça as seis cordas sem olhar a etiqueta.",
        lessonId: "mary-little-lamb",
      },
      {
        title: "Casa, traste e semitom",
        theory:
          "Cada casa aumenta a altura em um semitom. A casa 0 é a corda solta; a casa 1 é a nota seguinte no braço, e assim por diante.",
        practice:
          "Na corda 1, toque casa 0, 1, 2 e 3. Observe no braço e escute a subida regular.",
        mission: "Toque quatro passos ascendentes sem trocar de corda.",
        lessonId: "ode-to-joy",
      },
    ],
    sources: [
      { label: "Fender · conheça seu violão", href: fenderGuitar },
      { label: "Fender · afinação E A D G B E", href: fenderTuning },
    ],
  },
  {
    id: "ritmo-e-tablatura",
    title: "Ritmo que vira música",
    level: "Fácil",
    eyebrow: "TOQUE COM PULSO",
    description:
      "Aprenda a ler duração, compasso e pausa usando melodias que você reconhece.",
    why:
      "Uma sequência de notas só vira música quando existe espaço e repetição. Contar evita acelerar sem perceber e prepara o ouvido para tocar com outras pessoas.",
    steps: [
      {
        title: "Conte quatro tempos",
        theory:
          "Em 4/4, cada compasso tem quatro pulsos. A nota pode ocupar um ou mais tempos, e uma pausa também ocupa espaço mesmo sem som.",
        practice:
          "Bata o pé em quatro pulsos iguais. Toque uma nota no primeiro pulso e espere os outros três antes de repetir.",
        mission: "Mantenha o pulso enquanto toca uma frase curta.",
        lessonId: "mary-little-lamb",
      },
      {
        title: "Siga a tablatura",
        theory:
          "A linha mostra a corda e o número mostra a casa. O marcador acompanha a nota atual; você só avança quando o ataque correto for detectado.",
        practice:
          "Abra a missão, olhe a corda e o dedo indicados e toque no seu tempo. Use o exemplo sonoro para ouvir a frase completa.",
        mission: "Complete uma melodia sem pular casas nem cordas.",
        lessonId: "twinkle-little-star",
      },
    ],
    sources: [
      { label: "ToneWright · melodias públicas para estudo", href: "https://tonewright.app/songs/" },
      { label: "Free Guitar Music · tabs fáceis", href: "https://www.freeguitarmusic.net/easy-tabs" },
    ],
  },
  {
    id: "acordes-por-dentro",
    title: "Acordes por dentro",
    level: "Fácil",
    eyebrow: "OUÇA A HARMONIA",
    description:
      "Descubra como várias notas formam um acorde e por que o blues gosta tanto da sétima.",
    why:
      "Entender a raiz, a terça, a quinta e a sétima permite montar novas formas no braço em vez de decorar desenhos isolados.",
    steps: [
      {
        title: "Raiz, terça e quinta",
        theory:
          "A tríade maior nasce de uma raiz, uma terça maior e uma quinta justa. A terça ajuda a definir se o acorde soa maior ou menor.",
        practice:
          "No estudo, toque as notas do acorde uma por vez e depois ouça o exemplo. Diga qual nota parece ser o ponto de repouso.",
        mission: "Identifique a nota de repouso de três frases.",
        lessonId: "first-blues",
      },
      {
        title: "A cor da sétima",
        theory:
          "O acorde dominante 7 acrescenta a sétima menor à tríade, formando a sonoridade que cria tensão e pede movimento no blues.",
        practice:
          "Compare E7, A7 e B7 no mini-blues. Toque o baixo e a resposta de cada compasso, sem tentar correr.",
        mission: "Ouça a diferença entre a tríade e o acorde com sétima.",
        lessonId: "sevenths",
      },
    ],
    sources: [
      { label: "OpenLearn · tríades e intervalos", href: triads },
      { label: "GuitarLessons · acordes dominantes 7", href: dominantSeventh },
    ],
  },
  {
    id: "blues-12-compassos",
    title: "Blues em 12 compassos",
    level: "Intermediário",
    eyebrow: "A FORMA DO BLUES",
    description:
      "Toque uma volta completa de pergunta, resposta e turnaround em Mi.",
    why:
      "A forma I-IV-V é uma linguagem. Depois que você sente onde a volta começa e termina, consegue acompanhar muitos blues sem depender de decorar uma música inteira.",
    steps: [
      {
        title: "I, IV e V no braço",
        theory:
          "Em Mi, os graus I, IV e V são Mi, Lá e Si. No blues, eles costumam aparecer como E7, A7 e B7 em uma sequência de 12 compassos.",
        practice:
          "Siga a tablatura de baixo do módulo e perceba a troca no quinto, nono e décimo primeiro compassos.",
        mission: "Complete os 12 compassos sem perder a mudança de acorde.",
        lessonId: "blues-de-varanda",
      },
      {
        title: "Shuffle e turnaround",
        theory:
          "O shuffle divide o pulso em um balanço longo-curto. O turnaround é a frase final que conduz de volta ao primeiro compasso.",
        practice:
          "Toque o exemplo em 50% da velocidade. Conte em voz baixa e deixe a última resposta preparar o recomeço.",
        mission: "Faça duas voltas mantendo o mesmo pulso.",
        lessonId: "first-blues",
      },
    ],
    sources: [
      { label: "GuitarLessons · progressão de 12 compassos", href: twelveBar },
      { label: "JustinGuitar · improvisação blues fácil", href: bluesImprovisation },
    ],
  },
  {
    id: "pentatonica-e-criacao",
    title: "Pentatônica e criação",
    level: "Avançado",
    eyebrow: "FALE COM O BLUES",
    description:
      "Use cinco notas para construir frases, responder e criar pequenas ideias próprias.",
    why:
      "Improvisar não é tocar notas aleatórias: é escolher poucas notas, respeitar o espaço e responder à harmonia que está acontecendo.",
    steps: [
      {
        title: "Cinco notas que combinam",
        theory:
          "A pentatônica menor de Mi usa Mi, Sol, Lá, Si e Ré. Ela cobre duas oitavas no braço e é uma base segura para começar frases de blues.",
        practice:
          "Toque a frase indicada em blocos curtos. Pare, respire e repita a segunda metade como se fosse uma resposta.",
        mission: "Toque pergunta e resposta sem acelerar.",
        lessonId: "blues-pergunta-resposta",
      },
      {
        title: "Alvo e espaço",
        theory:
          "Uma frase ganha direção quando termina em uma nota do acorde. O silêncio entre duas ideias também faz parte do ritmo.",
        practice:
          "Escolha uma nota final e deixe-a soar. Escute o acompanhamento e só comece a próxima ideia depois do espaço.",
        mission: "Crie duas respostas diferentes usando o mesmo desenho.",
        lessonId: "pentatonic",
      },
    ],
    sources: [
      { label: "JustinGuitar · improvisação blues", href: bluesImprovisation },
      { label: "JustinGuitar · guitarra blues essencial", href: bluesLead },
    ],
  },
];
