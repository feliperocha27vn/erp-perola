import { useState } from 'react'
import { useGetProducts } from '@/api/hooks/productsController/useGetProducts'

export function ProductsList() {
  const [page, setPage] = useState(0)
  const [withoutImage, setWithoutImage] = useState(false)

  const { data, isLoading, isError, error } = useGetProducts({
    pageIndex: String(page),
    withoutImage: withoutImage ? 'true' : 'false',
  })

  if (isLoading) {
    return (
      <div className="p-4">
        <p>Carregando produtos...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-4 text-red-600">
        <p>Erro ao carregar produtos:</p>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={withoutImage}
              onChange={e => {
                setWithoutImage(e.target.checked)
                setPage(0) // Reset page quando filtrar
              }}
            />
            <span>Sem imagem</span>
          </label>
        </div>
      </div>

      <p className="text-sm text-gray-600">
        Total: {data?.total} produtos • Página {page + 1}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.items.map(product => (
          <div key={product.id} className="border rounded p-4 space-y-2">
            {product.url_image ? (
              <img
                src={product.url_image}
                alt={product.sku}
                className="w-full h-48 object-cover rounded"
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-gray-400">Sem imagem</span>
              </div>
            )}
            <h3 className="font-semibold">{product.sku}</h3>
            <p className="text-sm text-gray-600">EAN: {product.ean}</p>
            <p className="text-sm text-gray-600">
              Marca: {product.brand?.name ?? 'Sem marca'}
            </p>
            <div className="space-y-1">
              {product.stocks.length === 0 ? (
                <p className="text-sm text-gray-600">
                  Sem estoques cadastrados
                </p>
              ) : (
                product.stocks.map(stock => (
                  <p key={stock.id} className="text-sm text-gray-600">
                    {stock.title}: {stock.qtde}{' '}
                    {stock.full ? '(Full)' : '(Normal)'}
                  </p>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 pt-4">
        <button
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
          className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
        >
          ← Anterior
        </button>
        <span className="text-sm">
          Página {page + 1} de {Math.ceil((data?.total || 0) / 20)}
        </span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={(data?.items.length || 0) < 20}
          className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
        >
          Próxima →
        </button>
      </div>
    </div>
  )
}
