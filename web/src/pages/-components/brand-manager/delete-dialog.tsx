import { Dialog } from '@base-ui/react/dialog'
import { Button } from '@/components/ui/button'

type BrandManagerDeleteDialogProps = {
  open: boolean
  isPending: boolean
  brandName: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function BrandManagerDeleteDialog({
  open,
  isPending,
  brandName,
  onOpenChange,
  onConfirm,
}: BrandManagerDeleteDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/60" />
        <Dialog.Viewport className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Popup className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
            <Dialog.Title className="text-xl font-bold text-foreground">
              Excluir marca
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              Confirma a exclusão da marca {brandName}?
            </Dialog.Description>
            <div className="mt-4 flex justify-end gap-2">
              <Dialog.Close className="inline-flex h-10 items-center rounded-md border border-border px-3 text-sm text-foreground">
                Cancelar
              </Dialog.Close>
              <Button
                type="button"
                variant="destructive"
                onClick={onConfirm}
                disabled={isPending}
              >
                {isPending ? 'Excluindo...' : 'Excluir'}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
