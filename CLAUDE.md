# CLAUDE.md — ERP Pérola (analise-de-valores-v2)

Consolidação das regras de todos os AGENTS.md do projeto. Leia antes de qualquer implementação.

---

## Regra obrigatória: Build antes de commit

```bash
cd api && pnpm run build          # valida TypeScript da API
cd web && npx tsc -b --noEmit    # valida TypeScript do web (usa -b por project references)
```

Se qualquer build falhar, corrija antes de commitar. O deploy no Coolify falha com erro de TypeScript.

Se endpoints/schemas da API mudaram:
```bash
cd web && pnpm generate:api      # regenera cliente Kubb (types, hooks, clients)
cd web && npx tsc -b --noEmit   # re-valida depois da geração
```

---

## Arquitetura da API (Fastify + Drizzle)

Camadas obrigatórias, nesta ordem: Controller → Factory → UseCase → Repository → DB

```
src/
├── http/controllers/{recurso}/   ← FastifyPluginAsyncZod, validação Zod, status HTTP
├── factories/{recurso}/          ← instancia repository + use case, sem lógica
├── use-cases/{recurso}/          ← lógica de negócio pura, sem Fastify, sem DB direto
├── repositories/
│   ├── {recurso}-repository.ts   ← interface (contrato)
│   └── drizzle/drizzle-{recurso}-repository.ts  ← implementação
└── errors/                       ← erros customizados tipados
```

**Nunca acesse o banco diretamente no controller ou use case.** Passe sempre pelo repository.

### Convenções de nomes

- Arquivos: `kebab-case` (`fetch-stock-report.ts`)
- Classes: `PascalCase` + sufixo (`FetchStockReportUseCase`)
- Factories: `make{Nome}UseCase()` (`makeFetchStockReportUseCase`)
- Exports de controller: `camelCase` (`fetchStockReport: FastifyPluginAsyncZod`)

### operationId é obrigatório em toda rota

```ts
schema: {
  operationId: 'getReportsStockByBrand',  // camelCase, único na API
  tags: ['reports'],
  // ...
}
```

Kubb usa operationId para nomear os arquivos/hooks gerados.

### Padrão de use case

```ts
// interface de request e response no mesmo arquivo, não exportadas
interface FetchXUseCaseRequest { brandId: string | null }
interface FetchXUseCaseResponse { items: XItem[] }

export class FetchXUseCase {
  constructor(private repo: XRepository) {}
  async execute(req: FetchXUseCaseRequest): Promise<FetchXUseCaseResponse> { ... }
}
```

### TDD obrigatório para use cases

Escreva o teste antes da implementação. Use Fake implementations inline no arquivo de teste (não mocks). Rode `pnpm run test` na API para confirmar que os testes passam.

---

## Arquitetura do Frontend (React 19 + Vite + TanStack)

```
web/src/
├── pages/
│   ├── {nome-em-kebab-case}.tsx     ← arquivo de página = rota TanStack Router
│   └── -components/{recurso}/       ← componentes específicos da página
├── api/                             ← NUNCA edite manualmente — gerado pelo Kubb
├── components/ui/                   ← shadcn/Radix primitivos
└── lib/                             ← utilitários compartilhados
```

### Regras de arquivo

- Todos os arquivos: `kebab-case` (`relatorio-de-estoque.tsx`)
- Nunca PascalCase em nomes de arquivo
- Rotas em português quando aplicável

### TanStack Router: search params com Zod

```tsx
const searchSchema = z.object({ brandId: z.string().optional() })
export const Route = createFileRoute('/minha-rota')({
  component: MinhaPage,
  validateSearch: searchSchema,
})
// Links para rotas com validateSearch DEVEM passar search:
<Link to="/minha-rota" search={{ brandId: undefined }}>...</Link>
```

### Kubb: nunca crie hooks ou types manualmente

Se um endpoint existe na API, use o hook gerado:
```tsx
import { useGetReportsStockByBrand } from '@/api/hooks/reportsController/useGetReportsStockByBrand'
```

Fluxo quando API muda:
1. Endpoint criado/alterado no backend
2. API dev server rodando → atualiza `api/swagger.json`
3. `cd web && pnpm generate:api`
4. Usar os hooks/types gerados

### Responsividade mobile

- Standard mobile-first com classes Tailwind (`sm:`, `md:`)
- Tabelas de dados largas: scroll horizontal no mobile (`overflow-x-auto`)
- Listas de itens com ações: card vertical por item no mobile
- Não remova layouts de desktop ao adicionar mobile — use dual-render (`md:hidden` / `hidden md:block`) quando estrutura for radicalmente diferente

---

## Stack

| Camada | Tech |
|---|---|
| API | Fastify 5 + Drizzle ORM + PostgreSQL + Zod + fastify-type-provider-zod |
| Auth | better-auth |
| Frontend | React 19 + Vite + TanStack Router/Query + Tailwind v4 + shadcn/Radix |
| Geração de cliente | Kubb 3 (types + axios clients + React Query hooks) |
| Testes API | Vitest (unit: in-memory repos, e2e: Fastify real + PostgreSQL) |
| Deploy | Coolify via Docker Compose |

---

## Checklist antes de commit

- [ ] `cd api && pnpm run build` passa
- [ ] `cd web && npx tsc -b --noEmit` passa
- [ ] Se API mudou: `pnpm generate:api` rodado e re-validado
- [ ] Testes unitários passando (`cd api && pnpm run test`)
- [ ] Nenhum `console.log` de debug esquecido
- [ ] Responsividade mobile testada (Chrome DevTools 375px)
