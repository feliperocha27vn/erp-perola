import { createFileRoute, Link } from '@tanstack/react-router'
import {
  BarChart3,
  Building2,
  CalendarArrowUp,
  CalendarClock,
  LayoutDashboard,
  Package,
  PackagePlus,
  PieChart,
  Receipt,
  Send,
  TrendingUp,
} from 'lucide-react'
import { useGetDashboardCurrentMonthSales } from '@/api/hooks/dashboardController/useGetDashboardCurrentMonthSales'
import { useGetDashboardLastMonthSales } from '@/api/hooks/dashboardController/useGetDashboardLastMonthSales'
import { useGetDashboardMonthlySalesPace } from '@/api/hooks/dashboardController/useGetDashboardMonthlySalesPace'
import { MonthRevenueCard } from './-components/dashboard/month-revenue-card'
import { MonthlySalesPaceChart } from './-components/dashboard/monthly-sales-pace-chart'
import { RestockAlertCard } from './-components/dashboard/restock-alert-card'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  const {
    data: monthlySalesPaceData,
    isLoading: isMonthlySalesPaceLoading,
    isError: isMonthlySalesPaceError,
    refetch: refetchMonthlySalesPace,
  } = useGetDashboardMonthlySalesPace()

  const {
    data: lastMonthSalesData,
    isLoading: isLastMonthSalesLoading,
    isError: isLastMonthSalesError,
    refetch: refetchLastMonthSales,
  } = useGetDashboardLastMonthSales()

  const {
    data: currentMonthSalesData,
    isLoading: isCurrentMonthSalesLoading,
    isError: isCurrentMonthSalesError,
    refetch: refetchCurrentMonthSales,
  } = useGetDashboardCurrentMonthSales()

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="flex flex-col gap-6">
          <RestockAlertCard />

          <div className="grid grid-cols-2 gap-6">
            <MonthRevenueCard
              icon={CalendarClock}
              label="Vendas do mes atual"
              emptyMessage="Nenhuma venda registrada no mes atual."
              totalCents={currentMonthSalesData?.total_cents ?? 0}
              isLoading={isCurrentMonthSalesLoading}
              isError={isCurrentMonthSalesError}
              onRetry={() => refetchCurrentMonthSales()}
            />

            <MonthRevenueCard
              icon={CalendarArrowUp}
              label="Vendas do mes passado"
              emptyMessage="Nenhuma venda registrada no mes passado."
              totalCents={lastMonthSalesData?.total_cents ?? 0}
              isLoading={isLastMonthSalesLoading}
              isError={isLastMonthSalesError}
              onRetry={() => refetchLastMonthSales()}
            />
          </div>
        </div>

        <MonthlySalesPaceChart
          items={monthlySalesPaceData?.items ?? []}
          isLoading={isMonthlySalesPaceLoading}
          isError={isMonthlySalesPaceError}
          onRetry={() => refetchMonthlySalesPace()}
        />
      </div>

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
            search={{ page: 0, filter: 'all', sort: 'desc' }}
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
              Visualize a distribuição de estoque por marca, com colunas por
              local e totais por produto.
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

          <Link
            to="/lancamentos-de-estoque"
            search={{ period: '30' }}
            className="group relative flex flex-col text-left glass-card p-7 rounded-2xl glow-hover transition-all text-foreground hover:scale-[1.01]"
          >
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 w-fit mb-5 group-hover:bg-primary group-hover:text-white transition-all">
              <PackagePlus className="size-8" />
            </div>
            <h4 className="text-xl font-display font-semibold mb-2">
              Lançamentos de Estoque
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              Veja o histórico de entradas de estoque por período e marca.
              Registre reposições diretamente no produto.
            </p>
            <div className="mt-6 flex items-center text-primary font-semibold text-xs uppercase tracking-widest gap-2">
              Ver Lançamentos
              <PackagePlus className="size-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/relatorio-de-vendas"
            className="group relative flex flex-col text-left glass-card p-7 rounded-2xl glow-hover transition-all text-foreground hover:scale-[1.01]"
          >
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 w-fit mb-5 group-hover:bg-primary group-hover:text-white transition-all">
              <TrendingUp className="size-8" />
            </div>
            <h4 className="text-xl font-display font-semibold mb-2">
              Relatório de Vendas
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              Gere relatórios de vendas por período com SKU, loja, canal,
              depósito e valor. Exporte em CSV ou compartilhe o link.
            </p>
            <div className="mt-6 flex items-center text-primary font-semibold text-xs uppercase tracking-widest gap-2">
              Ver Relatório
              <TrendingUp className="size-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/relatorio-abc"
            className="group relative flex flex-col text-left glass-card p-7 rounded-2xl glow-hover transition-all text-foreground hover:scale-[1.01]"
          >
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 w-fit mb-5 group-hover:bg-primary group-hover:text-white transition-all">
              <PieChart className="size-8" />
            </div>
            <h4 className="text-xl font-display font-semibold mb-2">
              Curva ABC
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              Classifique os SKUs por faturamento em cada loja (A/B/C).
              Identifique os produtos mais estratégicos.
            </p>
            <div className="mt-6 flex items-center text-primary font-semibold text-xs uppercase tracking-widest gap-2">
              Ver Curva ABC
              <PieChart className="size-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/envios"
            className="group relative flex flex-col text-left glass-card p-7 rounded-2xl glow-hover transition-all text-foreground hover:scale-[1.01]"
          >
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 w-fit mb-5 group-hover:bg-primary group-hover:text-white transition-all">
              <Send className="size-8" />
            </div>
            <h4 className="text-xl font-display font-semibold mb-2">
              Envios para centro de distribuição
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              Crie e gerencie envios para centros de distribuição. Transfira
              estoque entre locais automaticamente.
            </p>
            <div className="mt-6 flex items-center text-primary font-semibold text-xs uppercase tracking-widest gap-2">
              Acessar Envios
              <Send className="size-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
