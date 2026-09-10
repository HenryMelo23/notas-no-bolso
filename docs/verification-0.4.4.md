# Verificacao 0.4.4 - 2026-09-09

## Sobreposicao real

- Fonte: seis capturas reais individuais, mono, 48000 Hz.
- Procedimento: cada ataque foi colocado a 500 ms do anterior e todas as caudas permaneceram na mistura.
- Resultado: E2, A2, D3, G3, B3 e E4 avancaram na ordem correta.
- Latencias: 167, 167, 233, 200, 100 e 67 ms.
- Maior latencia: 233 ms, abaixo do limite de regressao de 250 ms.

## Protecoes

- Um ataque correto e aceito no primeiro quadro com frequencia e clareza confiaveis.
- O rearmamento exige um vale relativo seguido por uma nova subida espectral.
- Uma corda sustentada nao pode avancar novamente sem nova articulacao.
- Nota errada, oitava errada, desvio superior e ruido aleatorio continuam cobertos por testes.

## Execucao final

- `npm test -- --run`: 66 testes em 12 arquivos, todos passaram.
- `npm run build`: TypeScript e Vite passaram; bundle principal `index-Bwmbuh8A.js`.
- Smoke do Windows: titulo `Notas no Bolso`, seis cordas, microfone disponivel, protocolo `file:`, largura interna 1264 e nenhum overflow.
- A captura `verification/release-0.4.4-final/windows-startup.png` foi inspecionada visualmente.
- APK: `br.com.afinadorlivre.app`, versionCode 8, versionName 0.4.4, permissoes RECORD_AUDIO e MODIFY_AUDIO_SETTINGS.
- APK de depuracao verificado com assinaturas v1 e v2.
- SHA-256 EXE: `FAAE7C2764E462D26CD2E57195034ECBE360BBB89172CA4A8AA9D1DFFE0C257B`.
- SHA-256 APK: `944AE914EF5B50910DBF3C005F7C49036E5F982D666F53D6E4D2A548DE4FD829`.
