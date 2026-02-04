# Sistema de Gerenciamento de Artistas e Álbuns (Full Stack)

Entrega técnica — PROCESSO SELETIVO CONJUNTO Nº 001/2026/SEPLAG/MT (Engenheiro da Computação Sênior).

## Visão geral

Aplicação Full Stack (Java Spring Boot + React + TypeScript) em conformidade com o edital:

- Autenticação JWT + refresh (expiração do access token em 5 min)
- Renovação automática no front (fluxo de expiração/refresh)
- Rate limit: 10 req/min por usuário autenticado (API)
- Upload múltiplo de imagens no MinIO (S3)
- Links pré‑assinados com expiração padrão de 30 min
- Paginação, busca e ordenação
- WebSocket para notificação de novo álbum
- Flyway com migrations + seed idempotente
- Swagger/OpenAPI
- Health checks (liveness/readiness)
- Entrega via Docker Compose: API + Frontend + PostgreSQL + MinIO + pgAdmin (removível)

## Roteiro de validação em 5 minutos (banca)
1) Subir a stack completa

```
docker compose up -d --build
docker compose ps
```

2) Swagger + login (JWT)

Swagger: http://localhost:3001/swagger-ui/index.html

Login:

```
curl -s -X POST "http://localhost:3001/v1/autenticacao/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```


Copie o accessToken e use como:

```
Authorization: Bearer <TOKEN>
```

3) Upload múltiplo de capas (MinIO + presigned)

Importante: o banco não guarda URL presigned. Salva apenas object_key + metadados.
A URL é gerada sob demanda em GET /v1/albuns/{id}/capas.

Upload:

```
curl -s -X POST "http://localhost:3001/v1/albuns/1/capas" \
  -H "Authorization: Bearer <TOKEN>" \
  -F "files=@./exemplos/capa1.jpg" \
  -F "files=@./exemplos/capa2.jpg"
```


Listagem (retorna presigned + expiresAt):

```
curl -s "http://localhost:3001/v1/albuns/1/capas" \
  -H "Authorization: Bearer <TOKEN>"
```


MinIO Console (ver objetos):

http://localhost:9001 (credenciais no [.env](.env))

4) Testar expiração do presigned em 60s (teste rápido)

Suba o backend com:

```
MINIO_PRESIGN_EXPIRATION_MINUTES=1
```

Gere um presigned e tente abrir após ~60s (esperado: falhar).

5) Rate limit (10/min)

Faça 11 chamadas ao mesmo endpoint dentro de 60s:

```
for i in $(seq 1 11); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    "http://localhost:3001/v1/artistas?page=0&size=1" \
    -H "Authorization: Bearer <TOKEN>";
done
```


Esperado: após exceder, retorna 429 com Retry-After.

6) WebSocket (novo álbum)

Endpoint: http://localhost:3001/ws (SockJS/STOMP)

Topic: /topic/albuns/created
Crie um álbum e verifique notificação.

7) Health checks

```
GET /actuator/health/liveness
GET /actuator/health/readiness
```

## Sumário

- Arquitetura
- Requisitos do edital
- Estrutura de dados
- Como rodar
- Variáveis de ambiente
- MinIO e presigned URLs
- Rate limit
- WebSocket
- Banco e Flyway
- Endpoints
- Testes
- Troubleshooting
- Dados do candidato

## Arquitetura

### Backend (Spring Boot)

- REST versionado em /v1
- Security: JWT + refresh token
- Rate limit com retorno 429 + Retry-After e headers informativos
- Upload múltiplo em MinIO (S3), com presigned GET de 30 min
- Flyway: migrations + seed idempotente
- WebSocket STOMP: evento “álbum criado”
- Actuator: readiness/liveness

### Frontend (React + TypeScript)

- Login obrigatório para acesso ao front
- Rotas protegidas
- Facade pattern + estado via RxJS (`BehaviorSubject`)
- Tratamento de 401/refresh e 429 (rate limit)

## Requisitos do edital (checklist)

Backend — MUST

- [x] API versionada /v1
- [x] JWT (expira em 5 min) + refresh token
- [x] Swagger/OpenAPI
- [x] Flyway (schema + seed enunciado)
- [x] Paginação / busca / ordenação (artistas/álbuns)
- [x] Upload múltiplo de imagens (álbum) via MinIO
- [x] Presigned URLs com expiração padrão de 30 min
- [x] Docker compose (API + Front + DB + MinIO)

Sênior — MUST

- [x] Health checks liveness/readiness
- [x] WebSocket (notificar novo álbum)
- [x] Rate limit 10 req/min por usuário autenticado
- [x] Sincronização de “Regionais” (import/sync com ativo)

