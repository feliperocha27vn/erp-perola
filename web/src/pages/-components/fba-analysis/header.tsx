import { BackToDashboardButton } from '@/components/back-to-dashboard-button'

export function FbaAnalysisHeader() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <BackToDashboardButton />
        <h1 className="text-4xl md:text-5xl font-display font-extrabold text-foreground">
          Analise FBA
        </h1>
      </div>
      <p className="text-muted-foreground max-w-3xl">
        Envie o relatorio de 90 dias da Amazon para receber recomendacao de
        quantidade para envio ao FBA, com foco em maximizar vendas e
        justificativa por SKU.
      </p>
    </div>
  )
}
