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
- Flyway com migrations + seed que pode rodar mais de uma vez sem duplicar dados
- Swagger/OpenAPI
- Health checks (liveness/readiness)
- Entrega via Docker Compose: API + Frontend + PostgreSQL + MinIO + pgAdmin (removível)

## Sumário

- [Arquitetura](#arquitetura)
- [Requisitos do edital](#requisitos-do-edital-checklist)
- [Estrutura de dados](#estrutura-de-dados-tabelas-e-decisões)
- [Como rodar](#como-rodar)
- [MinIO e presigned URLs](#minio-e-presigned-urls)
- [Estratégia segura de tokens](#estratégia-segura-de-tokens)
- [Rate limit](#rate-limit)
- [WebSocket](#websocket)
- [Banco e Flyway](#banco-e-flyway)
- [Endpoints](#endpoints)
- [Testes](#testes)
- [Troubleshooting](#troubleshooting)
- [Dados do candidato](#dados-do-candidato)

## Como rodar

### Clonar repositório

Clone o repositório oficial e entre na pasta do projeto:

```
git clone https://github.com/douglasrohden/douglasrohden012453.git
cd douglasrohden012453
```

### Docker Compose (recomendado)

### Pré-requisito: configurar variáveis de ambiente

```bash
cp .env.example .env
# edite .env e defina JWT_SECRET (obrigatório)
```

### Subir a stack

```bash
docker compose up -d --build
docker compose ps
```

### URLs de Acesso

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost:5173 | Interface React da aplicação |
| **Backend API** | http://localhost:3001/v1 | API REST versionada |
| **Swagger UI** | http://localhost:3001/swagger-ui/index.html | Documentação interativa da API |
| **Health (Liveness)** | http://localhost:3001/actuator/health/liveness | Health check de liveness (Spring Actuator) |
| **Health (Readiness)** | http://localhost:3001/actuator/health/readiness | Health check de readiness (Spring Actuator) |
| **MinIO Console** | http://localhost:9001 | Interface administrativa do MinIO |
| **MinIO S3 API** | http://localhost:9000 | Endpoint S3 para upload/download |
| **pgAdmin** | http://localhost:5050 | Interface de gerenciamento PostgreSQL |
| **PostgreSQL** | localhost:5433 | Banco de dados (conexão direta) |

### Credenciais de Acesso

| Serviço | Usuário/Email | Senha | Observações |
|---------|---------------|-------|-------------|
| **Aplicação (Login)** | `admin` | `admin` | Usuário padrão criado pelo seed |
| **MinIO Console** | `minioadmin` | `minioadmin123` | Acesse em http://localhost:9001 |
| **MinIO S3 (Backend)** | `minioadmin` | `minioadmin123` | Credenciais usadas pela API |
| **pgAdmin** | `admin@example.com` | `admin` | Acesse em http://localhost:5050 |
| **PostgreSQL** | `postgres` | `postgres` | Banco: `dbmusicplayer` na porta 5433 |

> [!TIP]
> As credenciais podem ser personalizadas através do arquivo `.env`. Veja [.env.example](.env.example) para referência.
> Para subir a stack, defina `JWT_SECRET` no ambiente (ex.: `.env`).

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

## Roteiro de validação

Checklist curto:

1. Subir a stack

```bash
docker compose up -d --build
docker compose ps
```

1. Swagger

<http://localhost:3001/swagger-ui/index.html>

1. Login + testar token (PowerShell)

```powershell
$resp = curl.exe -s -X POST "http://localhost:3001/v1/autenticacao/login" -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin\"}" -c cookies.txt | ConvertFrom-Json
$TOKEN = $resp.accessToken
curl.exe -s "http://localhost:3001/v1/artistas?page=0&size=1" -H "Authorization: Bearer $TOKEN"
```

1. Refresh

```powershell
curl.exe -s -X POST "http://localhost:3001/v1/autenticacao/refresh" -b cookies.txt
```

1. Upload 2 capas + listar presigned (troque os caminhos)

```powershell
curl.exe -s -X POST "http://localhost:3001/v1/albuns/1/capas" -H "Authorization: Bearer $TOKEN" -F "files=@C:\\caminho\\capa1.jpg" -F "files=@C:\\caminho\\capa2.jpg"
curl.exe -s "http://localhost:3001/v1/albuns/1/capas" -H "Authorization: Bearer $TOKEN"
```

MinIO Console: <http://localhost:9001>

1. Rate limit (esperado: 429)

```powershell
1..11 | ForEach-Object { curl.exe -s -o NUL -w "%{http_code}\n" "http://localhost:3001/v1/artistas?page=0&size=1" -H "Authorization: Bearer $TOKEN" }
```

1. WebSocket (manual): <http://localhost:3001/ws> (topic `/topic/albuns/created`) — crie um álbum no Swagger (`POST /v1/albuns`) e veja a notificação no Frontend.

1. Health

```powershell
curl.exe -s "http://localhost:3001/actuator/health/liveness"
curl.exe -s "http://localhost:3001/actuator/health/readiness"
```

## Arquitetura

### Backend (Spring Boot)

- REST versionado em /v1
- Security: JWT + refresh token
- Rate limit com retorno 429 + Retry-After e headers informativos
- Upload múltiplo em MinIO (S3), com presigned GET de 30 min
- Flyway: migrations + seed que pode rodar mais de uma vez sem duplicar dados
- WebSocket STOMP: evento “álbum criado”
- Actuator: readiness/liveness

### Frontend (React + TypeScript)

- Login obrigatório para acesso ao front
- Rotas protegidas
- Facade pattern + estado via RxJS (`BehaviorSubject`)
- Tratamento de 401/refresh e 429 (rate limit)

## Requisitos do edital (checklist)

### ✅ Checklist do Edital — Backend (Obrigatório)

- [x] a) Segurança (CORS / Origem)
  - [x] Restringe chamadas por origem (sem `*`)
  - [x] Em dev: permite `localhost` (se necessário)
  - [x] Em produção: permite somente o domínio do Front via env (`CORS_ALLOWED_ORIGINS`)
- [x] b) Autenticação JWT
  - [x] JWT implementado
  - [x] Access token expira em 5 minutos
  - [x] Refresh token + endpoint de refresh
- [x] c) Verbos HTTP mínimos
  - [x] GET
  - [x] POST
  - [x] PUT
- [x] d) Paginação (Álbuns)
  - [x] Paginação na consulta de álbuns (`page`, `size`)
- [x] e) Álbuns por Cantores/Bandas (consultas parametrizadas)
  - [x] Exposição de álbuns por cantores/bandas
  - [x] Consultas parametrizadas (filtros por artista/tipo/relacionamento)
- [x] f) Busca por nome do artista + ordenação
  - [x] Consulta por nome do artista
  - [x] Ordenação alfabética asc/desc
- [x] g) Upload de capas (múltiplas imagens)
  - [x] Upload de uma ou mais imagens (multipart)
  - [x] Validação de tipo (`image/*` / allowlist) e tamanho máximo
- [x] h) Armazenamento no MinIO (S3)
  - [x] Imagens armazenadas no MinIO (API compatível S3)
  - [x] Bucket configurável via env (`MINIO_BUCKET`)
- [x] i) Presigned URL (30 min)
  - [x] Recuperação de imagens via links pré-assinados
  - [x] Expiração padrão de 30 min (configurável via env, default 30)
- [x] j) Versionamento de endpoints
  - [x] Endpoints versionados (ex.: `/v1/...`)
- [x] k) Flyway Migrations
  - [x] Criação de tabelas via Flyway
  - [x] Seed via Flyway
- [x] l) OpenAPI/Swagger
  - [x] Endpoints documentados com OpenAPI/Swagger
  - [x] Segurança Bearer JWT no Swagger

### ✅ Checklist do Edital — Frontend (Obrigatório)

- [x] a) Tela Inicial — Listagem de Artistas
  - [x] Lista de artistas
  - [x] Cards/tabela responsiva (nome + nº de álbuns)
  - [x] Busca por nome
  - [x] Ordenação asc/desc
  - [x] Paginação
