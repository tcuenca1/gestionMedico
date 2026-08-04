@echo off
setlocal
cd /d "%~dp0"

rem IP LAN de este PC. Si cambias de red, actualiza esta linea.
rem (ejecuta ver-ip.bat y mira la Direccion IPv4 en ip.txt)
set "REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.51"

echo ============================================
echo   SGMP Movil
echo ============================================
echo.
echo Carpeta: %CD%
echo IP del PC: %REACT_NATIVE_PACKAGER_HOSTNAME%
echo.

if not exist "node_modules" (
  echo Faltan las dependencias. Instalando...
  call npm install --legacy-peer-deps
  if errorlevel 1 goto :error
)

echo Escanea el codigo QR con la app Expo Go de tu telefono.
echo El telefono y este PC deben estar en la misma red Wi-Fi.
echo Ctrl+C para detener.
echo.

call npx expo start --port 8090 --host lan
goto :fin

:error
echo.
echo [ERROR] Fallo la instalacion. Revisa el mensaje de arriba.
pause
exit /b 1

:fin
pause
