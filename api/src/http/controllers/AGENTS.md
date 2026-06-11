# AGENTS.md — http/controllers

Regras específicas para garantir nomes previsíveis na geração do Kubb a partir do OpenAPI.

---

## operationId é obrigatório em toda rota

Toda rota HTTP desta pasta deve definir `operationId` dentro de `schema`.

Motivo:
- Kubb usa `operationId` para nomear clients, hooks e types gerados.
- Sem `operationId`, o nome gerado pode ficar inconsistente ou menos legível.

Referência confirmada (Context7):
- OpenAPI define `operationId` como identificador único da operação.
- Kubb recomenda `operationId` descritivo e único para controlar nomes gerados.

---

## Padrão de nomenclatura do operationId

Use sempre verbos de ação + recurso + contexto, em camelCase.

Exemplos recomendados:
- `getProducts`
- `patchProductsIdImage`
- `getProductsProductIdStocks`
- `postProductsProductIdStocks`
- `patchStocksStockId`
- `deleteStocksStockId`

Regras:
- Deve ser único em toda a API.
- Não usar nomes genéricos como `get1`, `routeHandler`, `defaultOperation`.
- Manter `Id` (I maiúsculo) para melhorar legibilidade e evitar nomes estranhos em arquivos gerados.

---

## Exemplo de uso no controller

```ts
app.get(
  '/products/:productId/stocks',
  {
    schema: {
      operationId: 'getProductsProductIdStocks',
      tags: ['stocks'],
      description: 'Lista os estoques de um produto',
      params: z.object({
        productId: z.string().uuid(),
      }),
      response: {
        200: z.object({
          stocks: z.array(z.object({ id: z.string().uuid() })),
        }),
      },
    },
  },
  async (req, reply) => {
    return reply.send({ stocks: [] })
  },
)
```

---

## Fluxo obrigatório quando criar/alterar endpoint

1. Definir/ajustar `operationId` no `schema` da rota.
2. Garantir unicidade do `operationId` na API.
3. Atualizar o OpenAPI (`swagger.json`).
4. Rodar geração no frontend (`pnpm generate:api` em `web`).
5. Validar se nomes gerados bateram com o esperado (hooks/clients/types).