Observação: o edital exige “várias imagens”. Este projeto implementa múltiplas capas por álbum via /capas.
Se também houver imagens por artista, os endpoints correspondentes aparecem em “Endpoints”.

## Estrutura de dados (tabelas e decisões)

Estrutura proposta das tabelas e principais decisões de modelagem adotadas.

### Tabela `usuarios`

- `id` (BIGSERIAL, PK)
- `username` (VARCHAR(50), único, obrigatório)
- `password_hash` (VARCHAR(255), obrigatório)
- `created_at`, `updated_at` (TIMESTAMP)

### Tabela `refresh_tokens`

- `id` (BIGSERIAL, PK)
- `user_id` (FK → `usuarios.id`, ON DELETE CASCADE)
- `token_hash` (VARCHAR(64), único)
- `expires_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)
- `revoked_at` (TIMESTAMPTZ, opcional)
- `replaced_by_token_hash` (VARCHAR(64), opcional)

### Tabela `artista`

- `id` (BIGSERIAL, PK)
- `nome` (VARCHAR(255), único, obrigatório)
- `tipo` (VARCHAR(20), obrigatório, default `CANTOR`)

### Tabela `album`

- `id` (BIGSERIAL, PK)
- `titulo` (VARCHAR(255), obrigatório)
- `ano` (INTEGER, opcional)

### Tabela `artista_album` (associação N:N)

- `artista_id` (FK → `artista.id`)
- `album_id` (FK → `album.id`)
- PK composta (`artista_id`, `album_id`)

### Tabela `album_imagem`

- `id` (BIGSERIAL, PK)
- `album_id` (FK → `album.id`, ON DELETE CASCADE)
- `object_key` (VARCHAR(1024), obrigatório)
- `content_type` (VARCHAR(255))
- `size_bytes` (BIGINT)
- `created_at` (TIMESTAMP)

### Tabela `artista_imagem`

- `id` (BIGSERIAL, PK)
- `artista_id` (FK → `artista.id`, ON DELETE CASCADE)
- `object_key` (VARCHAR(1024), obrigatório)
- `content_type` (VARCHAR(255))
- `size_bytes` (BIGINT)
- `created_at` (TIMESTAMP)

### Tabela `regional`

- `id` (BIGSERIAL/IDENTITY, PK)
- `external_id` (INTEGER, obrigatório)
- `nome` (VARCHAR(200), obrigatório)
- `ativo` (BOOLEAN, default TRUE)

#### Regras e índices relevantes

- Índices por foreign keys e `object_key` para desempenho em consultas de imagens.
- Para regionais: índice por `external_id` e unicidade por `external_id` ativo (apenas uma regional ativa por `external_id`).
- Seed idempotente conforme edital (artistas, álbuns e associações).

#### Decisões de modelagem

- Relação N:N entre artistas e álbuns via tabela de junção `artista_album`.
- URLs presigned não são persistidas; o banco guarda apenas `object_key` e metadados.
- Refresh tokens são armazenados em hash e suportam rotação/invalidação.
- Regionais: apenas uma regional ativa por `external_id` (índice único parcial).

## Como rodar
### Docker Compose (recomendado)

```
docker compose up -d --build
```


URLs:

- Frontend: http://localhost:5173
- Swagger: http://localhost:3001/swagger-ui/index.html
- MinIO Console: http://localhost:9001
- MinIO S3: http://localhost:9000

Credenciais:

- App: admin/admin
- MinIO: conforme [.env](.env) e [docker-compose.yml](docker-compose.yml)

### Desenvolvimento local

Backend:

```
cd Backend
mvn spring-boot:run
```


Frontend:

```
cd Frontend
npm install
npm run dev
```

## Variáveis de ambiente

Crie [.env](.env) (ou use as do compose). Mantenha [.env.example](.env.example).

Exemplo base:

```dotenv
# Backend
SPRING_PROFILES_ACTIVE=dev
SERVER_PORT=3001

# DB
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=dbmusicplayer
POSTGRES_PORT=5433
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/dbmusicplayer

# CORS (origens permitidas)
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001

# JWT
JWT_SECRET=change-me
JWT_EXPIRATION=300000
JWT_REFRESH_EXPIRATION=604800000
REFRESH_TOKEN_PEPPER=change-me

# Rate limit (edital)
RATE_LIMIT_REQUESTS_PER_WINDOW=10
RATE_LIMIT_WINDOW_SECONDS=60
RATE_LIMIT_BUCKET_EXPIRE_AFTER_SECONDS=120

# ---------- MinIO ----------
MINIO_ENDPOINT=http://localhost:9000
# Credenciais do servidor MinIO (compose)
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
# Credenciais usadas pelo backend
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=album-covers
MINIO_REGION=us-east-1
MINIO_PRESIGN_EXPIRATION_MINUTES=30
MINIO_MAX_FILE_SIZE_BYTES=5242880
MINIO_MAX_REQUEST_SIZE_BYTES=26214400

