import { BrandManagerCreateDialog } from './create-dialog'
import { BrandManagerDeleteDialog } from './delete-dialog'
import { BrandManagerHeader } from './header'
import { BrandManagerRenameDialog } from './rename-dialog'
import { BrandManagerRoot } from './root'
import { BrandManagerTable } from './table'

export type { Brand } from './types'

export const BrandManager = {
  Root: BrandManagerRoot,
  Header: BrandManagerHeader,
  Table: BrandManagerTable,
  CreateDialog: BrandManagerCreateDialog,
  RenameDialog: BrandManagerRenameDialog,
  DeleteDialog: BrandManagerDeleteDialog,
}
