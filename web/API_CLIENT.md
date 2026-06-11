# API Client Configuration

Este projeto utiliza **Kubb** para gerar automaticamente tipos TypeScript e hooks do TanStack Query baseados no OpenAPI Schema da API.

## 🛠 Tecnologias

- **Kubb**: Gerador de código baseado em OpenAPI/Swagger
- **TanStack Query (React Query)**: Gerenciamento de estado assíncrono
- **Axios**: Cliente HTTP
- **TypeScript**: Tipagem estática

## 📁 Estrutura Gerada

```
src/api/
├── clients/
│   └── axios-client.ts       # Cliente Axios configurado
├── hooks/
│   ├── productsController/
│   │   ├── useGetProducts.ts              # Hook para listar produtos
│   │   └── usePatchProductsIdImage.ts     # Hook para atualizar imagem
│   └── useGetHealth.ts       # Hook para health check
├── types/
│   └── productsController/
│       ├── GetProducts.ts                 # Tipos para listar produtos
│       └── PatchProductsIdImage.ts        # Tipos para atualizar imagem
└── index.ts                  # Exports principais
```

## 🚀 Uso

### 1. Gerar API Client

Sempre que o swagger.json da API for atualizado, execute:

```bash
pnpm generate:api
```

Isso irá:
- Ler o `swagger.json` da pasta `../api/`
- Gerar tipos TypeScript
- Gerar hooks do React Query
- Gerar cliente HTTP

### 2. Configurar Provider

O `QueryClientProvider` já está configurado no `src/main.tsx`:

```tsx
import { QueryClientProvider } from './lib/react-query'

<QueryClientProvider>
  <RouterProvider router={router} />
</QueryClientProvider>
```

### 3. Usar Hooks nos Componentes

#### Exemplo: Listar Produtos (Query)

```tsx
import { useGetProducts } from '@/api/hooks/productsController/useGetProducts'

function ProductsList() {
  const { data, isLoading, error } = useGetProducts({
    pageIndex: "0",
    withoutImage: "false"
  })

  if (isLoading) return <div>Carregando...</div>
  if (error) return <div>Erro: {error.message}</div>

  return (
    <div>
      <h1>Total: {data?.total}</h1>
      <ul>
        {data?.items.map((product) => (
          <li key={product.id}>
            {product.sku} - {product.marca}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

#### Exemplo: Atualizar Imagem (Mutation)

```tsx
import { usePatchProductsIdImage } from '@/api/hooks/productsController/usePatchProductsIdImage'
import { queryClient } from '@/lib/react-query'

function UpdateProductImage({ productId }: { productId: string }) {
  const mutation = usePatchProductsIdImage(productId, {
    mutation: {
      onSuccess: () => {
        // Invalidar query para refetch automático
        queryClient.invalidateQueries({ 
          queryKey: [{ url: '/products' }] 
        })
        console.log('Imagem atualizada com sucesso!')
      },
      onError: (error) => {
        console.error('Erro ao atualizar:', error)
      }
    }
  })

  const handleSubmit = (url_image: string) => {
    mutation.mutate({ url_image })
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      const formData = new FormData(e.currentTarget)
      handleSubmit(formData.get('url_image') as string)
    }}>
      <input 
        name="url_image" 
        type="url" 
        placeholder="URL da imagem"
        required 
      />
      <button 
        type="submit" 
        disabled={mutation.isPending}
      >
        {mutation.isPending ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  )
}
```

### 4. Paginação

```tsx
import { useState } from 'react'
import { useGetProducts } from '@/api/hooks/productsController/useGetProducts'

function PaginatedProducts() {
  const [page, setPage] = useState(0)
  
  const { data, isLoading } = useGetProducts({
    pageIndex: String(page),
  })

  return (
    <div>
      {data && (
        <>
          <ProductsList items={data.items} />
          <div>
            <button 
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Anterior
            </button>
            <span>Página {page + 1}</span>
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={data.items.length < 20}
            >
              Próxima
            </button>
          </div>
        </>
      )}
    </div>
  )
}
```

## ⚙️ Configuração Avançada

### TanStack Query Options

Configurado em `src/lib/react-query.tsx`:

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 minutos
      gcTime: 1000 * 60 * 10,         // 10 minutos
      retry: 3,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
})
```

### Axios Interceptors

Configurado em `src/api/clients/axios-client.ts`:

```tsx
// Request interceptor - adicionar autenticação
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor - tratamento de erros
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirecionar para login
    }
    return Promise.reject(error)
  }
)
```

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto web:

```env
VITE_API_URL=http://localhost:3333
```

## 📚 Boas Práticas

1. **Sempre regenerar após mudanças na API**
   ```bash
   pnpm generate:api
   ```

2. **Invalidar queries após mutations**
   ```tsx
   onSuccess: () => {
     queryClient.invalidateQueries({ queryKey: [{ url: '/products' }] })
   }
   ```

3. **Usar Suspense para loading states**
   ```tsx
   import { useGetProductsSuspense } from '@/api/hooks/productsController/useGetProducts'
   
   function Products() {
     const { data } = useGetProductsSuspense()
     // Não precisa verificar isLoading, Suspense cuida disso
     return <ProductsList items={data.items} />
   }
   ```

4. **Prefetch para melhor UX**
   ```tsx
   import { queryClient } from '@/lib/react-query'
   import { getProductsQueryOptions } from '@/api/hooks/productsController/useGetProducts'
   
   // Ao passar o mouse, fazer prefetch
   <Link 
     to="/products"
     onMouseEnter={() => {
       queryClient.prefetchQuery(getProductsQueryOptions())
     }}
   >
     Ver Produtos
   </Link>
   ```

## 🔧 Kubb Configuration

Arquivo `kubb.config.ts`:

```typescript
export default defineConfig({
  input: {
    path: "../api/swagger.json",  // Caminho do OpenAPI schema
  },
  output: {
    path: "./src/api",            // Onde gerar os arquivos
    clean: true,                  // Limpar antes de gerar
  },
  plugins: [
    pluginOas(),                  // Parse OpenAPI
    pluginTs(),                   // Gerar tipos TypeScript
    pluginClient(),               // Gerar cliente HTTP
    pluginTanstackQuery(),        // Gerar hooks React Query
  ],
})
```

## 📖 Referências

- [Kubb Documentation](https://kubb.dev)
- [TanStack Query Documentation](https://tanstack.com/query)
- [Axios Documentation](https://axios-http.com)
