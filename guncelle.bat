@echo off
setlocal
chcp 65001 >nul
title SCORPION MC - Siteyi Yayinla
cd /d "%~dp0"
set "GCM_INTERACTIVE=never"

echo ==============================================
echo       SCORPION MC - SITEYI YAYINLA
echo ==============================================
echo.

where git >nul 2>&1
if errorlevel 1 (
    echo [HATA] Git bilgisayarda bulunamadi.
    goto :failed
)

if not exist ".git" (
    echo [HATA] Bu dosya site klasorunun icinde degil.
    goto :failed
)

rem Bu site her zaman scorpion-mc GitHub hesabini kullanir.
git config --local credential.https://github.com.username scorpion-mc
git config --local credential.useHttpPath true

echo [1/4] Degisiklikler hazirlaniyor...
git add -A
if errorlevel 1 goto :failed

git diff --cached --quiet
if errorlevel 1 (
    echo [2/4] Degisiklikler kaydediliyor...
    git commit -m "Site guncellemesi %date% %time%"
    if errorlevel 1 goto :failed
) else (
    echo [2/4] Kaydedilecek yeni degisiklik bulunamadi.
)

echo [3/4] GitHub ile senkronize ediliyor...
git pull --rebase origin main
if errorlevel 1 goto :failed

echo [4/4] Site GitHub'a gonderiliyor...
git push origin main
if errorlevel 1 goto :failed

echo.
echo ==============================================
echo BASARILI! Degisiklikler GitHub'a gonderildi.
echo Site genellikle 1-2 dakika icinde yenilenir.
echo ==============================================
echo.
pause
exit /b 0

:failed
echo.
echo ==============================================
echo ISLEM TAMAMLANAMADI.
echo Yukaridaki hata mesajinin ekran goruntusunu al.
echo ==============================================
echo.
pause
exit /b 1