- [x] b) Tela de Detalhamento do Artista
  - [x] Exibe álbuns associados ao artista
  - [x] Exibe informações completas incluindo capas
  - [x] Estado vazio quando não houver álbuns
- [x] c) Tela de Cadastro/Edição
  - [x] Formulário para inserir artistas
  - [x] Formulário para adicionar álbuns a um artista
  - [x] Edição de registros (artista e/ou álbum)
  - [x] Upload de capas (via endpoints com MinIO)
- [x] d) Autenticação
  - [x] Acesso ao front exige login
  - [x] Autenticação JWT consumindo endpoint
  - [x] Expiração/renovação: no boot (se houver refresh), em 401 (sem loop), logout/redirect em falha
- [x] e) Arquitetura (Frontend)
  - [x] Modularização + componentização
  - [x] Services (API) separados de estado/regras
  - [x] Layout responsivo
  - [x] Lazy loading de rotas/módulos
  - [x] Paginação ou scroll infinito
  - [x] TypeScript

### ✅ Checklist do Edital — Requisitos apenas para Sênior

- [x] a) Health Checks e Liveness/Readiness
  - [x] Health check geral
  - [x] Liveness
  - [x] Readiness
- [x] b) Testes unitários
  - [x] Backend: testes unitários mínimos
  - [x] Frontend: testes unitários mínimos
  - [x] Execução documentada no README
