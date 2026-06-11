# Analise FBA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar uma nova ferramenta de analise de prospeccao para envio ao Amazon FBA a partir de um CSV de 90 dias, cruzando SKU com produtos do sistema, estoque `Fisico`, calculo base deterministico e ajuste/justificativa via Gemini.

**Architecture:** O backend recebe um CSV via `multipart/form-data`, faz parse robusto, normaliza os SKUs, busca os produtos em lote, extrai o estoque `Fisico`, calcula metricas base e envia um payload estruturado para a API do Gemini com `responseMimeType=application/json` e schema fixo. O frontend adiciona uma nova rota composta com upload, cards-resumo, tabela principal, pendencias e graficos Recharts no estilo visual ja existente.

**Tech Stack:** Fastify + Zod + Drizzle + PostgreSQL + Kubb + React 19 + TanStack Router + React Query + Recharts + Shadcn UI + Gemini REST API

---

**Assumptions**
- Rota nova: `/analise-fba`
- Quantidade recomendada: inteiro, truncado para nunca exceder o estoque `Fisico`; arredondamento final conservador para baixo
- Motivo da recomendacao: 1-2 frases curtas
- V1 sem persistencia de analises; resposta stateless
- V1 sem exportacao CSV/XLSX
- CSV vinculado por `Codigo SKU`
- Estoque base = primeiro estoque cujo `title === "Fisico"`; ausencia vira pendencia
- Objetivo principal = maximizar vendas

**File Map**
- `api/src/http/controllers/fba/routes.ts` - agrupa endpoints FBA
- `api/src/http/controllers/fba/analyze-fba-csv.ts` - endpoint POST do upload
- `api/src/factories/fba/make-analyze-fba-csv-use-case.ts` - factory do caso de uso
- `api/src/use-cases/fba/analyze-fba-csv.ts` - orquestracao da analise
- `api/src/use-cases/fba/fba-csv-parser.ts` - parse/normalizacao do Business Report
- `api/src/use-cases/fba/fba-calculations.ts` - metricas base e limites deterministas
- `api/src/use-cases/fba/fba-gemini-client.ts` - chamada ao Gemini com schema JSON
- `api/src/use-cases/fba/fba-types.ts` - tipos internos da feature
- `api/src/errors/invalid-fba-csv-error.ts` - erro de CSV invalido
- `api/src/errors/gemini-analysis-error.ts` - erro de integracao Gemini
- `api/src/repositories/product-repository.ts` - adicionar busca em lote por SKU
- `api/src/repositories/drizzle/drizzle-product-repository.ts` - implementar busca em lote
- `api/src/app.ts` - registrar `fbaRoutes`
- `api/src/env.ts` - validar `GEMINI_API_KEY`
- `api/package.json` - adicionar parser CSV e stack de teste da API
- `web/src/pages/analise-fba.tsx` - controller da rota
- `web/src/pages/-components/fba-analysis/index.ts` - export composto
- `web/src/pages/-components/fba-analysis/root.tsx` - wrapper da pagina
- `web/src/pages/-components/fba-analysis/header.tsx` - titulo e descricao
- `web/src/pages/-components/fba-analysis/upload-form.tsx` - upload do arquivo
- `web/src/pages/-components/fba-analysis/summary-cards.tsx` - cards resumo
- `web/src/pages/-components/fba-analysis/results-table.tsx` - lista principal
- `web/src/pages/-components/fba-analysis/pending-table.tsx` - pendencias
- `web/src/pages/-components/fba-analysis/recommendation-chart.tsx` - grafico geral
- `web/src/pages/-components/fba-analysis/product-comparison-chart.tsx` - comparativo por item
- `web/src/pages/-components/fba-analysis/types.ts` - tipos de view model
- `web/src/pages/-components/fba-analysis/formatters.ts` - mapeamento/formatacao
- `web/src/pages/-components/fba-analysis/formatters.test.ts` - teste frontend puro
- `web/src/pages/index.tsx` - card da nova ferramenta no dashboard
- `web/src/api/**` - arquivos gerados pelo `pnpm generate:api`, sem edicao manual

### Task 1: Preparar infra minima da feature

**Files:**
- Modify: `api/package.json`
- Modify: `api/src/env.ts`
- Modify: `api/src/app.ts`

- [ ] Adicionar dependencia de parse robusto CSV na API
- [ ] Adicionar stack minima de testes da API (`vitest`) para permitir TDD dos modulos puros da feature
- [ ] Adicionar `GEMINI_API_KEY` em `api/src/env.ts`
- [ ] Registrar `fbaRoutes` em `api/src/app.ts`
- [ ] Verificar build e tipagem da API:
  - `pnpm --dir api build`
  - esperado: compila sem erro