# Frontend
VITE_API_URL=http://localhost:3001/v1

```

Obs.: o WebSocket é derivado de VITE_API_URL (ex.: http://localhost:3001/ws).

## MinIO e presigned URLs
Regras de implementação (para aderência e evitar erro de banca)

✅ Banco armazena `object_key` + metadados (`content_type`, `size_bytes`, `created_at`).

❌ Não armazenar URL presigned em `album.image_url` (URL expira).

✅ GET /v1/albuns/{id}/capas gera presigned na hora, com expiração padrão de 30 min.

Bucket

Bucket padrão: `album-covers`

O bucket é criado/validado no startup (se habilitado no backend).

## Rate limit

Política do edital:

10 requisições por minuto por usuário autenticado

Comportamento esperado:

Ao exceder: HTTP 429

Headers:

`X-Rate-Limit-Limit`

`X-Rate-Limit-Remaining`

`X-Rate-Limit-Window-Seconds`

`Retry-After` (somente no 429)

## WebSocket

Endpoint SockJS/STOMP: http://localhost:3001/ws

Topic: /topic/albuns/created

## Banco e Flyway

Migrations em [Backend/src/main/resources/db/migration](Backend/src/main/resources/db/migration)

Seed do enunciado é idempotente

Para rodar manualmente:

```
cd Backend
mvn -DskipTests flyway:migrate
```

## Endpoints

### Autenticação

- POST /v1/autenticacao/login
- POST /v1/autenticacao/refresh

### Artistas

- GET /v1/artistas (paginação + busca + ordenação)
- GET /v1/artistas/{id}
- POST /v1/artistas
- PUT /v1/artistas/{id}
- DELETE /v1/artistas/{id}

### Álbuns

- GET /v1/albuns
- POST /v1/albuns
- PUT /v1/albuns/{id}
- DELETE /v1/albuns/{id} (se aplicável)

### Capas do Álbum (múltiplas)

- POST /v1/albuns/{id}/capas (multipart files[])
- GET /v1/albuns/{id}/capas (retorna presigned + expiresAt)
- DELETE /v1/albuns/{albumId}/capas/{coverId}

### Imagens do Artista

- POST /v1/artistas/{artistaId}/imagens (multipart files[])
- GET /v1/artistas/{artistaId}/imagens (retorna presigned + expiresAt)
- DELETE /v1/artistas/{artistaId}/imagens/{imageId}

### Regionais (Sênior)

- GET /v1/regionais
- POST /v1/regionais/sync

Exemplo (banca) — sincronização

Request (sem payload):

```
curl -s -X POST "http://localhost:3001/v1/regionais/sync" \
  -H "Authorization: Bearer <TOKEN>"
```

Resposta esperada (exemplo):

```
{"inserted":2,"inactivated":1,"changed":3}
```

SQL de validação (PostgreSQL):

```
-- total e status de regionais
SELECT
  COUNT(*) AS total,
  SUM(CASE WHEN ativo THEN 1 ELSE 0 END) AS ativas,
  SUM(CASE WHEN NOT ativo THEN 1 ELSE 0 END) AS inativas
FROM regionais;

-- conferir registros por external_id
SELECT external_id, nome, ativo, updated_at
FROM regionais
ORDER BY external_id;
```

## Testes

### Backend

```
cd Backend
mvn test
```

### Frontend

```
cd Frontend
npm test
```

## Troubleshooting
1) Imagens não carregam no frontend

Possíveis causas e correções:

- URL presigned armazenada no banco e expirada.
  ✅ Solução: não persistir presigned; gere sob demanda via GET /v1/albuns/{id}/capas (expiração padrão de 30 min, conforme edital).

- CORS bloqueando acesso ao MinIO.
  ✅ Solução: configurar CORS do backend e permitir que o navegador acesse o presigned diretamente no MinIO.

2) Presigned inválido por horário incorreto do container

Links presigned dependem de X-Amz-Date. Desvios grandes de horário invalidam o link.
✅ Solução: garantir horário correto no host/containers (ambiente Docker padrão costuma ser suficiente).

3) HTTP 429 (rate limit)

O edital exige 10 req/min por usuário autenticado. Ao exceder, a API retorna 429 + Retry-After.
✅ Solução: tratar 429 como estado de UI (toast/banner) e evitar “fan-out” (chamadas múltiplas por item).

4) Upload multipart falha

Limites:
- max-file-size: limite por arquivo
- max-request-size: limite total da requisição

✅ Solução: ajustar os limites (ex.: 25MB) e validar no backend.

## Dados do candidato

Nome: Douglas Rohden

E-mail: rohdendouglas@gmail.com