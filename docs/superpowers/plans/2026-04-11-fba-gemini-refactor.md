# FBA Gemini Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refatorar a analise FBA para usar o SDK oficial do Google Gemini, melhorar o prompt e tornar o resultado auditavel com indicacao explicita de uso de Gemini ou fallback.

**Architecture:** O backend vai trocar a chamada manual via `fetch` por `@google/genai` com `gemini-2.5-flash`, schema de saida estruturada e validacao Zod. O prompt sera estruturado em blocos (`role`, `constraints`, `heuristics`, `examples`, `items`, `task`). A resposta vai expor `analysis_source`, `confidence` e `decision_tags`, e o frontend exibira esses sinais.

**Tech Stack:** Fastify + Zod + TypeScript + @google/genai + Gemini 2.5 Flash + React + Kubb + React Query

---

### Task 1: Migrar para SDK oficial

**Files:**
- Modify: `api/package.json`
- Modify: `api/src/use-cases/fba/fba-gemini-client.ts`
- Create: `api/src/use-cases/fba/fba-gemini-client.test.ts`

- [ ] Usar `@google/genai` no lugar de `fetch` manual
- [ ] Fixar modelo em `gemini-2.5-flash`
- [ ] Manter `responseMimeType: application/json` + schema
- [ ] Validar JSON com Zod

### Task 2: Melhorar prompt com estrutura e heuristica

**Files:**
- Modify: `api/src/use-cases/fba/fba-gemini-client.ts`
- Modify: `api/src/use-cases/fba/fba-gemini-client.test.ts`

- [ ] Criar prompt estruturado com role/constraints/heuristics/examples/items/task
- [ ] Incluir regras para baixa amostra, conversao, limite de estoque
- [ ] Incluir exemplos few-shot consistentes

### Task 3: Expor metadados auditaveis no backend

**Files:**
- Modify: `api/src/use-cases/fba/fba-types.ts`
- Modify: `api/src/use-cases/fba/analyze-fba-csv.ts`
- Modify: `api/src/http/controllers/fba/analyze-fba-csv.ts`
- Modify: `api/src/use-cases/fba/analyze-fba-csv.test.ts`

- [ ] Adicionar `analysis_source` em summary e item
- [ ] Adicionar `confidence` e `decision_tags` por item
- [ ] Marcar fallback de forma explicita

### Task 4: Atualizar contrato e frontend

**Files:**
- Regenerated: `api/swagger.json`
- Regenerated: `web/src/api/**`
- Modify: `web/src/pages/-components/fba-analysis/types.ts`
- Modify: `web/src/pages/-components/fba-analysis/results-table.tsx`
- Modify: `web/src/pages/analise-fba.tsx`

- [ ] Regenerar swagger e Kubb
- [ ] Mostrar origem Gemini/Fallback na UI
- [ ] Mostrar confianca e tags de decisao
- [ ] Exibir alerta claro quando usar fallback

### Task 5: Verificacao final

**Files:**
- No new files required

- [ ] `pnpm --dir api test`
- [ ] `pnpm --dir api build`
- [ ] `pnpm --dir web test`
- [ ] `pnpm --dir web lint`
- [ ] `pnpm --dir web build`
