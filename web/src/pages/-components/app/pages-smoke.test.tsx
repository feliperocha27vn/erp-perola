import { describe, expect, it } from 'vitest'
import { AppErrorPage } from './app-error-page'
import { NotFoundPage } from './not-found-page'

describe('app pages smoke', () => {
  it('exports AppErrorPage component', () => {
    expect(typeof AppErrorPage).toBe('function')
  })

  it('exports NotFoundPage component', () => {
    expect(typeof NotFoundPage).toBe('function')
  })
})
