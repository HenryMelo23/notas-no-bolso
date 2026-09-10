# Notas no Bolso

Caderno musical para iniciantes, com afinador, temas claro/escuro, repetição de trechos e cinco melodias conhecidas para aprender de verdade. Depois delas, a biblioteca reúne cinco estudos de blues e nove músicas em versões didáticas baseadas no material enviado, com links para ouvir cada referência.

## Rodar no desktop

```powershell
npm install
npm run dev
```

Abra o endereço exibido pelo Vite e permita acesso ao microfone.

## Rodar como software desktop

```powershell
npm run electron:dev
```

## Gerar executável Windows

```powershell
npm run electron:pack
```

Saída esperada:

```text
entrega-notas-0.5.0\Notas-no-Bolso-0.5.0.exe
```

Esse executável portátil inclui os arquivos necessários e pode ser transferido sozinho. A pasta `Notas no Bolso-win32-x64` também é gerada para diagnóstico; o executável interno dessa pasta depende dos arquivos ao redor.

## Gerar build web

```powershell
npm run build
```

## Gerar Android

Requer JDK 21 e Android SDK 35. O SDK e o JDK desta máquina já estão configurados. Para compilar e copiar o APK:

```powershell
npm run android:build
```

Saída esperada do APK debug:

```text
entrega-notas-0.5.0\Notas-no-Bolso-0.5.0-debug.apk
```

Aulas e fontes funcionam offline; o YouTube precisa de internet. O app pausa a captura em segundo plano. O botão Voltar fecha a ajuda, retorna ao treino ou minimiza o aplicativo.

Em **Trecho de prática**, escolha a parte inicial/final ou as notas exatas. A opção de repetir retorna ao início depois do último acerto. Praticar um fragmento não registra a música inteira como concluída.

## Limites atuais

Na versão 0.5.0, entrar no afinador inicia o microfone. O modo automático reconhece a corda solta; tocar em uma corda seleciona o modo manual. Leituras dentro de 5 cents por um segundo conferem a corda e avançam para a próxima. Nas lições, um novo ataque correto avança no primeiro quadro confiável mesmo com outras cordas vibrando; a sustentação sozinha não conta como outro toque. O app mantém a leitura enquanto consegue distinguir a frequência do ruído, rejeita modulações lentas do ambiente e não troca uma fundamental em queda pela oitava mais fraca. Uma leitura antiga é identificada como tal e nunca orienta ajustes. O botão do tom da música explica os acordes sem alterar a afinação.

O afinador analisa 8192 amostras e combina a estimativa temporal MPM com um refinamento espectral estreito da frequência fundamental. O refinamento não recebe a nota esperada e, portanto, não desloca uma nota errada artificialmente para o centro. Quando o fundamental está fraco demais, a estimativa temporal conservadora é mantida.

Durante uma música, um detector separado identifica o ataque de uma nova nota e reduz o espectro das cordas que continuam ressoando. Assim, a próxima nota pode ser aceita sem silenciar a anterior. Cada ataque só avança uma etapa, inclusive quando duas notas iguais aparecem em sequência; sinais mais de 25 cents fora da nota esperada continuam rejeitados.

As cinco primeiras músicas são melodias completas, em primeira posição e com no máximo a terceira casa: **Mary Had a Little Lamb**, **Brilha, Brilha, Estrelinha**, **Ode à Alegria**, **Parabéns pra Você** e **Amazing Grace**. O botão **Ouvir trecho** toca um guia sintetizado com contagem de entrada, BPM, compasso e duração das notas; **Ouvir gravação** abre a vídeo-aula vinculada. A faixa de prática permite escolher a parte inicial e final ou repetir um intervalo de notas.

O APK inclui `RECORD_AUDIO` e `MODIFY_AUDIO_SETTINGS`, ambas exigidas pelo fluxo de áudio do Capacitor instalado. O pedido de permissão não interrompe mais a inicialização. Em caso de falha, a mensagem mostra o código do erro. A validação em Redmi Note 10S / Android 13 ainda depende de teste físico.

- As músicas usam dedilhados didáticos. Alguns temas são simplificados; solos completos, bends e o ritmo exato da gravação não são avaliados.
- Todas as adaptações usam afinação padrão. A ajuda de cada música explica divergências nas cifras enviadas.
- O microfone compara notas individuais. Uma mesma altura em cordas diferentes não identifica a corda física com certeza.
- `npm test` cobre sinais sintéticos, sustain, cordas sobrepostas, ataques repetidos, oitavas erradas, trechos e repetição. Isso não substitui testar com violão e microfone reais.
