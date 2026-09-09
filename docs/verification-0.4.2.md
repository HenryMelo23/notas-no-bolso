# Verificacao 0.4.2 - 2026-09-09

## Precisao

- Janela do afinador: 8192 amostras.
- Taxas testadas: 44100 e 48000 Hz.
- Frequencias testadas: E2, A2, D3, G3, B3 e E4.
- Desvios de entrada testados: -37, 0 e +41 cents.
- Sinais incluem bias DC, ruido deterministico, segundo harmonico dominante e inarmonicidade crescente dos parciais.
- Erro maximo aceito pela regressao: menos de 0.5 cent.
- Fundamental muito fraca sob segundo harmonico forte: menos de 2 cents e sem salto de oitava.

## Seguranca da decisao

- A nota-alvo nao participa da deteccao nem do refinamento de frequencia.
- O MPM precisa manter clareza minima de 0.88.
- O refinamento so e aplicado quando ha energia suficiente na fundamental.
- Maximos espectrais na borda da busca sao descartados.
- A confirmacao da corda continua exigindo um segundo inteiro dentro de mais ou menos 5 cents usando medidas novas.
- Leituras antigas mantidas visualmente nao orientam giro de tarraxa.

## Execucao

- `npm test -- --run`: 60 testes em 12 arquivos, todos passaram.
- `npm run build`: TypeScript e Vite passaram.
- Smoke montado a 48000 Hz: 110.00 Hz / +0.0 cents para A2 inarmonica.
- Smoke deslocado: 111.09 Hz / +17.0 cents e orientacao para afrouxar.
- Microfone sintetico removido e estado normal restaurado ao final.

## Limite

Os resultados comprovam o processamento digital e sua integracao com a interface, mas nao certificam o conjunto microfone, conversor e ambiente de um aparelho fisico. A verificacao final deve comparar o Redmi Note 10S com uma fonte ou afinador de referencia, tocando uma corda por vez e sem girar a tarraxa quando o app indicar sinal fraco ou corda distante do alvo.
