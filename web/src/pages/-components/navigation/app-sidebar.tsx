import { Link } from '@tanstack/react-router'
import { AppNav } from './app-nav'

/**
 * Sidebar fixa a partir de lg, não md: as tabelas desktop das páginas já entram
 * em md, e com a sidebar ao lado sobrariam ~464px para elas entre 768 e 1023px.
 */
export function AppSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card lg:flex print:hidden">
      <div className="flex h-16 shrink-0 items-center px-6">
        <Link
          to="/"
          className="font-display text-lg font-extrabold text-foreground"
        >
          ERP Pérola
        </Link>
      </div>
      <AppNav />
    </aside>
  )
}
