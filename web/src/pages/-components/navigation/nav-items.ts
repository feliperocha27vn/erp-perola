import { linkOptions } from '@tanstack/react-router'
import {
  BarChart3,
  Building2,
  LayoutDashboard,
  Package,
  PackagePlus,
  PackageSearch,
  PieChart,
  Receipt,
  Send,
  TrendingUp,
  Warehouse,
} from 'lucide-react'

/*
 * Cada link abre a página do zero: o search leva só os padrões, então filtros
 * aplicados e ?destaque= vindo de notificação são descartados. O voltar do
 * navegador recupera o filtro anterior.
 */

export const DASHBOARD_NAV_ITEM = {
  label: 'Painel',
  icon: LayoutDashboard,
  link: linkOptions({ to: '/' }),
}

export const NAV_GROUPS = [
  {
    label: 'Operação',
    items: [
      { label: 'Vendas', icon: Receipt, link: linkOptions({ to: '/vendas' }) },
      {
        label: 'Produtos',
        icon: Package,
        link: linkOptions({
          to: '/gerenciador-de-produtos',
          search: { page: 0, filter: 'all', sort: 'desc' },
        }),
      },
      {
        label: 'Marcas',
        icon: Building2,
        link: linkOptions({ to: '/marcas' }),
      },
      {
        label: 'Lançamentos de Estoque',
        icon: PackagePlus,
        link: linkOptions({
          to: '/lancamentos-de-estoque',
          search: { period: '30' },
        }),
      },
      { label: 'Envios', icon: Send, link: linkOptions({ to: '/envios' }) },
    ],
  },
  {
    // "Alertas", não "Reposição": abastecer o Full não é reposição (ver CONTEXT.md).
    label: 'Alertas',
    items: [
      {
        label: 'Alertas de Reposição',
        icon: PackageSearch,
        link: linkOptions({
          to: '/alertas-de-reposicao',
          search: { brand: undefined },
        }),
      },
      {
        label: 'Abastecimento do Full',
        icon: Warehouse,
        link: linkOptions({
          to: '/abastecimento-do-full',
          search: { destaque: undefined },
        }),
      },
    ],
  },
  {
    label: 'Relatórios',
    items: [
      {
        label: 'Relatório de Estoque',
        icon: BarChart3,
        link: linkOptions({ to: '/relatorio-de-estoque' }),
      },
      {
        label: 'Relatório de Vendas',
        icon: TrendingUp,
        link: linkOptions({ to: '/relatorio-de-vendas' }),
      },
      {
        label: 'Curva ABC',
        icon: PieChart,
        link: linkOptions({ to: '/relatorio-abc' }),
      },
    ],
  },
]
