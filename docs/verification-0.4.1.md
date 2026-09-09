# Verificacao 0.4.1 - 2026-09-09

## Correcao de notas sobrepostas

- O treino agora usa um detector de ataque separado do afinador.
- Uma FFT de 8192 amostras compara o espectro atual com o decaimento anterior e extrai a nova nota mesmo quando outras cordas continuam soando.
- O relogio do AudioContext controla a analise a 30 quadros por segundo, evitando intervalos irregulares do requestAnimationFrame.
- Cada ataque recebe um identificador. Um ataque nao avanca duas etapas; outro ataque da mesma nota pode avancar a etapa seguinte.
- A nota precisa estar a no maximo 25 cents do alvo para ser aceita.

## Testes automatizados

- `npm test -- --run`: 58 testes em 12 arquivos, todos passaram.
- `npm run build`: TypeScript e Vite passaram.
- Sequencia didatica completa de 48 notas validada em 44100 e 48000 Hz.
- Entradas sinteticas mantem ate tres ou mais cordas em decaimento enquanto uma nova corda e tocada.
- Frases com intervalos de 300 e 500 ms, ataques repetidos, notas novas fracas sob um baixo forte e as seis cordas soltas passaram.
- Ruido aleatorio, oitavas erradas e desvios de 45 ou 100 cents nao avancam a tablatura.
- A latencia sintetica maxima por ataque e limitada pelos testes a 200 ms.

## Smoke no aplicativo

- O navegador recebeu audio Web Audio a 48000 Hz pelo mesmo MediaStream consumido pelo aplicativo.
- As 48 notas foram atacadas a cada 300 ms sem silenciar as outras cordas.
- A interface chegou a `48 / 48 notas` e exibiu `Voce tocou o blues inteiro!`.
- O microfone original e o progresso local foram restaurados ao final.

## Limites

O smoke comprova a integracao do detector com o fluxo real da interface, mas usa audio sintetico. Microfones de celular, ruido do ambiente, posicionamento do aparelho e caracteristicas do violao ainda exigem validacao fisica. O afinador conserva seu caminho de deteccao e estabilizacao separado; esta mudanca nao aumenta a permissao para orientar aperto de corda com leitura instavel.
