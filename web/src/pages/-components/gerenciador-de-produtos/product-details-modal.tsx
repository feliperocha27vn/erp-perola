import { Copy, Save } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { parseDeveloperDetailsJson } from './product-details-json-parser'
import type { ProductItem } from './types'

export type ProductTechnicalDetailsForm = {
  technical_title: string
  technical_subtitle: string
  technical_analysis: string
  technical_movement: string
  technical_case_and_crystal: string
  technical_specific_functionality: string
  technical_dial_and_luminosity: string
  technical_bracelet_construction: string
  technical_table: string
}

type ProductDetailsModalProps = {
  open: boolean
  product: ProductItem | null
  isSaving: boolean
  onClose: () => void
  onSave: (details: ProductTechnicalDetailsForm) => Promise<void>
}

function buildFormFromProduct(
  product: ProductItem
): ProductTechnicalDetailsForm {
  return {
    technical_title: product.technical_title ?? '',
    technical_subtitle: product.technical_subtitle ?? '',
    technical_analysis: product.technical_analysis ?? '',
    technical_movement: product.technical_movement ?? '',
    technical_case_and_crystal: product.technical_case_and_crystal ?? '',
    technical_specific_functionality:
      product.technical_specific_functionality ?? '',
    technical_dial_and_luminosity: product.technical_dial_and_luminosity ?? '',
    technical_bracelet_construction:
      product.technical_bracelet_construction ?? '',
    technical_table: product.technical_table ?? '',
  }
}

