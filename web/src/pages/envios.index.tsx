import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Eye, PackageCheck, Plus, Send, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useDeleteShipmentsById } from '@/api/hooks/shipmentsController/useDeleteShipmentsById'
import { useGetShipments } from '@/api/hooks/shipmentsController/useGetShipments'
import { usePostShipmentsByIdConfirm } from '@/api/hooks/shipmentsController/usePostShipmentsByIdConfirm'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { queryClient } from '@/lib/react-query'

export const Route = createFileRoute('/envios/')({
  component: EnviosPage,
})

function statusBadge(status: 'rascunho' | 'confirmado') {
  if (status === 'confirmado') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <PackageCheck size={11} />
        Confirmado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
      <Send size={11} />
      Rascunho
    </span>
  )
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

function invalidateShipments() {
  queryClient.invalidateQueries({ queryKey: [{ url: '/shipments' }] })
}

function EnviosPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useGetShipments()
  const shipments = data?.shipments ?? []

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const deleteMutation = useDeleteShipmentsById({
    mutation: {
      onSuccess: () => {
        toast.success('Envio excluído.')
        setDeleteId(null)
        invalidateShipments()
      },
      onError: () => {
        toast.error('Erro ao excluir envio.')
      },
    },
  })

  const confirmMutation = usePostShipmentsByIdConfirm({
    mutation: {
      onSuccess: () => {
        toast.success('Envio confirmado! Estoque atualizado.')
        setConfirmId(null)
        invalidateShipments()
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error ?? 'Erro ao confirmar envio.'
        toast.error(msg)
        setConfirmId(null)
      },
    },
  })

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate({ to: '/' })}
            className="flex items-center justify-center w-9 h-9 rounded-full border border-border bg-card text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              ENVIOS
            </p>
            <h1 className="text-4xl font-display font-extrabold text-foreground">
              Envios para centro de distribuição
            </h1>
          </div>
        </div>
        <Button onClick={() => navigate({ to: '/envios/novo' })} className="gap-2">
          <Plus size={16} />
          Criar envio
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Table header */}
        <div className="flex items-center bg-muted border-b border-border h-11 px-6">
          <span className="flex-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            CONTA
          </span>
          <span className="w-36 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            DATA
          </span>
          <span className="w-20 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            ITENS
          </span>
          <span className="w-36 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            STATUS
          </span>
          <span className="w-48 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">
            AÇÕES
          </span>
        </div>

        {isLoading && (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            Carregando envios…
          </div>
        )}

        {!isLoading && (shipments.length === 0 || isError) && (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            Nenhum envio registrado ainda.{' '}
            <button
              type="button"
              className="underline text-primary"
              onClick={() => navigate({ to: '/envios/novo' })}
            >
              Criar o primeiro
            </button>
          </div>
        )}

        {shipments.map((s, i) => (
          <div
            key={s.id}
            className={`flex items-center h-[52px] px-6 border-b border-border last:border-b-0 ${
              i % 2 === 0 ? 'bg-card' : 'bg-background'
            }`}
          >
            <span className="flex-1 text-sm font-medium text-foreground">{s.account_name}</span>
            <span className="w-36 text-sm text-foreground">{formatDate(s.date)}</span>
            <span className="w-20 text-sm text-foreground">{s.item_count} SKUs</span>
            <span className="w-36">{statusBadge(s.status)}</span>
            <div className="w-48 flex items-center justify-end gap-2">
              {s.status === 'rascunho' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-8 text-xs"
                  onClick={() => setConfirmId(s.id)}
                >
                  <Send size={12} />
                  Confirmar
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-8 text-xs"
                onClick={() => navigate({ to: '/envios/novo', search: { shipmentId: s.id } })}
              >
                <Eye size={12} />
                Ver
              </Button>
              {s.status === 'rascunho' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-8 text-xs text-destructive hover:text-destructive"
                  onClick={() => setDeleteId(s.id)}
                >
                  <Trash2 size={12} />
                  Excluir
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir envio</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O envio será removido permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar envio</DialogTitle>
            <DialogDescription>
              Ao confirmar, o estoque será movimentado automaticamente. Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmId(null)}>
              Cancelar
            </Button>
            <Button
              disabled={confirmMutation.isPending}
              onClick={() => confirmId && confirmMutation.mutate({ id: confirmId })}
            >
              Confirmar envio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
