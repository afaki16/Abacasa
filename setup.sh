#!/bin/bash
# ============================================
#  Kickstart Template - Setup Script
#  macOS / Linux (Bash 4+)
# ============================================

set -e

# Kulturden bagimsiz harf donusumu ve [a-zA-Z] eslesmesi (Turkce locale'de I/i sorunu olmasin)
export LC_ALL=C

ORIGINAL_NAME="Kickstart"
ORIGINAL_NAME_LOWER="kickstart"
ORIGINAL_NAME_UPPER="KICKSTART"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- Renk kodlari ---
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
NC='\033[0m'

step()  { echo -e "  ${CYAN}[*]${NC} $1"; }
ok()    { echo -e "  ${GREEN}[+]${NC} $1"; }
err()   { echo -e "  ${RED}[!]${NC} $1"; }
warn()  { echo -e "  ${YELLOW}[~]${NC} $1"; }

# --- Banner ---
echo ""
echo -e "  ${MAGENTA}============================================${NC}"
echo -e "  ${MAGENTA} Kickstart Template - Otomatik Kurulum${NC}"
echo -e "  ${MAGENTA}============================================${NC}"
echo ""

# --- Proje adi al ---
PROJECT_NAME="${1:-}"

if [ -z "$PROJECT_NAME" ]; then
    read -p "  Proje adini girin (ornek: MyAwesomeProject): " PROJECT_NAME
fi

if [ -z "$PROJECT_NAME" ]; then
    err "Proje adi bos olamaz!"
    exit 1
fi

# Validasyon
if ! [[ "$PROJECT_NAME" =~ ^[a-zA-Z][a-zA-Z0-9]*$ ]]; then
    err "Proje adi harf ile baslamali ve sadece harf/rakam icermelidir."
    err "Ornek: MyProject, ECommerceApp, CRMSystem"
    exit 1
fi

PROJECT_NAME_LOWER=$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]')
PROJECT_NAME_UPPER=$(echo "$PROJECT_NAME" | tr '[:lower:]' '[:upper:]')

# Build ciktilari ve VCS klasorleri islenmez
EXCLUDES=(-not -path "*/.git/*" -not -path "*/node_modules/*" -not -path "*/.template.config/*"
          -not -path "*/bin/*" -not -path "*/obj/*" -not -path "*/.nuxt/*" -not -path "*/.output/*")

echo ""
step "Proje: $PROJECT_NAME"
echo ""

# --- 1. Dosya icerikleri degistir ---
step "Dosya icerikleri guncelleniyor..."

file_count=0
error_count=0

find "$SCRIPT_DIR" -type f \( \
    -name "*.cs" -o -name "*.csproj" -o -name "*.sln" -o -name "*.json" -o \
    -name "*.http" -o -name "*.vue" -o -name "*.ts" -o -name "*.js" -o \
    -name "*.md" -o -name "*.css" -o -name "*.scss" -o \
    -name "*.yml" -o -name "*.yaml" -o -name "Dockerfile" -o -name ".gitignore" \
\) "${EXCLUDES[@]}" | while read -r file; do
    if grep -q "$ORIGINAL_NAME\|$ORIGINAL_NAME_LOWER\|$ORIGINAL_NAME_UPPER" "$file" 2>/dev/null; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS (BSD sed)
            sed -i '' "s/${ORIGINAL_NAME}/${PROJECT_NAME}/g" "$file" 2>/dev/null || true
            sed -i '' "s/${ORIGINAL_NAME_LOWER}/${PROJECT_NAME_LOWER}/g" "$file" 2>/dev/null || true
            sed -i '' "s/${ORIGINAL_NAME_UPPER}/${PROJECT_NAME_UPPER}/g" "$file" 2>/dev/null || true
        else
            # Linux (GNU sed)
            sed -i "s/${ORIGINAL_NAME}/${PROJECT_NAME}/g" "$file" 2>/dev/null || true
            sed -i "s/${ORIGINAL_NAME_LOWER}/${PROJECT_NAME_LOWER}/g" "$file" 2>/dev/null || true
            sed -i "s/${ORIGINAL_NAME_UPPER}/${PROJECT_NAME_UPPER}/g" "$file" 2>/dev/null || true
        fi
        file_count=$((file_count + 1))
    fi
done

ok "Dosya icerikleri guncellendi"

# --- 2. Dosya adlarini degistir ---
step "Dosya adlari guncelleniyor..."

renamed_files=0
find "$SCRIPT_DIR" -depth -type f -name "*${ORIGINAL_NAME}*" \
    "${EXCLUDES[@]}" | while read -r filepath; do
    dir=$(dirname "$filepath")
    base=$(basename "$filepath")
    newbase="${base//${ORIGINAL_NAME}/${PROJECT_NAME}}"
    if [ "$base" != "$newbase" ]; then
        mv "$filepath" "$dir/$newbase" 2>/dev/null || {
            warn "Dosya yeniden adlandirilamadi: $base"
        }
        renamed_files=$((renamed_files + 1))
    fi
done

ok "Dosya adlari guncellendi"

