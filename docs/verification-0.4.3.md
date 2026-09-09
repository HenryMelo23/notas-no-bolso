# Verificacao 0.4.3 - 2026-09-09

## Coleta

- Fonte: Microfone (High Definition Audio Device), mono, PCM 24 bits, 48000 Hz.
- Procedimento: uma corda solta por arquivo, gravacao iniciada manualmente, contagem regressiva 3-2-1 e um unico toque no aviso visual.
- O servidor de coleta aceitou cada arquivo somente depois de encontrar pelo menos seis quadros da nota solicitada com clareza minima de 0.88 e erro inferior a 80 cents.
- Os arquivos de audio permanecem locais e nao fazem parte do repositorio publico.

## Resultado do pipeline completo

| Corda | Mediana relativa ao alvo | Ultima medida nova | Notas erradas exibidas |
| --- | ---: | ---: | ---: |
| E2 | -3.14 cents | 8.73 s | 0 |
| A2 | +5.01 cents | 7.16 s | 0 |
| D3 | +0.94 cents | 7.80 s | 0 |
| G3 | -8.89 cents | 4.53 s | 0 |
| B3 | +3.73 cents | 4.50 s | 0 |
| E4 | -0.25 cents | 5.11 s | 0 |

Os valores acima descrevem o conjunto corda, violao, ambiente e microfone. Como os desvios aparecem nos dois sentidos, nenhum deslocamento global foi aplicado ao afinador.

## Regressoes

- O limiar MPM de 0.85 reconheceu 158 quadros de E2 contra 111 com 0.99 e 117 quadros de D3 contra 82, mantendo o filtro final de clareza em 0.88.
- Uma envoltoria lenta de 5 Hz sobre E2 nao pode ser interpretada como frequencia musical.
- Segundo harmonico dominante foi testado nas seis cordas, em 44100 e 48000 Hz, sem salto de oitava.
- Uma oitava residual mais fraca nao substitui a fundamental estabilizada; uma oitava realmente repicada com ataque forte continua permitida.

## Seguranca

- A nota-alvo nao participa da deteccao nem do refinamento.
- Leituras mantidas entre lacunas sao somente visuais e nao autorizam ajuste de tarraxa.
- A confirmacao automatica continua exigindo um segundo de medidas novas dentro de mais ou menos 5 cents.

## Execucao final

- `npm test -- --run`: 63 testes em 12 arquivos, todos passaram.
- `npm run build`: TypeScript e Vite passaram; bundle principal `index-DNKLjPpe.js`.
- Smoke do Windows: titulo `Notas no Bolso`, seis cordas, microfone disponivel, protocolo `file:`, largura interna 1264 e nenhum overflow.
- A captura `verification/release-0.4.3-final/windows-startup.png` foi inspecionada visualmente.
- APK: `br.com.afinadorlivre.app`, versionCode 7, versionName 0.4.3, permissoes RECORD_AUDIO e MODIFY_AUDIO_SETTINGS.
- APK de depuracao verificado com assinaturas v1 e v2 e bundle `index-DNKLjPpe.js`.
- SHA-256 EXE: `A4F5A26A73013F890FDB91CE649C95D4D37C0BD06ABCFFFF5B1DFE26D26F9EF4`.
- SHA-256 APK: `FC5142464C36235982C037AE23D335B767A62423EC0127DF42336F54EBC9CCBB`.
