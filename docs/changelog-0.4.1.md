# Notas no Bolso 0.4.1

## Correcao principal

- Reconhece uma nova corda mesmo quando a nota anterior continua ressoando.
- Avanca a tablatura logo apos um ataque correto, sem exigir silencio entre notas.
- Impede que o mesmo ataque avance duas casas.
- Aceita ataques repetidos da mesma nota em etapas consecutivas.
- Mantem a rejeicao de notas fora da tolerancia segura.

## Validacao

- 58 testes automatizados passaram.
- Sequencia completa de 48 notas passou em 44100 e 48000 Hz com cordas anteriores ainda ressoando.
- Smoke do aplicativo chegou a `48 / 48 notas` com ataques a cada 300 ms.

O APK usa assinatura de depuracao para instalacao direta. A resposta com violao e microfone reais ainda depende do ambiente, do aparelho e da posicao do microfone.
