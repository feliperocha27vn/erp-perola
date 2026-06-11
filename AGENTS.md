# AGENTS.md — Raiz do Projeto

## Regra Obrigatória: Build antes de Commit

**Antes de qualquer commit, execute SEMPRE os builds de ambos os projetos para garantir que não há erros de compilação.**

```bash
# 1. Build da API
cd api && pnpm run build

# 2. Build (type-check) do Web
cd web && npx tsc --noEmit

# 3. Só depois commit
git add -A && git commit -m "..."
```

Se qualquer um dos builds falhar, **não commite** — corrija os erros primeiro.

### Por que isso é obrigatório?

- O deploy no Coolify faz `pnpm build` (que roda `tsc -b && vite build` no web) dentro do Docker
- Se houver erro de TypeScript no web, o deploy inteiro falha
- Rodar localmente antes de commitar evita deploys quebrados

### Ordem completa de verificação

1. `cd api && pnpm run build` — compila a API (gera `dist/` e valida types)
2. `cd web && npx tsc --noEmit` — valida types do web sem gerar arquivos
3. Se a API mudou endpoints/schemas: rode `cd web && pnpm generate:api` para regerar o cliente Kubb, depois `npx tsc --noEmit` novamente
4. Só então commit e push

---

## Estrutura do Projeto

Monorepo com dois projetos:

```
analise-de-valores-v2/
├── api/          ← Fastify + Drizzle ORM + PostgreSQL
├── web/          ← React + Vite + TanStack Router/Query
└── docker-compose.prod.yml
```

- **API**: `pnpm run build` (tsc), `pnpm run dev` (tsx watch)
- **Web**: `pnpm run build` (tsc -b && vite build), `pnpm run dev` (vite)

---

## Deploy

- Plataforma: Coolify via Docker Compose (repo GitHub)
- Domínio: erp.relojoariaperola.com.br
- Build no Docker executa os dois projetos em stages separados
- Qualquer erro de TypeScript no web bloqueia o deploy completo