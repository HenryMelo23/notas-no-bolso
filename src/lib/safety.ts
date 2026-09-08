import type { PitchResult } from './pitch';
import type { TunedStringTarget } from './music';

export type SafetyState = {
  level: 'idle' | 'listen' | 'tighten' | 'loosen' | 'hold' | 'danger';
  label: string;
  detail: string;
};

export function getSafetyState(pitch: PitchResult | null, target: TunedStringTarget | null): SafetyState {
  if (!pitch || !target) {
    return {
      level: 'idle',
      label: 'Toque uma corda',
      detail: 'O app só orienta quando o sinal está estável.'
    };
  }

  if ('held' in pitch && pitch.held) {
    return {
      level: 'listen',
      label: 'Sustentando leitura',
      detail: 'Valor mantido só para visual. Toque de novo antes de girar.'
    };
  }

  if (pitch.clarity < 0.68) {
    return {
      level: 'listen',
      label: 'Sinal instável',
      detail: 'Toque uma corda isolada e espere a leitura firmar.'
    };
  }

  if (target.cents > 85) {
    return {
      level: 'danger',
      label: 'Afrouxe agora',
      detail: 'A corda está muito acima do alvo selecionado.'
    };
  }

  if (target.cents < -85) {
    return {
      level: 'tighten',
      label: 'Aperte devagar',
      detail: 'Suba em pequenas voltas e toque de novo.'
    };
  }

  if (Math.abs(target.cents) <= 5) {
    return {
      level: 'hold',
      label: 'Afinado',
      detail: 'Pare de girar a tarraxa quando estabilizar no centro.'
    };
  }

  if (target.cents > 0) {
    return {
      level: 'loosen',
      label: 'Afrouxe',
      detail: 'Desça pouco; não continue apertando.'
    };
  }

  return {
    level: 'tighten',
    label: 'Aperte',
    detail: 'Suba aos poucos até o centro.'
  };
}