- [x] c) WebSocket
  - [x] API notifica a cada novo álbum cadastrado
  - [x] Front exibe notificação em tempo real
- [x] d) Rate limit
  - [x] Máximo 10 req/min por usuário
  - [x] Retorna 429 quando exceder
  - [x] Retorna `Retry-After` no 429
- [x] e) Frontend com Facade + BehaviorSubject
  - [x] Padrão Facade
  - [x] Estado com BehaviorSubject (RxJS)
- [x] f) Integração Regionais — Polícia Civil
  - [x] Importa endpoint `https://integrador-argus-api.geia.vip/v1/regionais`
  - [x] Tabela interna `regional(id integer, nome varchar(200), ativo boolean)`
  - [x] Sincronização por inativação/criação (inserir novos, inativar ausentes, inativar e criar ao alterar)

### ✅ Instruções de Entrega (Obrigatório)

- [x] Solução via `docker-compose` contendo: Banco de Dados (BD), MinIO, API e Frontend

Observação: o edital exige “várias imagens”. Este projeto implementa múltiplas capas por álbum via `/capas`.

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
- Seed conforme edital (artistas, álbuns e associações), pode rodar mais de uma vez sem duplicar dados.

#### Decisões de modelagem

- Relação N:N entre artistas e álbuns via tabela de junção `artista_album`.
- URLs presigned não são persistidas; o banco guarda apenas `object_key` e metadados.
- Refresh tokens são armazenados em hash e suportam rotação/invalidação.
- Regionais: apenas uma regional ativa por `external_id` (índice único parcial).

## MinIO e presigned URLs
Regras de implementação 

✅ Banco armazena `object_key` + metadados (`content_type`, `size_bytes`, `created_at`).

❌ Não armazenar URL presigned em `album.image_url` (URL expira).

✅ GET /v1/albuns/{id}/capas gera presigned na hora, com expiração padrão de 30 min.

Bucket

Bucket padrão: `album-covers`

O bucket é criado/validado no startup (se habilitado no backend).

## Estratégia segura de tokens

Para garantir a segurança dos tokens de autenticação (JWT) e mitigar riscos como XSS (Cross-Site Scripting) e CSRF (Cross-Site Request Forgery), o sistema adota as seguintes práticas:

### 1. Armazenamento e Ciclo de Vida
- **Access Token**: Armazenado apenas em memória (via `BehaviorSubject` no Frontend) para reduzir superfície de ataque XSS.
- **Refresh Token**: Armazenado em cookie `HttpOnly` + `SameSite`, com escopo apenas do endpoint de refresh (`/v1/autenticacao/refresh`).