- [ ] Verificar env:
  - `api/src/env.ts` deve aceitar opcional e o use case tratar com erro 503 ou fallback

### Task 2: Parser do Business Report e calculos deterministas

**Files:**
- Create: `api/src/use-cases/fba/fba-types.ts`
- Create: `api/src/use-cases/fba/fba-csv-parser.ts`
- Create: `api/src/use-cases/fba/fba-calculations.ts`
- Create: `api/src/errors/invalid-fba-csv-error.ts`
- Create: `api/src/use-cases/fba/fba-csv-parser.test.ts`
- Create: `api/src/use-cases/fba/fba-calculations.test.ts`

- [ ] Escrever testes do parser
- [ ] Escrever testes dos calculos
- [ ] Implementar parser com normalizacao
- [ ] Implementar calculos base e limites
- [ ] Rodar testes puros da API

### Task 3: Busca em lote de produtos e caso de uso principal

**Files:**
- Modify: `api/src/repositories/product-repository.ts`
- Modify: `api/src/repositories/drizzle/drizzle-product-repository.ts`
- Create: `api/src/use-cases/fba/analyze-fba-csv.ts`
- Create: `api/src/factories/fba/make-analyze-fba-csv-use-case.ts`
- Create: `api/src/use-cases/fba/analyze-fba-csv.test.ts`

- [ ] Adicionar metodo em lote no contrato
- [ ] Implementar busca em lote no Drizzle
- [ ] Escrever teste do caso de uso cobrindo pendencias e itens validos
- [ ] Implementar orquestracao principal

### Task 4: Integracao Gemini com output estruturado

**Files:**
- Create: `api/src/use-cases/fba/fba-gemini-client.ts`
- Create: `api/src/errors/gemini-analysis-error.ts`
- Modify: `api/src/use-cases/fba/analyze-fba-csv.ts`

- [ ] Integrar com Gemini via REST e JSON schema
- [ ] Validar resposta via Zod
- [ ] Aplicar clamp deterministico
- [ ] Implementar fallback deterministico em falha

### Task 5: Endpoint HTTP, OpenAPI e geracao Kubb

**Files:**
- Create: `api/src/http/controllers/fba/analyze-fba-csv.ts`
- Create: `api/src/http/controllers/fba/routes.ts`
- Modify: `api/src/app.ts`
- Regenerated: `web/src/api/**`

- [ ] Criar endpoint `POST /fba/analyze` com `operationId`
- [ ] Definir schema Zod de request/response
- [ ] Registrar rotas no app
- [ ] Atualizar swagger e gerar cliente Kubb

### Task 6: Nova pagina frontend com pattern de composicao

**Files:**
- Create: `web/src/pages/analise-fba.tsx`
- Create: `web/src/pages/-components/fba-analysis/index.ts`
- Create: `web/src/pages/-components/fba-analysis/root.tsx`
- Create: `web/src/pages/-components/fba-analysis/header.tsx`
- Create: `web/src/pages/-components/fba-analysis/upload-form.tsx`
- Create: `web/src/pages/-components/fba-analysis/summary-cards.tsx`
- Create: `web/src/pages/-components/fba-analysis/results-table.tsx`
- Create: `web/src/pages/-components/fba-analysis/pending-table.tsx`
- Create: `web/src/pages/-components/fba-analysis/types.ts`
- Create: `web/src/pages/-components/fba-analysis/formatters.ts`
- Create: `web/src/pages/-components/fba-analysis/formatters.test.ts`

- [ ] Implementar controller da rota
- [ ] Implementar upload e estado de execucao
- [ ] Implementar cards, tabela principal e pendencias
- [ ] Validar formatacao via testes unitarios

### Task 7: Graficos com Recharts e card no dashboard

**Files:**
- Create: `web/src/pages/-components/fba-analysis/recommendation-chart.tsx`
- Create: `web/src/pages/-components/fba-analysis/product-comparison-chart.tsx`
- Modify: `web/src/pages/-components/fba-analysis/index.ts`
- Modify: `web/src/pages/index.tsx`

- [ ] Implementar grafico top SKUs por recomendacao
- [ ] Implementar grafico comparativo por item
- [ ] Adicionar card da nova ferramenta no dashboard

### Task 8: Verificacao integrada

**Files:**
- No new files required

- [ ] Rodar testes da API e web
- [ ] Rodar lint e build
- [ ] Testar fluxo com CSV real
