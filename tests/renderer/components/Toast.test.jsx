// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Toast, { showToast } from '../../../src/renderer/components/Toast'

describe('Toast', () => {
  it('renders nothing when no toasts', () => {
    const { container } = render(<Toast />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows error toast when showToast is called', async () => {
    render(<Toast />)
    act(() => showToast('Something went wrong', 'error'))
    expect(await screen.findByText('Something went wrong')).toBeInTheDocument()
  })

  it('shows success toast', async () => {
    render(<Toast />)
    act(() => showToast('Saved successfully', 'success'))
    expect(await screen.findByText('Saved successfully')).toBeInTheDocument()
  })

  it('shows info toast', async () => {
    render(<Toast />)
    act(() => showToast('Just so you know', 'info'))
    expect(await screen.findByText('Just so you know')).toBeInTheDocument()
  })

  it('defaults to error type when type is omitted', async () => {
    render(<Toast />)
    act(() => showToast('Default type'))
    expect(await screen.findByText('Default type')).toBeInTheDocument()
  })

  it('can display multiple toasts at once', async () => {
    render(<Toast />)
    act(() => {
      showToast('First error', 'error')
      showToast('Second error', 'error')
    })
    expect(await screen.findByText('First error')).toBeInTheDocument()
    expect(screen.getByText('Second error')).toBeInTheDocument()
  })

  it('removes toast when close button is clicked', async () => {
    render(<Toast />)
    act(() => showToast('Dismiss me', 'error'))
    await screen.findByText('Dismiss me')
    await userEvent.click(screen.getByLabelText('Dismiss'))
    expect(screen.queryByText('Dismiss me')).not.toBeInTheDocument()
  })

  it('has aria-live region for accessibility', async () => {
    render(<Toast />)
    act(() => showToast('Accessible message', 'info'))
    await screen.findByText('Accessible message')
    expect(screen.getByRole('log')).toBeInTheDocument()
  })
})