### 2. Renovação Automática (Refresh Flow)
- O Frontend monitora a expiração do **Access Token**.
- Aproximadamente 1 minuto antes de expirar, ou ao receber um erro `401 Unauthorized`, o sistema dispara automaticamente uma requisição para `/v1/autenticacao/refresh`.
- Se o **Refresh Token** for válido, novos tokens são emitidos e a sessão é estendida de forma transparente para o usuário.
- Se a renovação falhar, o usuário é desconectado imediatamente por segurança.

### 3. Proteção no Backend
- **Revogação**: O backend mantém um registro de tokens (hashes) que podem ser invalidados (blacklist ou rotação de tokens).
- **Hashing**: Refresh tokens não são armazenados em texto plano no banco de dados; utiliza-se hashing (SHA-256) para proteção em caso de vazamento de dados.
- **Rotação**: A cada uso do Refresh Token, um novo par de tokens é gerado, invalidando o anterior (Refresh Token Rotation).

### 4. Segurança em Trânsito
- Todas as comunicações devem ocorrer obrigatoriamente via **HTTPS** (em produção) para evitar interceptação (Man-in-the-Middle).
- O backend está configurado com **CORS** restritivo, permitindo apenas origens confiáveis (o domínio do frontend).
- Cookies de refresh respeitam `SameSite` e podem ser marcados como `Secure` em produção.

---


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

Seed do enunciado pode rodar mais de uma vez sem duplicar dados

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

- GET /v1/artistas (paginação + busca + ordenação, size máx 50)
- GET /v1/artistas/{id}
- POST /v1/artistas
- PUT /v1/artistas/{id}
- DELETE /v1/artistas/{id}

### Álbuns

- GET /v1/albuns (paginação + filtros, size máx 50)
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

Exemplo  — sincronização

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

## Qualidade e práticas

- Testes básicos cobrem fluxos críticos (autenticação, CRUD, paginação e integração com MinIO/rate limit) com unit tests no back e no front.
- Legibilidade e escalabilidade: separação por camadas (controller/service/repository) e componentes/facades no front.
- Clean Code: responsabilidades únicas, nomes claros e validações explícitas nos fluxos principais.
- Soluções simples e práticas priorizadas, evitando complexidade desnecessária. 

## Deploy (orientação)

Passo a passo sugerido (produção):

1) Preparar variáveis e segredos
- Criar um arquivo .env de produção (não versionar).
- Definir variáveis seguras: JWT_SECRET, credenciais do banco, MinIO e CORS.

2) Build e versionamento de imagens
- Gerar imagens com tag de versão (ex.: 1.0.0) e, se possível, publicar em um registry.
- Evitar usar latest em produção.

3) Persistência de dados
- Mapear volumes do PostgreSQL e MinIO para storage durável.
- Fazer backup periódico dos volumes (especialmente o banco).

4) HTTPS e proxy reverso
- Usar Nginx (ou similar) para servir o front estático e rotear /v1 para a API.
- Habilitar HTTPS (Let's Encrypt ou certificado corporativo).
- Restringir CORS ao domínio do frontend.

5) Limits e timeouts
- Ajustar limites de upload (multipart) e timeouts conforme carga real.

Exemplo básico de execução (build + subir stack):

Use o comando da seção **Docker Compose (recomendado)**.

Exemplo de práticas recomendadas:
- Definir variáveis de ambiente seguras (JWT_SECRET, credenciais do banco e MinIO).
- Habilitar HTTPS e configurar CORS apenas para o domínio do front.
- Persistir volumes do PostgreSQL e MinIO em storage durável.
- Ajustar limites de upload e timeouts conforme carga real.
- Usar proxy reverso (ex.: Nginx) para servir o front estático e rotear /v1 para a API.

## O que foi e o que não foi feito

- Foi feito: itens do checklist do edital, incluindo JWT/refresh, CRUD, paginação, upload em MinIO, presigned, rate limit, WebSocket, regionais, Swagger, Flyway, health checks e docker-compose.
- Não foi feito: nenhuma pendência funcional relevante identificada no momento. Se algo faltar na avaliação (ex.: algum requisito interpretado de forma diferente), esta seção deve ser atualizada com a justificativa correspondente.

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
