# AGENTS.md — Raiz do Projeto

## Regra Obrigatória: Build antes de Commit

**Antes de qualquer commit, execute SEMPRE os builds de ambos os projetos para garantir que não há erros de compilação.**

```bash
# 1. Build da API
cd api && pnpm run build

# 2. Build (type-check) do Web
cd web && npx tsc -b --noEmit

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
2. `cd web && npx tsc -b --noEmit` — valida types do web sem gerar arquivos (o `-b` é obrigatório porque o `tsconfig.json` usa project references)
3. Se a API mudou endpoints/schemas: rode `cd web && pnpm generate:api` para regerar o cliente Kubb, depois `npx tsc -b --noEmit` novamente
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

### Como disparar o deploy

Após o `push` para `main`, o deploy pode ser feito de três formas:

1. **Automático**: o Coolify detecta o push via GitHub App e enfileira o deploy sozinho.
2. **Manual via script** (recomendado): use `pnpm deploy:prod` na raiz do projeto.
3. **Manual via API direta**: alternativa para casos avançados ou debug.

> **Nota:** o MCP do Coolify (`coolify_coolify_application_management` com `action: deploy`) retorna `404` para essa aplicação (provavelmente porque é `dockercompose`). Use o script ou a API REST direta.

#### Deploy manual via script (recomendado)

1. Copie `.env.example` na raiz para `.env` e preencha:
   - `COOLIFY_BASE_URL`: `https://coolify.relojoariaperola.com.br`
   - `COOLIFY_API_TOKEN`: token obtido no `opencode.json`
   - `COOLIFY_APP_UUID`: `so80wg8c80swgwgo8gwsw0s4`

2. Instale as dependências do script (apenas na primeira vez):

```bash
pnpm install
```

3. Execute o deploy:

```bash
pnpm deploy:prod
```

O script dispara o deploy, faz polling do status a cada 10 segundos e exibe os logs automaticamente caso falhe. Ao final, também verifica se a aplicação está `running:healthy`.

#### Deploy manual via API direta

1. Obtenha o token e a URL base no `opencode.json`.

2. Dispare o deploy:

```bash
curl -X POST "https://coolify.relojoariaperola.com.br/api/v1/deploy" \
  -H "Authorization: Bearer <COOLIFY_API_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"uuid":"so80wg8c80swgwgo8gwsw0s4","force":true}'
```

3. Acompanhe o status pelo UUID do deployment retornado:

```bash
curl -X GET "https://coolify.relojoariaperola.com.br/api/v1/deployments/<DEPLOYMENT_UUID>" \
  -H "Authorization: Bearer <COOLIFY_API_TOKEN>" \
  -H "Content-Type: application/json"
```

4. O deploy está pronto quando o campo `status` for `finished` e a aplicação estiver `running:healthy`.

#### Verificação rápida da aplicação

```bash
curl -X GET "https://coolify.relojoariaperola.com.br/api/v1/applications" \
  -H "Authorization: Bearer <COOLIFY_API_TOKEN>"
```

Busque pelo UUID `so80wg8c80swgwgo8gwsw0s4` e confirme o campo `status`.