# --- 3. Klasor adlarini degistir ---
step "Klasor adlari guncelleniyor..."

renamed_dirs=0
# Birden fazla kez calistir (ic ice klasorler icin)
for i in 1 2 3; do
    find "$SCRIPT_DIR" -depth -type d -name "*${ORIGINAL_NAME}*" \
        "${EXCLUDES[@]}" 2>/dev/null | while read -r dirpath; do
        parent=$(dirname "$dirpath")
        base=$(basename "$dirpath")
        newbase="${base//${ORIGINAL_NAME}/${PROJECT_NAME}}"
        if [ "$base" != "$newbase" ]; then
            mv "$dirpath" "$parent/$newbase" 2>/dev/null || {
                warn "Klasor yeniden adlandirilamadi: $base"
            }
            renamed_dirs=$((renamed_dirs + 1))
        fi
    done
done

ok "Klasor adlari guncellendi"

# --- 3b. UserSecretsId yenile (yeni proje sablonun user-secrets deposunu paylasmasin) ---
new_guid() {
    if command -v uuidgen >/dev/null 2>&1; then
        uuidgen | tr '[:upper:]' '[:lower:]'
    elif [ -r /proc/sys/kernel/random/uuid ]; then
        cat /proc/sys/kernel/random/uuid
    else
        od -An -tx1 -N16 /dev/urandom | tr -d ' \n' | sed -E 's/^(.{8})(.{4})(.{4})(.{4})(.{12})$/\1-\2-\3-\4-\5/'
    fi
}
find "$SCRIPT_DIR" -type f -name "*.csproj" "${EXCLUDES[@]}" | while read -r csproj; do
    if grep -q "<UserSecretsId>" "$csproj"; then
        guid=$(new_guid)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s#<UserSecretsId>[^<]*</UserSecretsId>#<UserSecretsId>${guid}</UserSecretsId>#" "$csproj"
        else
            sed -i "s#<UserSecretsId>[^<]*</UserSecretsId>#<UserSecretsId>${guid}</UserSecretsId>#" "$csproj"
        fi
        ok "UserSecretsId yenilendi: $(basename "$csproj")"
    fi
done

# --- 4. Temizlik ---
step "Temizlik yapiliyor..."

# .template.config'i sil
if [ -d "$SCRIPT_DIR/.template.config" ]; then
    rm -rf "$SCRIPT_DIR/.template.config"
    ok ".template.config silindi"
fi

# EF Core migrations (yeni projede tek InitialCreate ile baslamak icin)
MIGRATIONS_DIR="$SCRIPT_DIR/Backend/$PROJECT_NAME.Infrastructure/Migrations"
if [ -d "$MIGRATIONS_DIR" ]; then
    rm -rf "$MIGRATIONS_DIR"
    ok "Migrations klasoru silindi (dotnet ef migrations add InitialCreate ...)"
fi

# Setup script'lerini sil
rm -f "$SCRIPT_DIR/setup.ps1" 2>/dev/null || true

# Kendini sil (en son)
SELF="$SCRIPT_DIR/setup.sh"

echo ""
echo -e "  ${GREEN}============================================${NC}"
echo -e "  ${GREEN} KURULUM TAMAMLANDI!${NC}"
echo -e "  ${GREEN}============================================${NC}"
echo ""
echo -e "  ${WHITE}Proje: $PROJECT_NAME${NC}"
echo ""
echo -e "  ${YELLOW}Sonraki adimlar:${NC}"
echo -e "  ${WHITE}  1. cd Backend${NC}"
echo -e "  ${WHITE}  2. dotnet tool install --global dotnet-ef --version 10.0.13   (kuruluysa atla)${NC}"
echo -e "  ${WHITE}  3. dotnet ef migrations add InitialCreate --project $PROJECT_NAME.Infrastructure --startup-project $PROJECT_NAME.API${NC}"
echo -e "  ${WHITE}  4. PostgreSQL ayarin farkliysa $PROJECT_NAME.API/appsettings.Development.json'i duzenle${NC}"
echo -e "  ${WHITE}     (varsayilan: localhost:5432, postgres/postgres, veritabani: $PROJECT_NAME)${NC}"
echo -e "  ${WHITE}  5. docker run -d --name mailpit --restart unless-stopped -p 127.0.0.1:1025:1025 -p 127.0.0.1:8025:8025 axllent/mailpit:v1.31.3${NC}"
echo -e "  ${WHITE}     (Development e-postalari: http://localhost:8025)${NC}"
echo -e "  ${WHITE}  6. dotnet run --project $PROJECT_NAME.API --launch-profile http${NC}"
echo -e "  ${WHITE}     (veritabani ve migration'lar acilista otomatik uygulanir)${NC}"
echo ""
echo -e "  ${WHITE}  7. cd Frontend && npm ci && npm run dev   (Node 24 LTS, en az 22.12)${NC}"
echo ""
echo -e "  ${CYAN}Admin giris (Development): admin@${PROJECT_NAME_LOWER}.com / Admin123!${NC}"
echo ""

# Kendini sil
rm -f "$SELF" 2>/dev/null || true
