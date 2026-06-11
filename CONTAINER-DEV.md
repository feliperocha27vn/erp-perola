# Desenvolvimento com Docker

Este projeto agora pode rodar com um unico comando: web, API Node e API Python.
O banco existente ja populado pode ser reaproveitado sem recriar container.

## 1) Subir stack completa

O compose principal sobe automaticamente: Postgres, API Node, web e API Python.
O volume do Postgres e persistente e reaproveita os dados existentes (`api_postgres_data`).

Se quiser usar outra URL de banco:

```bash
DATABASE_URL=postgresql://usuario:senha@host:5432/banco docker compose up -d --build
```

No Windows PowerShell:

```powershell
$env:DATABASE_URL="postgresql://usuario:senha@host:5432/banco"
docker compose up -d --build
```

## 2) Sobreposicao opcional da conexao de banco

```bash
DATABASE_URL=postgresql://usuario:senha@host:5432/banco docker compose up -d --build
```

No Windows PowerShell:

```powershell
$env:DATABASE_URL="postgresql://usuario:senha@host:5432/banco"
docker compose up -d --build
```

> `web` e `api` executam `pnpm install --frozen-lockfile` ao iniciar para manter `node_modules` do volume sincronizado com o lockfile.

## 3) Endpoints

- Frontend: `http://localhost:5173`
- API Node (docs): `http://localhost:3333/docs`
- API Python (Flask): `http://localhost:5000/search`

## 4) Logs

```bash
docker compose logs -f web
docker compose logs -f api
docker compose logs -f api-python
```

## 5) Parar sem apagar dados

```bash
docker compose down
```

> Nao use `-v` se quiser manter os dados do Postgres.
