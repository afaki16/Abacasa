#!/usr/bin/env pwsh
# ============================================
#  Kickstart Template - Setup Script
#  Windows/macOS/Linux (PowerShell 7+ veya Windows PowerShell 5.1+)
# ============================================

param(
    [string]$ProjectName
)

$ErrorActionPreference = "Stop"
$OriginalName = "Kickstart"
$OriginalNameLower = "kickstart"
$OriginalNameUpper = "KICKSTART"

# Build ciktilari ve VCS klasorleri islenmez
$ExcludedDirs = @("node_modules", ".git", "bin", "obj", ".nuxt", ".output", ".template.config")
function Test-Excluded {
    param($fullName)
    $relative = $fullName.Substring($ScriptRoot.Length)
    foreach ($segment in ($relative -split '[\\/]')) {
        if ($ExcludedDirs -contains $segment) { return $true }
    }
    return $false
}

# --- Renk fonksiyonları ---
function Write-Step   { param($msg) Write-Host "  [*] $msg" -ForegroundColor Cyan }
function Write-Ok     { param($msg) Write-Host "  [+] $msg" -ForegroundColor Green }
function Write-Err    { param($msg) Write-Host "  [!] $msg" -ForegroundColor Red }
function Write-Warn   { param($msg) Write-Host "  [~] $msg" -ForegroundColor Yellow }

# --- Banner ---
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Magenta
Write-Host "   Kickstart Template - Otomatik Kurulum" -ForegroundColor Magenta
Write-Host "  ============================================" -ForegroundColor Magenta
Write-Host ""

# --- Proje adı al ---
if (-not $ProjectName) {
    $ProjectName = Read-Host "  Proje adini girin (ornek: MyAwesomeProject)"
}

if ([string]::IsNullOrWhiteSpace($ProjectName)) {
    Write-Err "Proje adi bos olamaz!"
    exit 1
}

# Proje adı validasyonu (-cnotmatch: Turkce kulturde "İ" gibi harfler [a-zA-Z]'ye eslesmesin)
if ($ProjectName -cnotmatch '^[a-zA-Z][a-zA-Z0-9]*$') {
    Write-Err "Proje adi harf ile baslamali ve sadece harf/rakam icermelidir."
    Write-Err "Ornek: MyProject, ECommerceApp, CRMSystem"
    exit 1
}

# Kulturden bagimsiz: Turkce Windows'ta "I".ToLower() = "ı" olur
$ProjectNameLower = $ProjectName.ToLowerInvariant()
$ProjectNameUpper = $ProjectName.ToUpperInvariant()
$ScriptRoot = $PSScriptRoot
if (-not $ScriptRoot) { $ScriptRoot = (Get-Location).Path }

Write-Host ""
Write-Step "Proje: $ProjectName"
Write-Host ""

# --- 1. Dosya icerikleri degistir ---
Write-Step "Dosya icerikleri guncelleniyor..."

$extensions = @("*.cs", "*.csproj", "*.sln", "*.json", "*.http", "*.vue", "*.ts", "*.js", "*.md", "*.css", "*.scss", "*.yml", "*.yaml", "Dockerfile", ".gitignore")
$fileCount = 0
$errorCount = 0

foreach ($ext in $extensions) {
    $files = Get-ChildItem -Path $ScriptRoot -Recurse -Filter $ext -File -Force -ErrorAction SilentlyContinue |
             Where-Object { -not (Test-Excluded $_.FullName) }

    foreach ($file in $files) {
        try {
            $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
            $hasChange = $false
            
            if ($content.Contains($OriginalName)) {
                $content = $content.Replace($OriginalName, $ProjectName)
                $hasChange = $true
            }
            if ($content.Contains($OriginalNameLower)) {
                $content = $content.Replace($OriginalNameLower, $ProjectNameLower)
                $hasChange = $true
            }
            if ($content.Contains($OriginalNameUpper)) {
                $content = $content.Replace($OriginalNameUpper, $ProjectNameUpper)
                $hasChange = $true
            }
            
            if ($hasChange) {
                $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
                [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
                $fileCount++
            }
        }
        catch {
            Write-Warn "Atlandi: $($file.Name) - $($_.Exception.Message)"
            $errorCount++
        }
    }
}

Write-Ok "$fileCount dosya guncellendi"

# --- 2. Dosya adlarini degistir (derinlikten yuzeye) ---
Write-Step "Dosya adlari guncelleniyor..."

$renamedFiles = 0
Get-ChildItem -Path $ScriptRoot -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like "*$OriginalName*" -and -not (Test-Excluded $_.FullName) } |
    Sort-Object { $_.FullName.Length } -Descending |
    ForEach-Object {
        try {
            $newName = $_.Name.Replace($OriginalName, $ProjectName)
            if ($newName -ne $_.Name) {
                Rename-Item -Path $_.FullName -NewName $newName
                $renamedFiles++
            }
        }
        catch {
            Write-Warn "Dosya yeniden adlandirilamadi: $($_.Name) - $($_.Exception.Message)"
            $errorCount++
        }
    }

Write-Ok "$renamedFiles dosya yeniden adlandirildi"

