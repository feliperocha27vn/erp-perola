import { Link } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { NotificationBell } from '../notifications/notification-bell'
import { AppNav } from './app-nav'

/**
 * Abaixo de lg é a barra do topo (menu, nome, sininho). A partir de lg vira só a
 * faixa transparente do sininho, porque a navegação está na sidebar.
 *
 * É um elemento só nos dois tamanhos porque o sininho não pode ser montado duas
 * vezes: cada instância guarda os próprios toasts e os duplicaria.
 */
export function AppTopBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 border-b border-border bg-card/95 px-4 backdrop-blur md:px-8 lg:pointer-events-none lg:h-auto lg:justify-end lg:border-0 lg:bg-transparent lg:px-12 lg:pt-4 lg:backdrop-blur-none print:hidden">
      <div className="flex items-center gap-2 lg:hidden">
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger
            aria-label="Abrir menu"
            className="-ml-2 flex size-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-secondary"
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent aria-describedby={undefined}>
            <div className="flex h-16 shrink-0 items-center px-6">
              <SheetTitle className="text-lg font-extrabold">
                ERP Pérola
              </SheetTitle>
            </div>
            <AppNav onNavigate={() => setIsMenuOpen(false)} />
          </SheetContent>
        </Sheet>
        <Link
          to="/"
          className="font-display text-lg font-extrabold text-foreground"
        >
          ERP Pérola
        </Link>
      </div>

      <NotificationBell className="pointer-events-auto" />
    </header>
  )
}
