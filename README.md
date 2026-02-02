# README — Sistema de Gerenciamento de Artistas e Álbuns (Full Stack)

Este documento foi preparado por mim para a banca. Ele descreve a solução Full Stack (Backend Java + Frontend React), com autenticação JWT, rate limit (10 req/min por usuário), upload múltiplo de imagens via MinIO (S3), paginação, busca e ordenação, além de WebSocket para notificação de novos álbuns.
  
---

## Sumário

- [Visão geral](#visao-geral)
- [Requisitos de ambiente](#requisitos-de-ambiente)
- [Instalação](#instalacao)
- [Configuração (variáveis de ambiente)](#configuracao-variaveis-de-ambiente)
- [Deploy com Docker (RECOMENDADO)](#deploy-com-docker-recomendado)
- [MinIO (S3) — setup e acesso](#minio-s3--setup-e-acesso)
- [Banco e migrações (Flyway)](#banco-e-migracoes-flyway)
- [Execução](#execucao)
- [Documentação da API](#documentacao-da-api)
- [Endpoints (resumo)](#endpoints-resumo)
- [WebSocket](#websocket)
- [Rate limit](#rate-limit)
- [Checklist do edital (implementação)](#checklist-do-edital-implementacao)
- [Organização e Clean Code](#organizacao-e-clean-code)
- [Testes](#testes)
- [Observações de produção](#observacoes-de-producao)
- [Dados do candidato](#dados-do-candidato)

---

## Visão geral

O sistema permite:
- Autenticação JWT + refresh
- CRUD de artistas e álbuns
- Relacionamento N:N (artista ? álbum)
- Upload múltiplo de capas (MinIO)
- Presigned URL com expiração (30 min)
- Paginação, busca e ordenação
- WebSocket para notificar novos álbuns
- Rate limit de 10 req/min por usuário autenticado
- Integração externa de regionais (sincronização)

Entrega obrigatória via Docker Compose com **API + Frontend + Banco + MinIO**.

---

## Requisitos de ambiente

### Backend
- Java: 17+
- Maven: 3.9+
- PostgreSQL: 14+ (via Docker recomendado)

### Frontend
- Node.js: 20 LTS (recomendado)
- npm: 10+ (ou pnpm/yarn se preferir)

### Dependências externas
- Docker + Docker Compose (recomendado para Postgres + MinIO)
- MinIO (S3) via Docker

**Windows:** use WSL2 para melhor compatibilidade com Docker.

---

## Instalação

```bash
git clone https://github.com/douglasrohden/douglasrohden012453.git
cd douglasrohden012453
```

### Instalar dependências

Frontend:

```bash
cd Frontend
npm install
```

Backend:

```bash
cd ..\Backend
mvn -DskipTests clean install
```

---

## Configuração (variáveis de ambiente)

Crie um arquivo `.env` (ou use o Docker Compose com variáveis). Mantenha um `.env.example` versionado.

Exemplo de `.env.example` (modelo):

```dotenv
# ---------- Backend ----------
SPRING_PROFILES_ACTIVE=dev
SERVER_PORT=3001

POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=dbmusicplayer
POSTGRES_PORT=5433
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/dbmusicplayer

JWT_SECRET=change-me
JWT_EXPIRATION_MS=300000

# Rate limit (edital)
RATE_LIMIT_REQUESTS_PER_WINDOW=10
RATE_LIMIT_WINDOW_SECONDS=60
RATE_LIMIT_BUCKET_EXPIRE_AFTER_SECONDS=120

# ---------- MinIO ----------
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=album-covers
MINIO_REGION=us-east-1
MINIO_PRESIGN_EXPIRATION_MINUTES=30
MINIO_MAX_FILE_SIZE_BYTES=5242880
MINIO_MAX_REQUEST_SIZE_BYTES=26214400

# ---------- Frontend ----------
VITE_API_URL=http://localhost:3001/v1
VITE_WS_URL=http://localhost:3001/ws
```

Regras importantes:
- Nunca comitar `.env` real.
- `.env.example` deve explicar o propósito de cada variável.
- Em produção, preferir variáveis via CI/infra.

---

## Deploy com Docker (RECOMENDADO)

### 🚀 Subir ambiente

Eu deixei o deploy com um único compose. Para subir o ambiente completo:

```bash
docker compose up -d --build
```

### 🔍 Verificar Status

```bash
docker compose ps
```

### 🌐 URLs de Acesso

Após o deploy, a aplicação estará disponível em:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/swagger-ui
- **MinIO Console**: http://localhost:9001 (User: `minioadmin`, Pass: `minioadmin123`)
- **pgAdmin**: http://localhost:5050 (User: `admin@example.com`, Pass: `admin`)

### 📝 Comandos Úteis do Docker

**Ver logs:**
```bash
# Todos os serviços
docker compose logs -f

# Apenas backend
docker compose logs backend -f
```

**Reiniciar serviço:**
```bash
docker compose restart backend
```

**Parar aplicação:**
```bash
docker compose down
```

**Reset completo (limpa volumes):**
```bash
docker compose down -v
```

### ⚙️ Quando Fazer Rebuild

- **Alterações no Frontend/Backend**: rebuild do container afetado
- **Alterações nas variáveis `.env`**: restart do serviço afetado

**Exemplo - Rebuild do frontend:**
```bash
docker compose up -d --build frontend
```

### 🔐 Credenciais Padrão

**Usuário de teste:**
- Username: `admin`
- Password: `admin`

> ⚠️ **Importante**: Em produção, altere o `JWT_SECRET` no arquivo `.env`!

Para mais detalhes sobre comandos Docker, consulte o arquivo [DOCKER_GUIDE.md](./DOCKER_GUIDE.md).

---

## MinIO (S3) — setup e acesso

### URL e credenciais padrão
- Console MinIO: `http://localhost:9001`
- API S3: `http://localhost:9000`
- Usuário: `minioadmin`
- Senha: `minioadmin123`

### Bucket esperado
- Bucket padrão: `album-covers` (configurado em `MINIO_BUCKET`)

Se o projeto não criar bucket automaticamente, crie via console e mantenha privado; o acesso deve ser via **presigned URL**.

---

## Banco e migrações (Flyway)

Caso não rode automaticamente no startup:

```bash
cd Backend
mvn -DskipTests flyway:migrate
```

O seed do edital deve ser idempotente.

---

## Execução

### Desenvolvimento

Backend:

```bash
cd Backend
mvn spring-boot:run
```

Frontend:

```bash
cd Frontend
npm run dev
```

Acessos:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- Swagger: `http://localhost:3001/swagger-ui/index.html`

### Build / Produção

Frontend:

```bash
cd Frontend
npm run build
npm run preview
```

Backend:

```bash
cd Backend
mvn -DskipTests package
java -jar target/*.jar
```

---

## Documentação da API

Swagger UI:
- `http://localhost:3001/swagger-ui/index.html`

Fluxo recomendado:
1) `POST /v1/autenticacao/login`
2) Copiar `accessToken`
3) Authorize: `Bearer <token>`

---

## Endpoints (resumo)

### Autenticação
- `POST /v1/autenticacao/login`
- `POST /v1/autenticacao/refresh`

### Artistas
- `GET /v1/artistas` (paginação + busca + ordenação)
  - params: `page`, `size`, `q`, `tipo`, `sort`, `dir`
- `GET /v1/artistas/{id}`
- `POST /v1/artistas`
- `PUT /v1/artistas/{id}`
- `DELETE /v1/artistas/{id}`

### Álbuns
- `GET /v1/albuns?page=0&size=10&sort=titulo,asc`
- `POST /v1/albuns`
- `PUT /v1/albuns/{id}`
- `POST /v1/albuns/{id}/capas` (multipart `files[]`)
- `GET /v1/albuns/{id}/capas`
- `DELETE /v1/albuns/{albumId}/capas/{coverId}`

---

## WebSocket

- Endpoint SockJS/STOMP: `http://localhost:3001/ws`
- Tópico: `/topic/albuns/created`

Payload (exemplo):

```json
{"id":1,"titulo":"Harakiri","ano":2012}
```

---

## Rate limit

- Limite: **10 requisições por minuto por usuário autenticado**
- Headers retornados:
  - `X-Rate-Limit-Limit`
  - `X-Rate-Limit-Remaining`
  - `X-Rate-Limit-Window-Seconds`
  - `Retry-After` (somente no 429)

Como a banca pode validar:
- Após 10 requisições no mesmo minuto, a API retorna 429 + `Retry-After`.
- O frontend evita duplicidade (StrictMode / double mount / múltiplos effects).

---

## Checklist do edital (implementação)

### Backend
- [x] API REST (GET/POST/PUT)
- [x] Endpoints versionados `/v1/**`
- [x] JWT com expiração curta (5 min)
- [x] Refresh token
- [x] Rate limit 10 req/min por usuário autenticado
- [x] Paginação, busca e ordenação
- [x] Upload múltiplo de imagens
- [x] MinIO (S3) para storage
- [x] Presigned URL com expiração (30 min)
- [x] Health check `/actuator/health`
- [x] Flyway migrations + seed idempotente
- [x] WebSocket (notificar novo álbum)
- [x] Testes unitários/integração para regras críticas (autenticação e controllers básicos cobertos)

### Frontend
- [x] Login obrigatório (guards)
- [x] Consumo de API REST
- [x] Listagem de artistas com busca/ordenação
- [x] Paginação
- [x] Detalhe do artista
- [x] CRUD artista/álbum
- [x] Upload de imagens
- [x] WebSocket (notificações)
- [x] Tratamento de 401 (refresh automático)
- [x] Tratamento de 429 (rate limit)
- [x] Testes unitários de facades/hooks (ArtistsFacade e useArtists)

---

## Organização e Clean Code

### Estrutura de pastas (frontend)

```
Frontend/
  src/
    api/                 # event bus, ws, contratos
    lib/                 # http client, helpers, parsing
    services/            # chamadas API (sem estado)
    facades/             # orquestração (estado RxJS, regras)
    hooks/               # adaptadores React (useX)
    components/          # UI
    pages/               # telas
    types/               # tipos compartilhados
```

### Estrutura de pastas (backend)

```
Backend/
  src/main/java/.../
    config/              # security, cors, filters
    controller/          # endpoints REST
    service/             # regras de negócio
    repository/          # acesso ao banco
    dto/                 # contratos
    model/               # entidades
    events/              # websocket/event listeners
  src/main/resources/
    db/migration/        # flyway
```

Boas práticas aplicadas:
- Nomes descritivos
- Funções pequenas
- Evitar duplicação (DRY)
- Configuração centralizada

---

## Testes

### 🧪 Frontend

#### Executar testes
```bash
cd Frontend
npm test
```

#### Executar testes com UI interativa
```bash
npm run test:ui
```

#### Gerar arquivos de testes automaticamente

O projeto possui um script que gera automaticamente arquivos de teste para todos os componentes:

```bash
cd Frontend
npm run generate-tests
```

**O que o script faz:**
- Varre todos os componentes em `src/components/`
- Gera arquivos `__tests__/ComponentName.test.tsx` para cada componente
- Cria testes básicos (render, interações, props)
- Não sobrescreve testes customizados (apenas auto-gerados)

**Estrutura dos testes gerados:**
```typescript
// Exemplo: src/components/Button/__tests__/Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Button from '../Button';

describe('Button', () => {
  it('renders default structure', () => {
    const { container } = render(<Button />);
    expect(container.firstChild).toBeTruthy();
  });

  it.skip('handles a basic user interaction', async () => {
    const user = userEvent.setup();
    render(<Button />);
    // TODO: customize this test
  });
});
```

**Limpar testes auto-gerados:**
```bash
npm run clean-generated-tests
```

#### Tecnologias de teste
- **Vitest**: Framework de testes
- **React Testing Library**: Renderização e queries
- **user-event**: Simulação de interações do usuário

---

### ☕ Backend

#### Executar todos os testes
```bash
cd Backend
mvn test
```

#### Executar testes com cobertura
```bash
mvn test jacoco:report
```

O relatório de cobertura estará em: `target/site/jacoco/index.html`

#### Criar novos testes

**Testes unitários** (service/repository):
```java
// Localização: src/test/java/com/example/service/
@ExtendWith(MockitoExtension.class)
class ArtistaServiceTest {
    @Mock
    private ArtistaRepository repository;
    
    @InjectMocks
    private ArtistaService service;
    
    @Test
    void deveCriarArtista() {
        // Given
        ArtistaDTO dto = new ArtistaDTO("Serj Tankian", "Cantor");
        
        // When
        Artista result = service.criar(dto);
        
        // Then
        assertNotNull(result);
        assertEquals("Serj Tankian", result.getNome());
    }
}
```

**Testes de integração** (API endpoints):
```java
// Localização: src/test/java/com/example/controller/
@SpringBootTest
@AutoConfigureMockMvc
class ArtistaControllerIntegrationTest {
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    void deveListarArtistas() throws Exception {
        mockMvc.perform(get("/v1/artistas")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray());
    }
}
```

#### Convenções de nomenclatura
- Testes unitários: `*Test.java`
- Testes de integração: `*IntegrationTest.java`
- Localização: `src/test/java/` (espelha `src/main/java/`)

#### Executar apenas um teste específico
```bash
mvn test -Dtest=ArtistaServiceTest
```

#### Tecnologias de teste
- **JUnit 5**: Framework de testes
- **Mockito**: Mocks e stubs
- **Spring Boot Test**: Testes de integração
- **JaCoCo**: Cobertura de código


---

## Análise geral do projeto (para banca)

### Pontos fortes
- Arquitetura em camadas bem definida (controller/service/repository) e frontend com Facade + BehaviorSubject.
- Requisitos críticos do edital atendidos (JWT + refresh, rate limit, MinIO com presigned URL, WebSocket, sincronização de regionais).
- Docker Compose com API + Frontend + Banco + MinIO pronto para execução local.

### Pontos de atenção / gaps
- Testes ainda parciais em algumas camadas (há testes reais em segurança/serviços, mas faltam integrações completas em controllers e componentes de UI).
- Ajustes de ambiente para produção devem ser feitos via variáveis (ex.: JWT_SECRET e URLs).

### Próximos passos que eu faria
- Consolidar testes de controller com MockMvc e testes de UI com interações reais.
- Revisar política de logs e exposição de detalhes em actuator para produção.
- Automatizar CI com execução de testes e lint.

## Observações de produção

- Configurar CORS restritivo com origens explícitas.
- Confiar em `X-Forwarded-For` apenas atrás de proxy confiável.
- MinIO em produção: credenciais seguras, TLS, bucket policy adequada.
- Deploy recomendado: Docker images + docker-compose (ou Kubernetes) com variáveis via CI/infra.

---

## Dados do candidato

Preencher conforme necessário:
- Nome completo:
- CPF:
- E-mail:
- Vaga/edital:

---

## Licença

Uso educacional para o edital SEPLAG/MT.
