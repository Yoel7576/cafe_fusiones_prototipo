@echo off
cd /d "%~dp0"
set PORT=5360
title Cafe Fusiones - MODULAR V3

echo ============================================
echo   CAFE FUSIONES - Version MODULAR
echo   Puerto: %PORT%
echo ============================================
echo.

where py >nul 2>nul
if %errorlevel%==0 (
  start "Cafe Fusiones - Servidor (cierra esta ventana para detener)" py -m http.server %PORT% --bind 127.0.0.1
  goto :abrir
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "Cafe Fusiones - Servidor (cierra esta ventana para detener)" python -m http.server %PORT% --bind 127.0.0.1
  goto :abrir
)

echo No se encontro Python instalado.
echo Instala Python o abre index.html con un servidor local.
pause
goto :eof

:abrir
timeout /t 2 >nul
start "" "http://127.0.0.1:%PORT%/index.html"
echo.
echo La aplicacion se abrio en: http://127.0.0.1:%PORT%/index.html
echo Usuario: CFUSIONES   Clave: prototipo
echo.
echo  - Si ves una version anterior, presiona Ctrl+F5.
echo  - Para DETENER el servidor, cierra la ventana "Cafe Fusiones - Servidor".
echo.
pause
