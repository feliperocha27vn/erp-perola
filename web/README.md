# Análise de Valores - Frontend

Frontend da aplicação de análise de valores de produtos, construído com React, TypeScript, Vite e TanStack Router.

## 🚀 Tecnologias

- **React 19** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **TanStack Router** - Roteamento type-safe
- **TanStack Query (React Query)** - Gerenciamento de estado assíncrono
- **Kubb** - Gerador de tipos e hooks baseado em OpenAPI
- **Axios** - Cliente HTTP
- **Tailwind CSS** - Estilização
- **Biome** - Linter e formatter

## 📦 Instalação

```bash
# Instalar dependências
pnpm install

# Copiar variáveis de ambiente
cp .env.example .env

# Gerar tipos e hooks da API
pnpm generate:api
```

## 🛠 Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev                  # Inicia servidor de desenvolvimento

# Build
pnpm build               # Build para produção

# Qualidade de código
pnpm lint                # Lint com Biome
pnpm format              # Format com Biome
pnpm check               # Lint + Format

# API
pnpm generate:api        # Gera tipos e hooks da API
```

## 🔌 API Client

Este projeto utiliza **Kubb** para gerar automaticamente tipos TypeScript e hooks do TanStack Query baseados no OpenAPI Schema da API backend.

### Regenerar API

Sempre que o `swagger.json` da API for atualizado:

```bash
pnpm generate:api
```

### Usar Hooks

```tsx
import { useGetProducts } from '@/api/hooks/productsController/useGetProducts'

function ProductsList() {
  const { data, isLoading } = useGetProducts({
    pageIndex: "0",
  })

  if (isLoading) return <div>Carregando...</div>

  return (
    <div>
      <h1>Total: {data?.total}</h1>
      {data?.items.map((product) => (
        <div key={product.id}>{product.sku}</div>
      ))}
    </div>
  )
}
```

Para mais informações, veja [API_CLIENT.md](./API_CLIENT.md) e [src/api/AGENTS.md](./src/api/AGENTS.md).

## 📁 Estrutura do Projeto

```
src/
├── api/                        # API client gerado pelo Kubb
│   ├── clients/
│   │   └── axios-client.ts    # Cliente Axios configurado (editável)
│   ├── hooks/                 # Hooks React Query (gerado)
│   ├── types/                 # Tipos TypeScript (gerado)
│   └── AGENTS.md              # Convenções do API client
├── components/                 # Componentes reutilizáveis
├── lib/
│   └── react-query.tsx        # Provider do TanStack Query
├── pages/                     # Páginas da aplicação
├── app.tsx                    # App root
└── main.tsx                   # Entry point
```

## ⚙️ Variáveis de Ambiente

```env
VITE_API_URL=http://localhost:3333
```

## 🎨 Estilização

O projeto utiliza **Tailwind CSS v4** com **shadcn/ui** para componentes.

### Adicionar novo componente

```bash
npx shadcn@latest add button
```

## 🧪 Desenvolvimento

### 1. Iniciar API backend

```bash
cd ../api
pnpm dev
```

### 2. Iniciar frontend

```bash
pnpm dev
```

O frontend estará disponível em `http://localhost:5173`

## 📚 Documentação

- [API Client Documentation](./API_CLIENT.md) - Como usar hooks e tipos gerados
- [src/api/AGENTS.md](./src/api/AGENTS.md) - Convenções e boas práticas
- [Kubb Documentation](https://kubb.dev)
- [TanStack Query Documentation](https://tanstack.com/query)
- [TanStack Router Documentation](https://tanstack.com/router)

