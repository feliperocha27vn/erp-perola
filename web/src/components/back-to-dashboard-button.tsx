import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function BackToDashboardButton() {
  return (
    <Link to="/">
      <Button
        variant="outline"
        size="icon"
        className="rounded-full"
        aria-label="Voltar ao dashboard"
        title="Voltar ao dashboard"
        type="button"
      >
        <ArrowLeft className="size-4" />
      </Button>
    </Link>
  )
}
