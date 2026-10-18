# Kickstart - Clean Architecture .NET 10 + Nuxt 3 Template

.NET 10 Web API + Nuxt.js 3 fullstack proje template'i. İki farklı yöntemle yeni proje oluşturabilirsiniz.

## Proje Yapısı

```
YourProject/
├── Backend/
│   ├── YourProject.API/            # .NET 10 Web API
│   ├── YourProject.Application/    # CQRS + MediatR + FluentValidation
│   ├── YourProject.Domain/         # Entity & Interface'ler
│   ├── YourProject.Infrastructure/ # EF Core, JWT, Repository
│   └── YourProject.sln
├── Frontend/                       # Nuxt.js 3 + Vuetify + Pinia
│   ├── components/
│   ├── composables/
│   ├── pages/
│   ├── stores/
│   └── package.json
└── .template.config/              # dotnet new template config
```

---

## Quick Start (New Project)

GitHub "Use this template" → Clone → Run setup.sh (Linux/Mac) or setup.ps1 (Windows) → setup creates your project name automatically.

```bash
git clone https://github.com/YOUR_USER/YOUR_PROJECT.git
cd YOUR_PROJECT
./setup.sh    # or setup.ps1 on Windows
```

### Yöntem 1: GitHub "Use this template" (Kolay)

1. Bu sayfanın üstündeki yeşil **"Use this template"** → **"Create a new repository"** butonuna tıklayın
2. Repository adını girin (örnek: `ECommerceApp`)
3. Oluşan repoyu klonlayın:
   ```bash
   git clone https://github.com/KULLANICI/ECommerceApp.git
   cd ECommerceApp
   ```
4. Setup script'ini çalıştırın:

   **Windows (PowerShell):**
   ```powershell
   .\setup.ps1
   # veya parametre ile:
   .\setup.ps1 -ProjectName ECommerceApp
   ```

   **macOS / Linux:**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   # veya parametre ile:
   ./setup.sh ECommerceApp
   ```

5. Script tüm namespace'leri, dosya adlarını, config'leri otomatik değiştirir ve kendini siler.

---

## Local Development Setup

1. Backend klasörüne geçin ve EF Core aracını kurun (kuruluysa atlayın):
   ```bash
   cd Backend
   dotnet tool install --global dotnet-ef --version 10.0.13
   ```

2. Create initial migration (setup script'i mevcut migration'ları siler):
   ```bash
   dotnet ef migrations add InitialCreate \
     --project YOUR_PROJECT.Infrastructure \
     --startup-project YOUR_PROJECT.API
   ```

3. `Backend/YOUR_PROJECT.API/appsettings.Development.json` dosyasını kontrol edin. Setup sonrası aşağıdaki değerler otomatik doldurulur; PostgreSQL ayarınız farklıysa düzenleyin:
   - `ConnectionStrings:DefaultConnection` — yerel PostgreSQL bağlantısı (varsayılan: `localhost:5432`, `postgres/postgres`, veritabanı: proje adı)
   - `JwtSettings:SecretKey` — geliştirme için yerel secret

4. E-posta (Mailpit): Development'ta e-postalar gerçek SMTP'ye değil, yerel Mailpit'e gider (`appsettings.Development.json` → `NotificationService:Mail`):
   ```bash
   docker run -d --name mailpit --restart unless-stopped -p 127.0.0.1:1025:1025 -p 127.0.0.1:8025:8025 axllent/mailpit:v1.31.3
   ```
   Gelen kutusu: http://localhost:8025

   > user-secrets'ta `NotificationService:Mail:*` anahtarları varsa bu ayarı ezer ve e-postalar gerçek SMTP'ye gider. Kaldırın:
   > `dotnet user-secrets remove "NotificationService:Mail:Host" --project YOUR_PROJECT.API` (Username, Password, FromAddress, FromName için de)

5. Run the application — migrations will be applied automatically on startup:
   ```bash
   dotnet run --project YOUR_PROJECT.API --launch-profile http
   ```

   > **Note:** Auto migration runs on startup. The first run after `InitialCreate` will create all tables automatically. No need to run `dotnet ef database update` manually.

6. Frontend (Node 24 LTS, en az 22.12):
   ```bash
   cd Frontend
   npm ci
   npm run dev
   ```

---

## Varsayılan Seed Data

| Veri | Detay |
|------|-------|
| Admin Kullanıcı | `admin@<proje-adi>.com` / `Admin123!` |
| Roller | Admin (tüm yetkiler) |
| Yetkiler | CRUD izinleri (Users, Roles, Tenants, Permissions) |
| Tenant'lar | Default Tenant + Demo Tenant |

---

## Configuration

| Setting | Development | Staging | Production |
|---------|------------|---------|------------|
| Source | appsettings.Development.json | env vars + appsettings.Staging.json | env vars + appsettings.Production.json |
| JWT Secret | hardcoded (local only) | env var: `JWT_SECRET_*_TEST` | env var: `JWT_SECRET_*_PROD` |
| DB Connection | hardcoded localhost | env var | env var |
| CORS Origins | localhost:3000 | empty (set in Staging.json) | empty (set in Production.json) |

> **Önemli:** Production/Staging'de tüm secret'lar environment variable olarak inject edilir.

---

## Production Deployment

See `yeni_proje_deploy_rehberi.docx` for full VPS setup.

### Required Environment Variables (in `/opt/services/.env` on VPS)

```bash
# JWT secrets (generate with: openssl rand -base64 48)
JWT_SECRET_YOURPROJECT_PROD=<min 32 chars>
JWT_SECRET_YOURPROJECT_TEST=<min 32 chars>

