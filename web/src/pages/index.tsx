import { createFileRoute, Link } from '@tanstack/react-router'
import {
  BarChart3,
  Building2,
  LayoutDashboard,
  Package,
  Receipt,
} from 'lucide-react'
import { useGetDashboardLastMonthSales } from '@/api/hooks/dashboardController/useGetDashboardLastMonthSales'
import { useGetDashboardMonthlySales } from '@/api/hooks/dashboardController/useGetDashboardMonthlySales'
import { LastMonthRevenueCard } from './-components/dashboard/last-month-revenue-card'
import { MonthlyRevenueChart } from './-components/dashboard/monthly-revenue-chart'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  const {
    data: monthlySalesData,
    isLoading: isMonthlySalesLoading,
    isError: isMonthlySalesError,
    refetch: refetchMonthlySales,
  } = useGetDashboardMonthlySales()

  const {
    data: lastMonthSalesData,
    isLoading: isLastMonthSalesLoading,
    isError: isLastMonthSalesError,
    refetch: refetchLastMonthSales,
  } = useGetDashboardLastMonthSales()

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Bem-vindo de volta
          </h2>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-foreground">
            Painel de Controle
          </h1>
        </div>
      </div>

      <LastMonthRevenueCard
        totalCents={lastMonthSalesData?.total_cents ?? 0}
        isLoading={isLastMonthSalesLoading}
        isError={isLastMonthSalesError}
        onRetry={() => refetchLastMonthSales()}
      />

      <MonthlyRevenueChart
        items={monthlySalesData?.items ?? []}
        dailyAverageCents={monthlySalesData?.daily_average_cents ?? 0}
        isLoading={isMonthlySalesLoading}
        isError={isMonthlySalesError}
        onRetry={() => refetchMonthlySales()}
      />

      <div className="space-y-6">
        <h3 className="text-2xl font-display flex items-center gap-2 text-foreground">
          <LayoutDashboard className="size-6 text-primary" />
          Suas Ferramentas
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/vendas"
            className="group relative flex flex-col text-left glass-card p-7 rounded-2xl glow-hover transition-all text-foreground hover:scale-[1.01]"
          >
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 w-fit mb-5 group-hover:bg-primary group-hover:text-white transition-all">
              <Receipt className="size-8" />
            </div>
            <h4 className="text-xl font-display font-semibold mb-2">
              Gerenciador de Vendas
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              Registre vendas, aplique filtros por período e gerencie a baixa
              automática do seu estoque.
            </p>
            <div className="mt-6 flex items-center text-primary font-semibold text-xs uppercase tracking-widest gap-2">
              Acessar Vendas
              <Receipt className="size-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/gerenciador-de-produtos"
            search={{ page: 0, filter: 'all' }}
            className="group relative flex flex-col text-left glass-card p-7 rounded-2xl glow-hover transition-all text-foreground hover:scale-[1.01]"
          >
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 w-fit mb-5 group-hover:bg-primary group-hover:text-white transition-all">
              <Package className="size-8" />
            </div>
            <h4 className="text-xl font-display font-semibold mb-2">
              Gerenciador de Produtos
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              Gerencie imagens e dados dos produtos. Faça upload e organize o
              catálogo completo de relógios.
            </p>
            <div className="mt-6 flex items-center text-primary font-semibold text-xs uppercase tracking-widest gap-2">
              Acessar Ferramenta
              <Package className="size-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/relatorio-de-estoque"
            className="group relative flex flex-col text-left glass-card p-7 rounded-2xl glow-hover transition-all text-foreground hover:scale-[1.01]"
          >
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 w-fit mb-5 group-hover:bg-primary group-hover:text-white transition-all">
              <BarChart3 className="size-8" />
            </div>
            <h4 className="text-xl font-display font-semibold mb-2">
              Relatório de Estoque
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              Visualize a distribuição de estoque por marca, com colunas por local e totais por produto.
            </p>
            <div className="mt-6 flex items-center text-primary font-semibold text-xs uppercase tracking-widest gap-2">
              Ver Relatório
              <BarChart3 className="size-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/marcas"
            className="group relative flex flex-col text-left glass-card p-7 rounded-2xl glow-hover transition-all text-foreground hover:scale-[1.01]"
          >
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 w-fit mb-5 group-hover:bg-primary group-hover:text-white transition-all">
              <Building2 className="size-8" />
            </div>
            <h4 className="text-xl font-display font-semibold mb-2">
              Gerenciador de Marcas
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              Gerencie e organize as marcas do seu catálogo de produtos (ex:
              ORIENT, MONDAINE).
            </p>
            <div className="mt-6 flex items-center text-primary font-semibold text-xs uppercase tracking-widest gap-2">
              Acessar Gerenciador
              <Building2 className="size-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
