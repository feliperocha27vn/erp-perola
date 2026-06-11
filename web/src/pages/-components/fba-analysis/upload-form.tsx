import { Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

type FbaAnalysisUploadFormProps = {
  fileName: string | null
  isLoading: boolean
  isDisabled?: boolean
  onSelectFile: (file: File | null) => void
  onSubmit: () => void
}

export function FbaAnalysisUploadForm({
  fileName,
  isLoading,
  isDisabled = false,
  onSelectFile,
  onSubmit,
}: FbaAnalysisUploadFormProps) {
  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-display font-semibold">
          Importar relatorio de 90 dias
        </h2>
        <p className="text-sm text-muted-foreground">
          Arquivo CSV no formato Business Report da Amazon.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <input
          type="file"
          accept=".csv,text/csv"
          className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-primary file:font-medium hover:file:bg-primary/20"
          onChange={event => onSelectFile(event.target.files?.[0] ?? null)}
        />

        <Button
          onClick={onSubmit}
          disabled={isDisabled || isLoading}
          className="rounded-xl md:min-w-44"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Upload className="size-4" />
              Analisar CSV
            </>
          )}
        </Button>
      </div>

      {fileName ? (
        <p className="text-xs text-muted-foreground">
          Arquivo selecionado: {fileName}
        </p>
      ) : null}
    </div>
  )
}
