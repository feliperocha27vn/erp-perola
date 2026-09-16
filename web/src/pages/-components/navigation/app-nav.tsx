import { Link } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { signOut, useSession } from '@/lib/auth-client'
import { DASHBOARD_NAV_ITEM, NAV_GROUPS } from './nav-items'

const ITEM_CLASS =
  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-primary/10 data-[status=active]:text-primary [&_svg]:size-4 [&_svg]:shrink-0'

type AppNavProps = {
  /** Chamado a cada clique em item, para a gaveta mobile se fechar. */
  onNavigate?: () => void
}

/** Lista de navegação e conta, compartilhada pela sidebar e pela gaveta mobile. */
export function AppNav({ onNavigate }: AppNavProps) {
  const DashboardIcon = DASHBOARD_NAV_ITEM.icon

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <nav
        aria-label="Navegação principal"
        className="flex-1 space-y-6 overflow-y-auto px-3 py-4"
      >
        <Link
          {...DASHBOARD_NAV_ITEM.link}
          activeOptions={{ exact: true, includeSearch: false }}
          onClick={onNavigate}
          className={ITEM_CLASS}
        >
          <DashboardIcon />
          {DASHBOARD_NAV_ITEM.label}
        </Link>

        {NAV_GROUPS.map(group => (
          <div key={group.label} className="space-y-1">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/80">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(item => {
                const Icon = item.icon
                return (
                  <li key={item.link.to}>
                    <Link
                      {...item.link}
                      activeOptions={{ includeSearch: false }}
                      onClick={onNavigate}
                      className={ITEM_CLASS}
                    >
                      <Icon />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <NavAccount />
    </div>
  )
}

function NavAccount() {
  const { data } = useSession()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const user = data?.user
  const initial = user?.name?.trim().charAt(0).toUpperCase() ?? ''

  async function handleSignOut() {
    setIsSigningOut(true)
    const { error } = await signOut()
    if (error) {
      setIsSigningOut(false)
      toast.error('Não foi possível sair. Tente novamente.')
      return
    }
    // Recarrega a página, como o login faz: limpa o cache e as consultas do sininho.
    window.location.href = '/login'
  }

  return (
    <div className="flex items-center gap-3 border-t border-border px-4 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {user?.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={handleSignOut}
        disabled={isSigningOut}
        aria-label="Sair"
        title="Sair"
        className="text-muted-foreground hover:text-foreground"
      >
        <LogOut />
      </Button>
    </div>
  )
}
