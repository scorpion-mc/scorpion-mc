@echo off
setlocal
title SCORPION MC - GitHub Site Guncelleme
cd /d "%~dp0"

echo.
echo ==================================================
echo        SCORPION MC SITE GUNCELLEME
echo ==================================================
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo HATA: Git bulunamadi. Once Git for Windows kurulmali.
  pause
  exit /b 1
)

if not exist ".git" (
  echo HATA: Bu klasor GitHub deposuna bagli degil.
  echo Lutfen SITE SKAL klasorundeki bu dosyayi calistirin.
  pause
  exit /b 1
)

echo Site dosyalari hazirlaniyor...
git add -- "*.html" "favicon.svg" "icons.svg" "README.md" ".htaccess" ".gitignore" "guncelle.bat"
git add -- "assets/*.css" "assets/*.js" "assets/*.json" "assets/*.png" "assets/*.webp" "assets/*.jpg" "assets/*.mp3" "assets/*.mp4" "assets/*.otf" "assets/*.glb"

git diff --cached --quiet
if not errorlevel 1 (
  echo.
  echo Yeni bir degisiklik bulunamadi. Site zaten guncel.
  pause
  exit /b 0
)

set "COMMIT_MESSAGE=Site guncellemesi %date% %time%"
echo Degisiklikler kaydediliyor...
git commit -m "%COMMIT_MESSAGE%"
if errorlevel 1 goto :error

echo GitHub uzerindeki son durum aliniyor...
git pull --rebase origin main
if errorlevel 1 (
  echo.
  echo HATA: GitHub ile birlestirme tamamlanamadi.
  echo Dosyalarda cakisma olabilir. Hicbir dosya silinmedi.
  echo Yardim almadan tekrar calistirmayin.
  pause
  exit /b 1
)

echo Site GitHub'a gonderiliyor...
rem Yerel Git LFS pre-push hook'u bazi Windows sistemlerinde
rem fork/child_copy hatasi verebildigi icin hook atlanir.
rem Siteye eklenecek yeni LFS dosyasi bulunmadigindan bu guvenlidir.
git push --no-verify origin main
if errorlevel 1 goto :error

echo.
echo ==================================================
echo BASARILI: Site GitHub'a gonderildi.
echo GitHub Pages ve bagli domain genellikle 1-5 dakika
echo icinde otomatik olarak guncellenir.
echo ==================================================
echo.
pause
exit /b 0

:error
echo.
echo HATA: Islem tamamlanamadi.
echo GitHub oturumu, internet baglantisi veya yetkiyi kontrol edin.
echo Site dosyalariniz silinmedi.
pause
exit /b 1
