# Music Player - Frontend

Interface gráfica para gerenciamento de Artistas e Álbuns, desenvolvida com React, TypeScript e Vite.

## Tecnologias

- **React 19**
- **TypeScript**
- **Vite** (Build tool)
- **TailwindCSS** + **Flowbite React** (UI Library)
- **React Router DOM** (Roteamento)
- **RxJS** (Gerenciamento de estado reativo)

## Pré-requisitos

- Node.js 18+
- NPM

## Instalação

```bash
cd Frontend
npm install
```

## Desenvolvimento Local

Para rodar o servidor de desenvolvimento (com Hot Module Replacement):

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

## Testes

O projeto utiliza **Vitest** para testes unitários.

```bash
npm run test
```

## Build de Produção

Para gerar os arquivos estáticos para produção:

```bash
npm run build
```

Os arquivos serão gerados na pasta `dist/`.

## Docker

Para rodar via Docker (recomendado usar o `docker-compose` na raiz do projeto):

```bash
docker build -t musicplayer-frontend .
docker run -p 5173:80 musicplayer-frontend
```
