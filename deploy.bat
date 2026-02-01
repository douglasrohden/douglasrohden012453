@echo off
setlocal enabledelayedexpansion

REM Deploy script for Windows
REM - Builds the Frontend (Vite)
REM - Copies built assets to /dist at repo root
REM - Builds and starts containers using docker-compose.prod.yml

cd /d %~dp0

echo [1/4] Building Frontend...
pushd Frontend
call npm install
if errorlevel 1 goto :error
call npm run build:no-check
if errorlevel 1 goto :error
popd

echo [2/4] Copying build assets to dist/...
if exist dist rmdir /s /q dist
xcopy /E /I /Y Frontend\dist dist >nul
if errorlevel 1 goto :error

echo [3/4] Starting Docker containers...

if /I "%RESET_DB%"=="1" (
  echo RESET_DB=1 set. Removing containers and volumes...
  docker compose version >nul 2>&1
  if %errorlevel%==0 (
    docker compose -f docker-compose.yml -f docker-compose.prod.yml down -v --remove-orphans
  ) else (
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml down -v --remove-orphans
  )
  if errorlevel 1 goto :error
)

docker compose version >nul 2>&1
if %errorlevel%==0 (
  docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
) else (
  docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
)
if errorlevel 1 goto :error

echo [4/4] Services status:
docker compose version >nul 2>&1
if %errorlevel%==0 (
  docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
) else (
  docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
)

echo.
echo Deploy completed.
exit /b 0

:error
echo.
echo Deploy failed with exit code %errorlevel%.
exit /b %errorlevel%
