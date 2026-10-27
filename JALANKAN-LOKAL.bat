@echo off
setlocal
cd /d "%~dp0"
echo ==============================================
echo AKSATIX - Server lokal pada http://localhost:3000
echo Tutup jendela ini untuk menghentikan server.
echo ==============================================
where py >nul 2>nul
if %errorlevel%==0 (
  py -m http.server 3000 --bind 127.0.0.1
  goto :end
)
where python >nul 2>nul
if %errorlevel%==0 (
  python -m http.server 3000 --bind 127.0.0.1
  goto :end
)
echo Python tidak ditemukan. Instal Python 3 lalu jalankan file ini lagi.
pause
:end
endlocal
