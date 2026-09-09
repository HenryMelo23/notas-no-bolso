# Notas no Bolso 0.4.3

## Afinador

- Ajusta o limiar interno do MPM para acompanhar a irregularidade natural de uma corda sustentada sem reduzir a clareza minima aceita pelo aplicativo.
- Distingue uma fundamental fraca de um segundo harmonico dominante sem encaixar o resultado na nota esperada.
- Impede que um harmonico de oitava mais fraco substitua uma nota ja estabilizada durante a queda do volume.
- Mantem 8192 amostras: 16384 trouxe ganho inferior a 1 cent na amostra inicial e dobraria a janela de aproximadamente 171 ms para 341 ms em 48 kHz.

## Validacao real

- Seis cordas soltas gravadas individualmente pelo microfone padrao a 48 kHz, com acionamento manual, contagem regressiva visual e validacao de nota antes da confirmacao.
- O pipeline completo nao apresentou nota errada em nenhuma das seis capturas.
- O Mi grave permaneceu em medicao nova ate 8,73 s do arquivo; os intervalos sem leitura foram exibidos apenas como leitura mantida, sem orientar a tarraxa.

