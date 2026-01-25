@echo off
setlocal

rem Use env vars if present, otherwise fallback to defaults
set "DB=%POSTGRES_DB%"
if "%DB%"=="" set "DB=dbmusicplayer"
set "USER=%POSTGRES_USER%"
if "%USER%"=="" set "USER=postgres"
set "PASSWORD=%POSTGRES_PASSWORD%"
if "%PASSWORD%"=="" set "PASSWORD=postgres"
set "PORT=%POSTGRES_PORT%"
if "%PORT%"=="" set "PORT=5433"

echo ✅ Garantindo que o serviço Postgres esteja em execução...
docker compose up -d db

echo ⏳ Aguardando Postgres ficar pronto...
docker compose exec db sh -c "until pg_isready -U %USER% -p %PORT%; do sleep 1; done"

echo 🔎 Verificando se o banco de dados "%DB%" existe...
rem Captura resultado em arquivo temporário
docker compose exec db psql -U %USER% -p %PORT% -tAc "SELECT 1 FROM pg_database WHERE datname = '%DB%';" > "%TEMP%\db_exist.txt" 2>nul
set /p DB_EXISTS=<"%TEMP%\db_exist.txt"
del "%TEMP%\db_exist.txt" 2>nul

if "%DB_EXISTS%"=="1" (
    echo ✅ Database "%DB%" já existe.
) else (
    echo ➕ Criando database "%DB%"...
    docker compose exec db psql -U %USER% -p %PORT% -c "CREATE DATABASE \"%DB%\";"
)

echo 🧹 Executando Flyway repair (ajuste de checksums)...
docker compose run --rm --entrypoint sh backend -c "mvn -DskipTests -Dflyway.baselineOnMigrate=true -Dflyway.baselineVersion=0 -Dflyway.url=jdbc:postgresql://db:%PORT%/%DB% -Dflyway.user=%USER% -Dflyway.password=%PASSWORD% -Dflyway.outOfOrder=true flyway:repair"

echo 🚀 Executando as migrations via Flyway (Maven)...
docker compose run --rm --entrypoint sh backend -c "mvn -DskipTests -Dflyway.baselineOnMigrate=true -Dflyway.baselineVersion=0 -Dflyway.url=jdbc:postgresql://db:%PORT%/%DB% -Dflyway.user=%USER% -Dflyway.password=%PASSWORD% -Dflyway.outOfOrder=true flyway:migrate"

endlocal