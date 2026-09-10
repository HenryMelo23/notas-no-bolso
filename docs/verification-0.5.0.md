# Verificação 0.5.0

## Escopo

Esta versão valida a entrada da biblioteca, a seleção de trechos, a progressão por ataque e a reprodução de exemplos ritmados. A captura real de áudio continua dependente do microfone e do ambiente do dispositivo.

## Comandos

```powershell
npm test -- --run
npm run build
npm run electron:pack
npm run android:build
```

## Artefatos

- `entrega-notas-0.5.0\Notas-no-Bolso-0.5.0.exe`
- `entrega-notas-0.5.0\Notas-no-Bolso-0.5.0-debug.apk`

## Smoke visual do desktop

O executável empacotado deve iniciar sem tela vazia, mostrar o título da aplicação, a primeira tablatura com seis cordas e gerar `verification\release-0.5.0-final\smoke.png` e `smoke.json` quando iniciado com:

```powershell
.\entrega-notas-0.5.0\Notas no Bolso-win32-x64\Notas no Bolso.exe --smoke-output=verification\release-0.5.0-final
```