# Shared PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<strong password>

# SMTP
SMTP_HOST_YOURPROJECT=smtp.gmail.com
SMTP_USER_YOURPROJECT=user@gmail.com
SMTP_PASS_YOURPROJECT=<app password>
SMTP_FROM_YOURPROJECT=noreply@yourdomain.com

# Initial admin user passwords (only required on first deploy when DB is empty)
# Min 8 chars. Generate with: openssl rand -base64 16
# Remove from .env after first successful deploy.
INITIAL_SUPERADMIN_PASSWORD_YOURPROJECT_PROD=<min 8 chars>
INITIAL_ADMIN_PASSWORD_YOURPROJECT_PROD=<min 8 chars>
INITIAL_SUPERADMIN_PASSWORD_YOURPROJECT_TEST=<min 8 chars>
INITIAL_ADMIN_PASSWORD_YOURPROJECT_TEST=<min 8 chars>
```

| Variable | Purpose |
|----------|---------|
| `INITIAL_SUPERADMIN_PASSWORD_*` | Initial superadmin password for first deploy. Min 8 chars. Generate with `openssl rand -base64 16`. Remove from .env after first successful deploy. |
| `INITIAL_ADMIN_PASSWORD_*` | Initial admin password. Same rules. |
| `API_BASE_URL` (Frontend) | Frontend'in çağırdığı API adresi; production build/run ortamında verilmeli (ör. `https://api.yourdomain.com`). Verilmezse yerel geliştirme varsayılanı `http://localhost:5156` kullanılır. CSP `connect-src` de bu değerden üretilir. |

### Required GitHub Secrets (Repo → Settings → Secrets → Actions)

- `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` — SSH deploy step için (derived project'te eklenmeli)

### docker-compose.example.yml

`docker-compose.example.yml` dosyası, `/opt/services/docker-compose.yml`'e eklenecek servis bloklarını içerir.

---

## Migrations

The project uses EF Core with **auto-migration on startup**. When you push a new migration to the repository, the production container will apply it automatically on next deploy.

```
Startup sequence:
1. MigrateAsync()         → pending migration'ları uygula (tablolar)
2. SeedAsyncIfEmpty()     → initial admin user, roles, permissions
3. SeedPermissionsAsync() → yeni permission'ları ekle
```

### New Migration

```bash
dotnet ef migrations add MigrationName \
  --project YOUR_PROJECT.Infrastructure \
  --startup-project YOUR_PROJECT.API
```

Migration dosyalarını git'e commit edin. Container bir sonraki başlatmada otomatik uygular.

> **Not:** Migrations klasörü boşsa `MigrateAsync()` crash etmez, sessizce geçer. Bu, setup sonrası ilk run için beklenen davranıştır.

---

## Initial Admin User

On first deployment to a fresh database, the application seeds two admin users:
- **SuperAdmin** (cross-tenant access)
- **Admin** (default tenant)

**Development:** Default passwords are used (`SuperAdmin123!` / `Admin123!`). An info log is written on startup; see logs on first run.

**Staging/Production:** Passwords MUST be provided via environment variables:
- `INITIAL_SUPERADMIN_PASSWORD`
- `INITIAL_ADMIN_PASSWORD`

If env vars are not set or are shorter than 8 characters, admin users will NOT be seeded — a warning is logged and you'll need to create them manually via SQL or a one-time migration. Roles, permissions, and tenants are still seeded.

**Best practice:** Set these env vars in `/opt/services/.env` on the first deploy, verify admin login works, then unset them. They're only needed on a fresh DB.

---

## Neler Dahil?

### Backend (.NET 10)
- Clean Architecture (API → Application → Domain → Infrastructure)
- CQRS + MediatR pattern
- JWT Authentication + Refresh Token
- RBAC + Permission sistemi
- Multi-tenancy desteği
- FluentValidation + AutoMapper
- Entity Framework Core + PostgreSQL
- Serilog structured logging
- Auto migration on startup
- Configuration validation (eksik secret'larda açık hata)

### Frontend (Nuxt.js 3)
- Vuetify 3 UI framework
- Pinia state management
- Composable-based CRUD architecture
- VeeValidate + Yup form validation
- JWT token management + auto refresh
- Permission-based route guards
- Responsive admin panel layout

## Sistem Gereksinimleri

- .NET 10.0 SDK
- Node 24 LTS (en az 22.12)
- PostgreSQL 14+
- dotnet-ef tool (`dotnet tool install --global dotnet-ef`)
- Docker (production deploy için)
