# Notas no Bolso 0.4.2

## Calibracao do afinador

- O afinador passou de 4096 para 8192 amostras por leitura.
- A nota continua sendo identificada pelo metodo MPM da biblioteca Pitchy.
- Uma busca espectral estreita de mais ou menos 12 cents refina a frequencia fundamental.
- O refinamento nao conhece a nota-alvo e nao pode puxar uma leitura errada para o centro.
- Quando o segundo harmonico domina e a fundamental esta fraca, a leitura temporal e preservada.

## Validacao

- 60 testes automatizados passaram.
- As seis cordas passaram em 44100 e 48000 Hz com rigidez, ruido, fases e harmonicos variados.
- O erro sintetico da matriz calibrada ficou abaixo de 0.5 cent.
- No aplicativo montado, uma entrada inarmonica de 110 Hz mostrou 110.00 Hz e +0.0 cents.
- Uma entrada de +17 cents mostrou 111.09 Hz e +17.0 cents, sem ser atraida ao centro.

Testes sinteticos nao substituem uma rodada com violao e microfone reais. Ajustes de tarraxa continuam sendo orientados somente com leitura estavel e proxima da corda selecionada.
