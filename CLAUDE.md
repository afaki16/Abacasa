# Abacasa
- Sadece istenen değişikliği yap; ekstra geliştirme veya refactor yapma.
- Backend değişikliğinden sonra Backend klasöründe `dotnet build` çalıştır ve hatasız olduğunu doğrula.
- Frontend değişikliğinden sonra Frontend klasöründe `npm run build` çalıştır.
- Yapı: .NET Clean Architecture (API / Application / Domain / Infrastructure), Nuxt 3 SPA (ssr: false), PostgreSQL.
- Git işlemi (commit, branch, push, stash) yapma; bunları kullanıcı yönetiyor.