export function ProductDetailsModal({
  open,
  product,
  isSaving,
  onClose,
  onSave,
}: ProductDetailsModalProps) {
  const [form, setForm] = useState<ProductTechnicalDetailsForm | null>(null)
  const [developerJsonOpen, setDeveloperJsonOpen] = useState(false)
  const [developerJsonValue, setDeveloperJsonValue] = useState('')
  const baseId = useId()
  const fieldIds = {
    title: `${baseId}-title`,
    subtitle: `${baseId}-subtitle`,
    analysis: `${baseId}-analysis`,
    movement: `${baseId}-movement`,
    caseAndCrystal: `${baseId}-case`,
    specificFunctionality: `${baseId}-function`,
    dialAndLuminosity: `${baseId}-dial`,
    braceletConstruction: `${baseId}-bracelet`,
    technicalTable: `${baseId}-table`,
    developerJson: `${baseId}-developer-json`,
  }

  useEffect(() => {
    if (!open || !product) {
      return
    }

    setForm(buildFormFromProduct(product))
    setDeveloperJsonOpen(false)
    setDeveloperJsonValue('')
  }, [open, product])

  const updateField = <K extends keyof ProductTechnicalDetailsForm>(
    key: K,
    value: ProductTechnicalDetailsForm[K]
  ) => {
    setForm(prev => {
      if (!prev) {
        return prev
      }

      return { ...prev, [key]: value }
    })
  }

  const handleSave = async () => {
    if (!form) {
      return
    }

    await onSave(form)
  }

  const handleCopyField = async (label: string, value: string) => {
    const normalized = value.trim()

    if (!normalized) {
      toast.error(`${label} está vazio para copiar.`)
      return
    }

    try {
      await navigator.clipboard.writeText(normalized)
      toast.success(`${label} copiado!`)
    } catch {
      toast.error(`Não foi possível copiar ${label}.`)
    }
  }

  const handleApplyDeveloperJson = () => {
    if (!developerJsonValue.trim()) {
      toast.error('Cole um JSON para preencher os detalhes.')
      return
    }

    try {
      const parsed = parseDeveloperDetailsJson(developerJsonValue)
      setForm(prev => (prev ? { ...prev, ...parsed } : prev))
      toast.success('Campos preenchidos a partir do JSON!')
      setDeveloperJsonOpen(false)
      setDeveloperJsonValue('')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao processar JSON.'
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={next => !next && onClose()}>
      <DialogContent className="!w-[92vw] sm:!w-[88vw] lg:!w-[82vw] xl:!w-[78vw] !max-w-none !h-[88vh] !max-h-[88vh] border-border bg-card text-foreground p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-card/95 backdrop-blur">
          <DialogTitle>Detalhes do Produto</DialogTitle>
          <DialogDescription>
            {product
              ? `${product.sku} — EAN: ${product.ean}`
              : 'Produto não selecionado'}
          </DialogDescription>
        </DialogHeader>

        {!form || !product ? null : (
          <div className="h-full overflow-y-auto px-6 py-5">
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
                SKU: {product.sku}
              </span>
              <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-foreground">
                EAN: {product.ean}
              </span>
            </div>

            <div className="space-y-5 pb-24">
              <section className="rounded-2xl border border-border bg-secondary/30 p-4">
                <h4 className="mb-3 text-sm font-semibold text-foreground">
                  Cabeçalho Comercial
                </h4>
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label
                        htmlFor={fieldIds.title}
                        className="text-sm text-muted-foreground"
                      >
                        Título
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() =>
                          handleCopyField('Título', form.technical_title)
                        }
                      >
                        <Copy className="size-3.5 mr-1" />
                        Copiar
                      </Button>
                    </div>
                    <Input
                      id={fieldIds.title}
                      value={form.technical_title}
                      onChange={e =>
                        updateField('technical_title', e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label
                        htmlFor={fieldIds.subtitle}
                        className="text-sm text-muted-foreground"
                      >
                        Subtítulo
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() =>
                          handleCopyField('Subtítulo', form.technical_subtitle)
                        }
                      >
                        <Copy className="size-3.5 mr-1" />
                        Copiar
                      </Button>
                    </div>
                    <Input
                      id={fieldIds.subtitle}
                      value={form.technical_subtitle}
                      onChange={e =>
                        updateField('technical_subtitle', e.target.value)
                      }
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-secondary/30 p-4">
                <h4 className="mb-3 text-sm font-semibold text-foreground">
                  Análise Técnica
                </h4>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label
                      htmlFor={fieldIds.analysis}
                      className="text-sm text-muted-foreground"
                    >
                      Análise Técnica
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() =>
                        handleCopyField(
                          'Análise Técnica',
                          form.technical_analysis
                        )
                      }
                    >
                      <Copy className="size-3.5 mr-1" />
                      Copiar
                    </Button>
                  </div>
                  <textarea
                    id={fieldIds.analysis}
                    value={form.technical_analysis}
                    onChange={e =>
                      updateField('technical_analysis', e.target.value)
                    }
                    className="min-h-32 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-secondary/30 p-4">
                <h4 className="mb-3 text-sm font-semibold text-foreground">
                  Diferenciais Técnicos
                </h4>
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label
                        htmlFor={fieldIds.movement}
                        className="text-sm text-muted-foreground"
                      >
                        Movimento
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() =>
                          handleCopyField('Movimento', form.technical_movement)
                        }
                      >
                        <Copy className="size-3.5 mr-1" />
                        Copiar
                      </Button>
                    </div>
                    <Input
                      id={fieldIds.movement}
                      value={form.technical_movement}
                      onChange={e =>
                        updateField('technical_movement', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label
                        htmlFor={fieldIds.caseAndCrystal}
                        className="text-sm text-muted-foreground"
                      >
                        Caixa e Cristal
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() =>
                          handleCopyField(
                            'Caixa e Cristal',
                            form.technical_case_and_crystal
                          )
                        }
                      >
                        <Copy className="size-3.5 mr-1" />
                        Copiar
                      </Button>
                    </div>
                    <Input
                      id={fieldIds.caseAndCrystal}
                      value={form.technical_case_and_crystal}
                      onChange={e =>
                        updateField(
                          'technical_case_and_crystal',
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label
                        htmlFor={fieldIds.specificFunctionality}
                        className="text-sm text-muted-foreground"
                      >
                        Funcionalidade Específica
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() =>
                          handleCopyField(
                            'Funcionalidade Específica',
                            form.technical_specific_functionality
                          )
                        }
                      >
                        <Copy className="size-3.5 mr-1" />
                        Copiar
                      </Button>
                    </div>
                    <Input
                      id={fieldIds.specificFunctionality}
                      value={form.technical_specific_functionality}
                      onChange={e =>
                        updateField(
                          'technical_specific_functionality',
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label
                        htmlFor={fieldIds.dialAndLuminosity}
                        className="text-sm text-muted-foreground"
                      >
                        Mostrador e Luminosidade
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() =>
                          handleCopyField(
                            'Mostrador e Luminosidade',
                            form.technical_dial_and_luminosity
                          )
                        }
                      >
                        <Copy className="size-3.5 mr-1" />
                        Copiar
                      </Button>
                    </div>
                    <Input
                      id={fieldIds.dialAndLuminosity}
                      value={form.technical_dial_and_luminosity}
                      onChange={e =>
                        updateField(
                          'technical_dial_and_luminosity',
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1.5 xl:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label
                        htmlFor={fieldIds.braceletConstruction}
                        className="text-sm text-muted-foreground"
                      >
                        Construção da Pulseira
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() =>
                          handleCopyField(
                            'Construção da Pulseira',
                            form.technical_bracelet_construction
                          )
                        }
                      >
                        <Copy className="size-3.5 mr-1" />
                        Copiar
                      </Button>
                    </div>
                    <Input
                      id={fieldIds.braceletConstruction}
                      value={form.technical_bracelet_construction}
                      onChange={e =>
                        updateField(
                          'technical_bracelet_construction',
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-secondary/30 p-4">
                <h4 className="mb-3 text-sm font-semibold text-foreground">
                  Tabela Técnica
                </h4>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label
                      htmlFor={fieldIds.technicalTable}
                      className="text-sm text-muted-foreground"
                    >
                      Tabela Técnica (Markdown)
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() =>
                        handleCopyField('Tabela Técnica', form.technical_table)
                      }
                    >
                      <Copy className="size-3.5 mr-1" />
                      Copiar
                    </Button>
                  </div>
                  <textarea
                    id={fieldIds.technicalTable}
                    value={form.technical_table}
                    onChange={e =>
                      updateField('technical_table', e.target.value)
                    }
                    className="min-h-64 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </section>

              <div className="sticky bottom-0 z-10 -mx-6 border-t border-border bg-card/95 px-6 py-3 backdrop-blur">
                {developerJsonOpen ? (
                  <div className="mb-3 rounded-2xl border border-border bg-secondary/20 p-3 space-y-3">
                    <div className="space-y-1">
                      <label
                        htmlFor={fieldIds.developerJson}
                        className="text-sm text-muted-foreground"
                      >
                        JSON do desenvolvedor
                      </label>
                      <textarea
                        id={fieldIds.developerJson}
                        value={developerJsonValue}
                        onChange={e => setDeveloperJsonValue(e.target.value)}
                        className="min-h-52 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Cole aqui o JSON padronizado"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setDeveloperJsonOpen(false)
                          setDeveloperJsonValue('')
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleApplyDeveloperJson}
                      >
                        Aplicar JSON
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDeveloperJsonOpen(prev => !prev)}
                    disabled={isSaving}
                  >
                    Preencher como desenvolvedor
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    <Save className="size-4 mr-2" />
                    {isSaving ? 'Salvando...' : 'Salvar Detalhes'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
