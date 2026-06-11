# AGENTS.md

Regras globais para o projeto `web`. Todos os agentes e desenvolvedores devem seguir estas convenções.

---

## Dependências Obrigatórias

O projeto web requer as seguintes dependências principais:

### Runtime Dependencies

```json
{
  "react": "^19.1.1",
  "react-dom": "^19.1.1",
  "@tanstack/react-router": "^1.167.4",
  "@tanstack/react-query": "^5.90.21",
  "zod": "^4.3.6",  // ⚠️ OBRIGATÓRIO - Validação de schemas
  "axios": "^1.12.2",
  "lucide-react": "^0.545.0",
  "tailwindcss": "^4.1.13"
}
```

### Dev Dependencies

```json
{
  "@kubb/cli": "3.0.0-alpha.17",
  "@kubb/core": "3.0.0-alpha.17",
  "@kubb/plugin-oas": "3.0.0-alpha.17",
  "@kubb/plugin-ts": "3.0.0-alpha.17",
  "@kubb/plugin-client": "3.0.0-alpha.17",
  "@kubb/plugin-tanstack-query": "3.0.0-alpha.17",
  "@kubb/react": "3.0.0-alpha.17",
  "@biomejs/biome": "2.2.4",
  "vite": "^7.1.2",
  "typescript": "~5.8.3"
}
```

---

## ⚠️ Erro Comum: "Failed to resolve import"

### Problema

```
Failed to resolve import "zod" from "src/pages/upload-imagens.tsx". Does the file exist?
```

### Causa

A dependência não está instalada no `package.json`.

### Solução

```bash
# Instalar dependência faltante
pnpm add zod

# Ou para dev dependencies
pnpm add -D nome-do-pacote
```

### Regra

**Sempre que usar um import, certifique-se que o pacote está instalado.**

```tsx
// ❌ ERRADO - Importar sem instalar
import { z } from 'zod'  // Erro: "Failed to resolve import"

// ✅ CORRETO - Primeiro instalar, depois importar
// $ pnpm add zod
import { z } from 'zod'  // Funciona!
```

---

## TanStack Router - Search Params

O TanStack Router usa Zod para validar search params (query strings).

### Padrão Correto

```tsx
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { z } from 'zod'  // ⚠️ Requer: pnpm add zod

// 1. Definir schema de validação
const searchSchema = z.object({
  page: z.number().int().min(0).catch(0),
  filter: z.enum(['all', 'without']).catch('without'),
  search: z.string().optional(),
})

// 2. Extrair tipo TypeScript do schema
type SearchParams = z.infer<typeof searchSchema>

// 3. Registrar no route
export const Route = createFileRoute('/minha-pagina')({
  component: MinhaPage,
  validateSearch: searchSchema,  // Valida ?page=0&filter=all
})

// 4. Usar no componente
function MinhaPage() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page, filter, search } = useSearch({ from: Route.fullPath })

  // 5. Atualizar params com tipo correto
  const updateParams = (updates: Partial<SearchParams>) => {
    navigate({
      search: (prev) => ({ ...prev, ...updates }),
    })
  }

  return (
    <button onClick={() => updateParams({ page: page + 1 })}>
      Próxima Página
    </button>
  )
}
```

### ⚠️ Erro Comum: `._type` não existe

**ERRADO:**
```tsx
const searchSchema = z.object({ ... })

// ❌ ERRO: Property '_type' does not exist
type SearchParams = typeof searchSchema._type
```

**CORRETO:**
```tsx
const searchSchema = z.object({ ... })

// ✅ Use z.infer<> para extrair o tipo
type SearchParams = z.infer<typeof searchSchema>
```

### Por que Zod?

- ✅ Validação automática de tipos (number, string, enum)
- ✅ Valores padrão com `.catch()`
- ✅ Type-safety completo
- ✅ Sincronização com URL

### ⚠️ Erro Comum: "Property 'search' is missing"

**Problema:**
```
Property 'search' is missing in type but required in MakeRequiredSearchParams
```

**Causa:** Quando uma rota tem `validateSearch`, o TanStack Router exige que você passe os parâmetros ao navegar.

**ERRADO:**
```tsx
// ❌ Falta propriedade 'search'
<Link to="/gerenciador-de-produtos" className="...">
  Acessar
</Link>
```

**CORRETO:**
```tsx
// ✅ Sempre passe os search params ao navegar
<Link 
  to="/gerenciador-de-produtos"
  search={{ page: 0, filter: 'without' }}
  className="..."
>
  Acessar
</Link>

// Ou com navigate()
const navigate = useNavigate()
navigate({
  to: '/gerenciador-de-produtos',
  search: { page: 0, filter: 'without' }
})

// Ou ao atualizar apenas alguns params
const navigate = useNavigate({ from: Route.fullPath })
navigate({
  search: (prev) => ({ ...prev, page: prev.page + 1 })
})
```

