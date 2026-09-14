import { useEffect, useRef } from 'react'

const HIGHLIGHT_CLASS = 'row-highlight'

/** Igual à duração da animação `row-highlight` em index.css. */
const HIGHLIGHT_MS = 3200

/** Deixa a animação de entrada da página assentar antes de medir onde a linha está. */
const SETTLE_MS = 150

interface UseRowHighlightOptions {
  /** Valor do `data-highlight-key` da linha a destacar. */
  target: string | undefined
  /** true quando os dados chegaram e as linhas já estão na tela. */
  ready: boolean
  /** A linha não existe mais — o alerta deixou de valer entre a notificação e o clique. */
  onMissing: () => void
  /** Chamado depois da tentativa, achando ou não. Normalmente limpa o parâmetro da URL. */
  onDone: () => void
}

/**
 * Rola até a linha que uma notificação apontou e destaca ela por alguns
 * segundos. Levar para o topo de uma tabela de trinta linhas desfaria o
 * destaque que a notificação criou. Quando a mesma linha existe duas vezes
 * (tabela no desktop, card no mobile), usa a que está visível.
 */
export function useRowHighlight({
  target,
  ready,
  onMissing,
  onDone,
}: UseRowHighlightOptions) {
  const callbacks = useRef({ onMissing, onDone })

  useEffect(() => {
    callbacks.current = { onMissing, onDone }
  })

  useEffect(() => {
    if (!target || !ready) return

    const timer = window.setTimeout(() => {
      const candidates = document.querySelectorAll<HTMLElement>(
        `[data-highlight-key="${CSS.escape(target)}"]`,
      )
      const row = Array.from(candidates).find(
        element => element.getClientRects().length > 0,
      )

      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' })
        row.classList.add(HIGHLIGHT_CLASS)
        window.setTimeout(
          () => row.classList.remove(HIGHLIGHT_CLASS),
          HIGHLIGHT_MS,
        )
      } else {
        callbacks.current.onMissing()
      }

      callbacks.current.onDone()
    }, SETTLE_MS)

    return () => window.clearTimeout(timer)
  }, [target, ready])
}
