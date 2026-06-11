# AGENTS.md — src/components

Regras e convenções para componentes React nesta pasta.

---

## Regras gerais

### Nunca use index como `key` em listas

O linter (Biome) rejeita `key={i}` ou `key={index}` em elementos de lista. Use sempre um identificador estável e único do próprio dado.

```tsx
// ERRADO
items.map((item, i) => <div key={i} />)
items.map((item, i) => <div key={item.id + i} />)

// CORRETO — use um campo único do dado
items.map((item) => <div key={item.id} />)
items.map((item) => <div key={item.link} />)
```

Quando a lista é puramente estática e sem dados (ex: skeletons de loading), gere os identificadores fora do `.map`:

```tsx
// CORRETO para listas estáticas
Array.from({ length: 6 }, (_, i) => `skeleton-${i}`).map((id) => (
  <div key={id} />
))
```

### Não declare props não utilizadas

Remova props de interfaces e desestruturações se não forem usadas no corpo do componente. O linter reporta `'prop' is declared but its value is never read`.

### Navegação interna

Use `<Link>` do TanStack Router. Nunca use `<a href>` para rotas internas nem callbacks `onBack`.

```tsx
import { Link } from '@tanstack/react-router'

<Link to="/">Voltar</Link>
```

---

## Componentes

### `ValueSearcher.tsx`

Ferramenta de busca de produtos no Mercado Livre.

- Não recebe props.
- Faz `POST /search` com `{ product: string, min_price: number }`.
- O botão de voltar usa `<Link to="/" />` internamente.
- A `key` dos cards de produto usa `product.link` (campo único retornado pela API).
- A `key` dos skeletons de loading usa `skeleton-${i}` gerado antes do `.map`.
