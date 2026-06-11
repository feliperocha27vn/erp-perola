import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { usePostFbaAnalyze } from '@/api/hooks/fbaController/usePostFbaAnalyze'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionErrorState } from '@/components/ui/section-error-state'
import { FbaAnalysis } from './-components/fba-analysis'

export const Route = createFileRoute('/analise-fba')({
  component: AnaliseFbaPage,
})

function AnaliseFbaPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const analysisMutation = usePostFbaAnalyze({
    mutation: {
      onError: error => {
        toast.error(error.response?.data?.error || 'Erro ao analisar CSV.')
      },
    },
  })

  const result = analysisMutation.data

  const fileName = selectedFile?.name ?? null
  const hasResult = Boolean(result)

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error('Selecione um arquivo CSV antes de analisar.')
      return
    }

    const csv_content = await selectedFile.text()

    analysisMutation.mutate({
      data: {
        csv_content,
      },
    })
  }

  const isBusy = analysisMutation.isPending

  const summary = useMemo(() => result?.summary, [result])

  return (
    <FbaAnalysis.Root>
      <FbaAnalysis.Header />

      <FbaAnalysis.UploadForm
        fileName={fileName}
        isLoading={isBusy}
        isDisabled={!selectedFile}
        onSelectFile={setSelectedFile}
        onSubmit={handleSubmit}
      />

      {analysisMutation.isError ? (
        <SectionErrorState
          title="Falha ao analisar arquivo"
          description="Nao foi possivel concluir a analise FBA com o arquivo enviado."
          onRetry={handleSubmit}
        />
      ) : null}

      {!hasResult &&
      !analysisMutation.isError &&
      !analysisMutation.isPending ? (
        <EmptyState
          title="Nenhuma analise executada"
          description="Envie o CSV de 90 dias para gerar recomendacoes de envio ao FBA."
        />
      ) : null}

      {summary ? <FbaAnalysis.SummaryCards summary={summary} /> : null}

      {summary?.analysis_source === 'fallback' ? (
        <SectionErrorState
          title="Analise em fallback"
          description="A recomendacao foi gerada pelo motor deterministico porque a analise do Gemini nao foi aplicada nesta execucao."
        />
      ) : null}

      {result?.items ? (
        <FbaAnalysis.RecommendationChart items={result.items} />
      ) : null}

      {result?.items ? <FbaAnalysis.ResultsTable items={result.items} /> : null}

      {result?.pending_items ? (
        <FbaAnalysis.PendingTable items={result.pending_items} />
      ) : null}
    </FbaAnalysis.Root>
  )
}
