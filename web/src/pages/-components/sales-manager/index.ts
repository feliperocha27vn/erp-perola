import { SalesManagerBrandBreakdown } from './brand-breakdown'
import { SalesManagerDeleteDialog } from './delete-dialog'
import { SalesManagerFilters } from './filters'
import { SalesManagerHeader } from './header'
import { SalesManagerRoot } from './root'
import { SalesManagerSaleFormDialog } from './sale-form-dialog'
import { SalesManagerTable } from './table'
import { SalesManagerViewDialog } from './view-dialog'

export type {
  ProductItem,
  ProductStockItem,
  SaleFormValues,
  SaleItem,
} from './types'

export const SalesManager = {
  Root: SalesManagerRoot,
  Header: SalesManagerHeader,
  Filters: SalesManagerFilters,
  BrandBreakdown: SalesManagerBrandBreakdown,
  Table: SalesManagerTable,
  SaleFormDialog: SalesManagerSaleFormDialog,
  ViewDialog: SalesManagerViewDialog,
  DeleteDialog: SalesManagerDeleteDialog,
}
