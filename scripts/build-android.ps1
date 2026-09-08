param([string]$JdkHome = $env:JAVA_HOME)
$ErrorActionPreference = 'Stop'
if (-not $JdkHome) {
    $bundledJdk = Join-Path $env:LOCALAPPDATA 'Java/temurin-21.0.12.1/jdk-21.0.12.1+1'
    if (Test-Path -LiteralPath $bundledJdk) { $JdkHome = $bundledJdk }
}
if (-not $JdkHome -or -not (Test-Path -LiteralPath (Join-Path $JdkHome 'bin/java.exe'))) {
    throw 'Configure JAVA_HOME com um JDK 21 ou informe -JdkHome.'
}
$env:JAVA_HOME = $JdkHome
$projectRoot = Split-Path $PSScriptRoot -Parent
Push-Location (Join-Path $projectRoot 'android')
try {
    & .\gradlew.bat assembleDebug --console=plain
    if ($LASTEXITCODE -ne 0) { throw "Gradle falhou: $LASTEXITCODE" }
} finally { Pop-Location }
$appVersion = (Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'package.json') | ConvertFrom-Json).version
$outputDirectory = Join-Path $projectRoot "entrega-notas-$appVersion"
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $projectRoot 'android/app/build/outputs/apk/debug/app-debug.apk') -Destination (Join-Path $outputDirectory "Notas-no-Bolso-$appVersion-debug.apk")
Write-Output (Join-Path $outputDirectory "Notas-no-Bolso-$appVersion-debug.apk")
