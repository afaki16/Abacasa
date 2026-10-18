FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY Abacasa.API/Abacasa.API.csproj Abacasa.API/
COPY Abacasa.Application/Abacasa.Application.csproj Abacasa.Application/
COPY Abacasa.Domain/Abacasa.Domain.csproj Abacasa.Domain/
COPY Abacasa.Infrastructure/Abacasa.Infrastructure.csproj Abacasa.Infrastructure/

RUN dotnet restore Abacasa.API/Abacasa.API.csproj

COPY . .
RUN dotnet publish Abacasa.API/Abacasa.API.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
USER $APP_UID
ENTRYPOINT ["dotnet", "Abacasa.API.dll"]