# --- 3. Klasor adlarini degistir (derinlikten yuzeye) ---
Write-Step "Klasor adlari guncelleniyor..."

$renamedDirs = 0
do {
    $changed = $false
    Get-ChildItem -Path $ScriptRoot -Recurse -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like "*$OriginalName*" -and -not (Test-Excluded $_.FullName) } |
        Sort-Object { $_.FullName.Length } -Descending |
        ForEach-Object {
            try {
                $newName = $_.Name.Replace($OriginalName, $ProjectName)
                if ($newName -ne $_.Name) {
                    Rename-Item -Path $_.FullName -NewName $newName
                    $renamedDirs++
                    $changed = $true
                }
            }
            catch {
                Write-Warn "Klasor yeniden adlandirilamadi: $($_.Name) - $($_.Exception.Message)"
                $errorCount++
            }
        }
} while ($changed)

Write-Ok "$renamedDirs klasor yeniden adlandirildi"

# --- 3b. UserSecretsId yenile (yeni proje sablonun user-secrets deposunu paylasmasin) ---
Get-ChildItem -Path $ScriptRoot -Recurse -Filter "*.csproj" -File -ErrorAction SilentlyContinue |
    Where-Object { -not (Test-Excluded $_.FullName) } |
    ForEach-Object {
        $content = [System.IO.File]::ReadAllText($_.FullName, [System.Text.Encoding]::UTF8)
        if ($content -match '<UserSecretsId>[^<]*</UserSecretsId>') {
            $content = $content -replace '<UserSecretsId>[^<]*</UserSecretsId>', "<UserSecretsId>$([guid]::NewGuid())</UserSecretsId>"
            [System.IO.File]::WriteAllText($_.FullName, $content, (New-Object System.Text.UTF8Encoding($false)))
            Write-Ok "UserSecretsId yenilendi: $($_.Name)"
        }
    }

# --- 4. Temizlik ---
Write-Step "Temizlik yapiliyor..."

# .template.config'i sil (dotnet new icin gereksiz artik)
$templateConfig = Join-Path $ScriptRoot ".template.config"
if (Test-Path $templateConfig) {
    Remove-Item -Path $templateConfig -Recurse -Force
    Write-Ok ".template.config silindi"
}

# EF Core migrations (yeni projede tek InitialCreate ile baslamak icin)
$migrationsPath = Join-Path $ScriptRoot "Backend\$ProjectName.Infrastructure\Migrations"
if (Test-Path $migrationsPath) {
    Remove-Item -Path $migrationsPath -Recurse -Force
    Write-Ok "Migrations klasoru silindi (dotnet ef migrations add InitialCreate ...)"
}

# Setup script'lerini sil
$setupFiles = @("setup.ps1", "setup.sh")
foreach ($f in $setupFiles) {
    $path = Join-Path $ScriptRoot $f
    if (Test-Path $path) {
        Remove-Item -Path $path -Force
    }
}
Write-Ok "Setup dosyalari silindi"

# --- Sonuc ---
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Green
Write-Host "   KURULUM TAMAMLANDI!" -ForegroundColor Green
Write-Host "  ============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Proje: $ProjectName" -ForegroundColor White
Write-Host "  Guncellenen dosyalar: $fileCount" -ForegroundColor White
Write-Host "  Yeniden adlandirilan: $($renamedFiles + $renamedDirs)" -ForegroundColor White
if ($errorCount -gt 0) {
    Write-Warn "Atlanilan: $errorCount (detaylar yukarda)"
}
Write-Host ""
Write-Host "  Sonraki adimlar:" -ForegroundColor Yellow
Write-Host "    1. cd Backend" -ForegroundColor White
Write-Host "    2. dotnet tool install --global dotnet-ef --version 10.0.13   (kuruluysa atla)" -ForegroundColor White
Write-Host "    3. dotnet ef migrations add InitialCreate --project $ProjectName.Infrastructure --startup-project $ProjectName.API" -ForegroundColor White
Write-Host "    4. PostgreSQL ayarin farkliysa $ProjectName.API/appsettings.Development.json'i duzenle" -ForegroundColor White
Write-Host "       (varsayilan: localhost:5432, postgres/postgres, veritabani: $ProjectName)" -ForegroundColor White
Write-Host "    5. docker run -d --name mailpit --restart unless-stopped -p 127.0.0.1:1025:1025 -p 127.0.0.1:8025:8025 axllent/mailpit:v1.31.3" -ForegroundColor White
Write-Host "       (Development e-postalari: http://localhost:8025)" -ForegroundColor White
Write-Host "    6. dotnet run --project $ProjectName.API --launch-profile http" -ForegroundColor White
Write-Host "       (veritabani ve migration'lar acilista otomatik uygulanir)" -ForegroundColor White
Write-Host ""
Write-Host "    7. cd Frontend && npm ci && npm run dev   (Node 24 LTS, en az 22.12)" -ForegroundColor White
Write-Host ""
Write-Host "  Admin giris (Development): admin@$ProjectNameLower.com / Admin123!" -ForegroundColor Cyan
Write-Host ""
