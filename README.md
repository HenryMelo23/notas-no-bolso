# Notas no Bolso

Caderno de blues com afinador, temas claro/escuro e repetição de trechos. Cinco estudos iniciais e nove músicas em versões didáticas baseadas no material enviado, com links das gravações no YouTube.

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
entrega-notas-0.4.0\Notas-no-Bolso-0.4.0.exe
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
entrega-notas-0.4.0\Notas-no-Bolso-0.4.0-debug.apk
```

 Aulas e fontes funcionam offline; o YouTube precisa de internet. O app pausa a captura em segundo plano. O botão Voltar fecha a ajuda, retorna ao treino ou minimiza o aplicativo.

Em **Trecho de prática**, escolha a parte inicial/final ou as notas exatas. A opção de repetir retorna ao início depois do último acerto. Praticar um fragmento não registra a música inteira como concluída.

## Limites atuais

Na versão 0.4.0, entrar no afinador inicia o microfone. O modo automático reconhece a corda solta; tocar em uma corda seleciona o modo manual. Leituras dentro de 5 cents por um segundo conferem a corda e avançam para a próxima. O app mantém a leitura enquanto consegue distinguir a frequência do ruído; uma leitura antiga é identificada como tal e nunca orienta ajustes. O botão do tom da música explica os acordes sem alterar a afinação.

O APK inclui `RECORD_AUDIO` e `MODIFY_AUDIO_SETTINGS`, ambas exigidas pelo fluxo de áudio do Capacitor instalado. O pedido de permissão não interrompe mais a inicialização. Em caso de falha, a mensagem mostra o código do erro. A validação em Redmi Note 10S / Android 13 ainda depende de teste físico.

- As músicas usam dedilhados didáticos. Alguns temas são simplificados; solos completos, bends e o ritmo exato da gravação não são avaliados.
- Todas as adaptações usam afinação padrão. A ajuda de cada música explica divergências nas cifras enviadas.
- O microfone compara notas individuais. Uma mesma altura em cordas diferentes não identifica a corda física com certeza.
- `npm test` cobre sinais sintéticos, sustain, oitavas erradas, trechos e repetição. Isso não substitui testar com violão e microfone reais.
