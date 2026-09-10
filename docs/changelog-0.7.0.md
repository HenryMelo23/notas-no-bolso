# Notas no Bolso 0.7.0

## Currículo prático

- Adiciona a navegação **Módulos**, sem bloquear um nível atrás do outro.
- Cria cinco caminhos independentes: cordas e braço, ritmo e tablatura, acordes, blues em 12 compassos e pentatônica.
- Cada etapa combina explicação curta, exercício imediato, missão verificável e botão para abrir a música correspondente.
- O progresso das missões fica salvo localmente no dispositivo.
- O mascote acompanha a trilha e a prática sem deslocar o layout da página.

## Base de estudo

O texto foi reescrito para o app e usa estas referências como base de consulta:

- Fender: cordas, notas abertas e afinação padrão.
- GuitarLessons: progressão I-IV-V, 12 compassos e acordes dominantes com sétima.
- JustinGuitar: shuffle, pentatônica menor e improvisação por pergunta e resposta.
- OpenLearn: formação de tríades e papel da terça.

## Verificação

- `npm test -- --run`: 13 arquivos, 71 testes aprovados.
- `npm run build`: compilação TypeScript e bundle Vite aprovados.
