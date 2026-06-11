import { Package } from 'lucide-react'

type ProductImageProps = {
  imageUrl: string | null
  alt: string
}

const fallbackImage =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjY2IiBmb250LXNpemU9IjE2Ij5FcnJvPC90ZXh0Pgo8L3N2Zz4='

export function ProductImage({ imageUrl, alt }: ProductImageProps) {
  return (
    <div className="aspect-square rounded-xl overflow-hidden bg-white border border-border p-3 md:p-4">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={alt}
          className="w-full h-full object-contain transition-transform hover:scale-[1.02]"
          onError={e => {
            const target = e.target as HTMLImageElement
            target.src = fallbackImage
          }}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
          <Package className="size-12 mb-2 opacity-30" />
          <span className="text-sm">Sem imagem</span>
        </div>
      )}
    </div>
  )
}
