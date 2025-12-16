# Etapa 1: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copiar el archivo de proyecto y restaurar dependencias
COPY ["ComedorSalaApi.csproj", "./"]
RUN dotnet restore "ComedorSalaApi.csproj"

# Copiar el resto del código fuente
COPY . .

# Build del proyecto
RUN dotnet build "ComedorSalaApi.csproj" -c Release -o /app/build

# Etapa 2: Publish
FROM build AS publish
RUN dotnet publish "ComedorSalaApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Etapa 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Instalar SQL Server tools para healthcheck
USER root
RUN apt-get update && apt-get install -y curl

# Copiar archivos publicados
COPY --from=publish /app/publish .

# Copiar script de inicio
COPY docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 5001

ENTRYPOINT ["/app/docker-entrypoint.sh"]
