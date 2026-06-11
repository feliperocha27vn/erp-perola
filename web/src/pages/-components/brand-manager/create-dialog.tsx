import { Dialog } from '@base-ui/react/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type BrandManagerCreateDialogProps = {
  open: boolean
  value: string
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onChange: (value: string) => void
  onSubmit: () => void
}

export function BrandManagerCreateDialog({
  open,
  value,
  isPending,
  onOpenChange,
  onChange,
  onSubmit,
}: BrandManagerCreateDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/60" />
        <Dialog.Viewport className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Popup className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
            <Dialog.Title className="text-xl font-bold text-foreground">
              Criar marca
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              Informe o nome da nova marca.
            </Dialog.Description>
            <div className="mt-4 space-y-4">
              <Input
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder="Nome da marca"
              />
              <div className="flex justify-end gap-2">
                <Dialog.Close className="inline-flex h-10 items-center rounded-md border border-border px-3 text-sm text-foreground">
                  Cancelar
                </Dialog.Close>
                <Button type="button" onClick={onSubmit} disabled={isPending}>
                  {isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
