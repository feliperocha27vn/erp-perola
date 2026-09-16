import { createFileRoute } from '@tanstack/react-router'
import { CalendarArrowUp, CalendarClock } from 'lucide-react'
import { useGetDashboardCurrentMonthSales } from '@/api/hooks/dashboardController/useGetDashboardCurrentMonthSales'
import { useGetDashboardLastMonthSales } from '@/api/hooks/dashboardController/useGetDashboardLastMonthSales'
import { useGetDashboardMonthlySalesPace } from '@/api/hooks/dashboardController/useGetDashboardMonthlySalesPace'
import { FullReplenishmentCard } from './-components/dashboard/full-replenishment-card'
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

      <MonthlySalesPaceChart
        items={monthlySalesPaceData?.items ?? []}
        isLoading={isMonthlySalesPaceLoading}
        isError={isMonthlySalesPaceError}
        onRetry={() => refetchMonthlySalesPace()}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <RestockAlertCard />

        <FullReplenishmentCard />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
  )
}