**Importante:** Mesmo que o schema tenha `.catch()` com valores padrão, você PRECISA passar os search params explicitamente ao criar Links ou navegar. Isso garante type-safety e evita navegação inválida.

---

## Nomenclatura de arquivos

**Todos os arquivos usam kebab-case.** Nunca use PascalCase ou camelCase em nomes de arquivo.

```
// CORRETO
value-searcher.tsx
buscador-de-valores.tsx
gerenciador-de-produtos.tsx
use-debounce.ts
api-client.ts

// ERRADO
ValueSearcher.tsx
BuscadorDeValores.tsx
GerenciadorDeProdutos.tsx
useDebounce.ts
ApiClient.ts
```

Esta regra se aplica a todos os arquivos em `src/`: componentes, páginas, hooks, utilitários e qualquer outro módulo.

### Nomenclatura de Rotas (Páginas)

As rotas devem ser descritivas e em português quando aplicável:

```
src/pages/
├── index.tsx                     → / (Dashboard)
├── buscador-de-valores.tsx       → /buscador-de-valores
├── gerenciador-de-produtos.tsx   → /gerenciador-de-produtos
└── configuracoes.tsx             → /configuracoes
```

**❌ Evite nomes técnicos internos:**
- `upload-imagens.tsx` → Use `gerenciador-de-produtos.tsx`
- `product-manager.tsx` → Use `gerenciador-de-produtos.tsx` (português)

**✅ Use nomes que descrevem a funcionalidade:**
- `gerenciador-de-produtos.tsx` - Claro, em português, descritivo
- `buscador-de-valores.tsx` - Claro, em português, descritivo

> Exceções aceitas pelo tooling: `__root.tsx` (convenção do TanStack Router) e `routeTree.gen.ts` (arquivo gerado automaticamente).

---

## Checklist Antes de Commit

- [ ] Todas as dependências instaladas (`pnpm install`)
- [ ] Imports têm pacotes instalados (não "Failed to resolve")
- [ ] **Arquivo `src/api/clients/axios-client.ts` existe**
- [ ] Arquivo `.env` configurado com `VITE_API_URL`
- [ ] API regenerada se swagger.json mudou (`pnpm generate:api`)
- [ ] Links que apontam para rotas com `validateSearch` incluem a propriedade `search`
- [ ] Código formatado (`pnpm format`)
- [ ] Sem erros de lint (`pnpm lint`)
- [ ] Search params validados com Zod
- [ ] Mutations invalidam queries corretamente

---

## Troubleshooting

### "Property 'search' is missing in type ..."

Quando uma rota usa `validateSearch`, todo `<Link>` ou `navigate()` precisa enviar `search`.

```tsx
// ❌ Faltando search → erro
<Link to="/gerenciador-de-produtos">Abrir</Link>

// ✅ Correto
<Link
  to="/gerenciador-de-produtos"
  search={{ page: 0, filter: 'without' }}
>
  Abrir
</Link>

// ✅ navigate()
navigate({
  to: '/gerenciador-de-produtos',
  search: { page: 0, filter: 'without' },
})
```

Para atualizar só um campo:

```tsx
navigate({
  search: prev => ({ ...prev, page: prev.page + 1 }),
})
```

---

## Documentação

- [TanStack Router - Search Params](https://tanstack.com/router/latest/docs/guide/search-params)
- [Zod Documentation](https://zod.dev)
- [API Client (Kubb)](./API_CLIENT.md)
- [API Hooks](./src/api/hooks/AGENTS.md)

---

## Kubb no projeto

### Comando oficial

Sempre que o OpenAPI da API mudar, execute:

```bash
pnpm generate:api
```

### Origem e destino da geração

- Fonte: `../api/swagger.json` (definido em `kubb.config.ts`)
- Saída: `src/api/`
- Tipos: `src/api/types/`
- Hooks React Query: `src/api/hooks/`
- Clients HTTP: `src/api/clients/`

### Fluxo obrigatório

1. Atualizar endpoints/schemas no backend.
2. Subir a API em desenvolvimento para atualizar `api/swagger.json`.
3. Executar `pnpm generate:api` na pasta `web`.
4. Ajustar a UI para usar os novos tipos/hooks gerados em `src/api`.

### Regra

Não criar manualmente hooks ou tipos quando já existirem endpoints no OpenAPI. O contrato oficial deve sempre vir da geração do Kubb.
