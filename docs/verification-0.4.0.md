# Verificacao 0.4.0 - 2026-09-08

## Audio e comportamento

- `npm test`: 43 testes em 11 arquivos, todos passaram.
- `npm run build`: TypeScript e Vite passaram.
- Sinais sinteticos das seis cordas em 44100 e 48000 Hz, incluindo DC e segundo harmonico dominante.
- Decaimento medido ate 6.95 segundos; frequencia variando apos 3 segundos, sem congelar a leitura.
- Historico de notas aceitas tolera sustain, pequenos vazios e harmonicos durante a proxima nota. Notas erradas persistentes continuam gerando aviso.
- Conferencia automatica requer 1000 ms dentro de 5 cents; nao aceita sinal ruidoso ou oitava errada.
- Inicializacao de AudioContext durante o toque, permissao assincrona e mensagens especificas de erro cobertas por testes.

## Interface

- Navegador: entrar no afinador iniciou o microfone sintetico, reconheceu 110 Hz e pediu a proxima corda.
- 82.406889 Hz em amplitude 0.001 foi medido e conferido; sustain anterior continuou exibido sem orientar ajuste da proxima corda.
- Re com +15 cents e amplitude 0.001 mostrou +15.0 cents / 148.11 Hz continuamente.
- Status conservou altura de 160 px ao mudar de mensagem. Sem transbordamento horizontal em 390 px e 320 px.
- Temas claro e escuro inspecionados. Botao de retorno movido para linha propria quando necessario.
- Painel do tom mostrou Mi, acordes E7/A7/B7 e a distincao entre tom e afinacao padrao.
- Microfone sintetico removido, tema claro e dimensoes normais restaurados ao fim.
- Log do navegador teve uma falha de websocket do Vite, sem impedir a pagina; nao faz parte do aplicativo empacotado.

## Android

- APK 0.4.0 / versionCode 4, pacote br.com.afinadorlivre.app.
- Manifesto final conferido por aapt: RECORD_AUDIO e MODIFY_AUDIO_SETTINGS presentes.
- apksigner confirmou assinaturas v1 e v2. Assinatura de depuracao, nao publicacao de loja.
- HTML dentro do APK referencia o JS index-DBthYrud.js e CSS index-DbfxiXpO.css do build final.
- Redmi Note 10S / Android 13 nao conectado. A permissao e o ciclo de inicializacao foram corrigidos, mas funcionamento nesse hardware ainda precisa ser confirmado pelo usuario.

## Windows

- Portatil de arquivo unico; nao depende de Vite nem de copiar a pasta de recursos.
- O smoke de abertura verifica titulo, seis cordas, protocolo file: e ausencia de transbordamento, depois captura a propria janela.
- A captura nativa falhou com UnknownVizError usando GPU nesta maquina. Com renderizacao por software, passou e a imagem foi inspecionada. Essa configuracao foi incorporada ao executavel.
- Evidencias finais em verification/release-0.4.0/windows-startup.json e windows-startup.png.

## Limites

Testes sinteticos nao certificam calibracao acustica de microfone/violao reais. O algoritmo avalia alturas individuais, nao identifica inequivocamente a corda fisica nem valida acordes polifonicos completos. A leitura nao promete medir ruido sem frequencia identificavel. Nao foi aplicada uma compensacao arbitraria para igualar outros afinadores.
