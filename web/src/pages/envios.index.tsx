import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Eye, PackageCheck, Plus, Send, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useDeleteShipmentsById } from '@/api/hooks/shipmentsController/useDeleteShipmentsById'
import { useGetShipments } from '@/api/hooks/shipmentsController/useGetShipments'
import { usePostShipmentsByIdDispatch } from '@/api/hooks/shipmentsController/usePostShipmentsByIdDispatch'
import { usePostShipmentsByIdReceive } from '@/api/hooks/shipmentsController/usePostShipmentsByIdReceive'
import { ShipmentStatusBadge } from './-components/envios/status-badge'
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
  const [dispatchId, setDispatchId] = useState<string | null>(null)
  const [receiveId, setReceiveId] = useState<string | null>(null)

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

  const dispatchMutation = usePostShipmentsByIdDispatch({
    mutation: {
      onSuccess: () => {
        toast.success('Envio despachado. Estoque físico debitado.')
        setDispatchId(null)
        invalidateShipments()
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error ?? 'Erro ao despachar envio.'
        toast.error(msg)
        setDispatchId(null)
      },
    },
  })

  const receiveMutation = usePostShipmentsByIdReceive({
    mutation: {
      onSuccess: () => {
        toast.success('Entrada confirmada. Estoque do CD atualizado.')
        setReceiveId(null)
        invalidateShipments()
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error ?? 'Erro ao confirmar recebimento.'
        toast.error(msg)
        setReceiveId(null)
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
            <span className="w-36">
              <ShipmentStatusBadge status={s.status} />
            </span>
            <div className="w-48 flex items-center justify-end gap-2">
              {s.status === 'rascunho' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-8 text-xs"
                  onClick={() => setDispatchId(s.id)}
                >
                  <Send size={12} />
                  Despachar
                </Button>
              )}
              {s.status === 'em_transito' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-8 text-xs"
                  onClick={() => setReceiveId(s.id)}
                >
                  <PackageCheck size={12} />
                  Recebido
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

      {/* Dispatch Dialog */}
      <Dialog open={!!dispatchId} onOpenChange={(o) => !o && setDispatchId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Despachar envio</DialogTitle>
            <DialogDescription>
              O estoque físico será debitado agora. O estoque do centro de distribuição só é
              creditado quando você confirmar a entrada lá — até lá a mercadoria não conta como
              disponível para venda.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDispatchId(null)}>
              Cancelar
            </Button>
            <Button
              disabled={dispatchMutation.isPending}
              onClick={() => dispatchId && dispatchMutation.mutate({ id: dispatchId })}
            >
              Despachar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive Dialog */}
      <Dialog open={!!receiveId} onOpenChange={(o) => !o && setReceiveId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar entrada no CD</DialogTitle>
            <DialogDescription>
              Confirme apenas quando o centro de distribuição já tiver dado entrada. O estoque do
              depósito de destino será creditado e passará a contar nos dias de autonomia.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiveId(null)}>
              Cancelar
            </Button>
            <Button
              disabled={receiveMutation.isPending}
              onClick={() => receiveId && receiveMutation.mutate({ id: receiveId })}
            >
              Confirmar entrada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
