import { describe, expect, it } from 'vitest'
import { ProductCard } from './product-card'

describe('product card smoke', () => {
  it('exports ProductCard.Header component', () => {
    expect(typeof ProductCard.Header).toBe('function')
  })

  it('does not expose ProductCard.Actions after header menu refactor', () => {
    expect((ProductCard as { Actions?: unknown }).Actions).toBeUndefined()
  })
})
