#!/usr/bin/env sh
set -eu

cd /workspace

echo "[dev] Starting Spring Boot (profile: ${SPRING_PROFILES_ACTIVE:-dev})"

# Run the app (must not fork, otherwise DevTools restart won't work reliably)
mvn -DskipTests -Dspring-boot.run.fork=false spring-boot:run &
app_pid=$!

echo "[dev] App PID: ${app_pid}"

after_cleanup() {
  echo "[dev] Stopping app..."
  kill "${app_pid}" 2>/dev/null || true
  wait "${app_pid}" 2>/dev/null || true
}
trap after_cleanup INT TERM

# Poll source tree and re-compile when it changes.
# This is needed because in Docker we don't have an IDE doing continuous compilation.
last_hash=""
while kill -0 "${app_pid}" 2>/dev/null; do
  current_hash=$(find src/main -type f -print0 2>/dev/null \
    | xargs -0 sha1sum 2>/dev/null \
    | sha1sum \
    | awk '{print $1}')

  if [ "${current_hash}" != "${last_hash}" ]; then
    if [ -n "${last_hash}" ]; then
      echo "[dev] Change detected. Recompiling..."
      mvn -q -DskipTests compile || true
      echo "[dev] Compile done. DevTools should restart if needed."
    fi
    last_hash="${current_hash}"
  fi

  sleep 1
done

after_cleanup
