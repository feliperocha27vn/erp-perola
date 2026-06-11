import { useId, useState } from 'react'
import { usePatchProductsIdImage } from '@/api/hooks/productsController/usePatchProductsIdImage'
import { queryClient } from '@/lib/react-query'

interface UpdateProductImageFormProps {
  productId: string
  currentImageUrl?: string | null
}

export function UpdateProductImageForm({
  productId,
  currentImageUrl,
}: UpdateProductImageFormProps) {
  const imageUrlInputId = useId()
  const [url, setUrl] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const mutation = usePatchProductsIdImage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [{ url: '/products' }],
        })

        setSuccessMessage('Imagem atualizada com sucesso!')
        setUrl('')

        setTimeout(() => setSuccessMessage(''), 3000)
      },
      onError: (error: unknown) => {
        console.error('Erro ao atualizar imagem:', error)
      },
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    mutation.mutate({
      id: productId,
      data: { url_image: url },
    })
  }

  return (
    <div className="p-4 border rounded space-y-4 max-w-md">
      <h2 className="text-xl font-bold">Atualizar Imagem do Produto</h2>

      {currentImageUrl && (
        <div>
          <p className="text-sm text-gray-600 mb-2">Imagem atual:</p>
          <img
            src={currentImageUrl}
            alt="Produto"
            className="w-full h-48 object-cover rounded"
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor={imageUrlInputId}
            className="block text-sm font-medium mb-1"
          >
            URL da nova imagem
          </label>
          <input
            id={imageUrlInputId}
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://exemplo.com/imagem.jpg"
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending || !url.trim()}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
        >
          {mutation.isPending ? 'Salvando...' : 'Atualizar Imagem'}
        </button>
      </form>

      {successMessage && (
        <div className="p-3 bg-green-100 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      {mutation.isError && (
        <div className="p-3 bg-red-100 text-red-700 rounded">
          Erro ao atualizar imagem. Tente novamente.
        </div>
      )}
    </div>
  )
}
