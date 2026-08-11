@echo off
chcp 65001 > nul
echo =======================================
echo   SCORPION MC - GITHUB GUNCELLEYICI
echo =======================================
echo.

echo [1/5] GitHub'daki son degisiklikler kontrol ediliyor...
echo (Ozellikle Admin panelinden yuklenen fotograflar aliniyor)
git pull origin main

echo.
set /p commit_msg="Yapilan degisikligi kisaca yazin (ornegin: iletisim butonu eklendi): "

if "%commit_msg%"=="" (
    set commit_msg=Guncelleme %date% %time%
)

echo.
echo [2/5] Degisiklikler ekleniyor...
git add .

echo [3/5] Degisiklikler kaydediliyor...
git commit -m "%commit_msg%"

echo [4/5] Son bir senkronizasyon yapiliyor...
git pull --rebase origin main

echo [5/5] Siteniz GitHub'a gonderiliyor...
git push origin main

echo.
if %errorlevel% neq 0 (
    echo.
    echo [!] BIR HATA OLUSTU! 
    echo Muhtemelen galeri verileriyle ilgili bir cakisma var.
    echo Lutfen bu pencereyi kapatip tekrar 'guncelle.bat' calistirin.
) else (
    echo =======================================
    echo ISLEM TAMAMLANDI! Siteniz guncellendi.
    echo =======================================
)

pause
