# AGENTS.md — src/pages

Regras e convenções para arquivos de rota nesta pasta.

---

## TanStack Router — file-based routing

O plugin Vite lê esta pasta e gera `src/routeTree.gen.ts` automaticamente. **Nunca edite o `routeTree.gen.ts` manualmente.**

---

## Como criar uma nova rota

1. Crie `src/pages/nome-da-rota.tsx`.
2. Exporte uma constante `Route` com `createFileRoute`:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/nome-da-rota')({
  component: MinhaPage,
})

function MinhaPage() {
  return <div>Minha página</div>
}
```

3. Importe apenas o que for utilizado — o linter rejeita imports não usados.

---

## Convenção de nomes

| Arquivo                             | Rota                     |
|-------------------------------------|--------------------------|
| `index.tsx`                         | `/`                      |
| `sobre.tsx`                         | `/sobre`                 |
| `buscador-de-valores.tsx`           | `/buscador-de-valores`   |

---

## Arquivos especiais

- `__root.tsx` — layout raiz. Contém o `<Outlet />` e providers globais (Toaster, etc.). Não é uma rota navegável diretamente.

---

## Arquitetura de páginas complexas

Ao criar novas páginas ou módulos complexos, é obrigatório utilizar Pattern de Composição e extrair as declarações de UI para a pasta `-components/`.

Regra obrigatória:

1. O arquivo de rota (`src/pages/*.tsx`) deve atuar como Controller, concentrando estado local, hooks de API, mutações, invalidação de cache e passagem de props.
2. A UI e o layout devem ficar isolados em subcomponentes importados de `src/pages/-components/...`.
3. Componentes compostos devem ser exportados por um `index.ts` no módulo de UI.
4. Evite declarar subcomponentes longos diretamente no arquivo da rota.

Exemplo de referência:

- `src/pages/marcas.tsx` como Controller.
- `src/pages/-components/brand-manager/` contendo `Root`, `Header`, `Table`, `CreateDialog`, `RenameDialog`, `DeleteDialog` e `index.ts` com objeto composto `BrandManager`.

---

## Rotas existentes

| Arquivo                       | Rota                     | Descrição                        |
|-------------------------------|--------------------------|----------------------------------|
| `index.tsx`                   | `/`                      | Dashboard principal              |
| `buscador-de-valores.tsx`     | `/buscador-de-valores`   | Ferramenta de busca de produtos  |

---

## Registro técnico — react/jsx-runtime

### Erro

```
This JSX tag requires the module path 'react/jsx-runtime' to exist, but none could be found.
```

### Causa

O TypeScript perde a resolução de JSX quando a configuração de JSX e as tipagens do React não estão garantidas no escopo do projeto.

### Solução aplicada

- Confirmadas dependências de tipagem no `package.json`: `@types/react` e `@types/react-dom`.
- Garantida a configuração de JSX no `tsconfig.json` com:
  - `"jsx": "react-jsx"`
  - `"jsxImportSource": "react"`
  - `"types": ["react", "react-dom", "vite/client"]`

### Regra obrigatória para agentes futuros

Sempre que criar ou alterar componentes React nesta área (`src/pages` e arquivos relacionados):

1. Verifique no `package.json` se `react`, `react-dom`, `@types/react` e `@types/react-dom` estão presentes.
2. Verifique no `tsconfig` ativo se `jsx` está como `react-jsx`.
3. Garanta `jsxImportSource: "react"` e `types` contendo `react`, `react-dom` e `vite/client`.
4. Se qualquer item estiver ausente, ajuste antes de concluir a tarefa para evitar regressão do erro `react/jsx-runtime`.
