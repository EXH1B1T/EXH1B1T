// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { installWindowApi } from '../../setup/window-api.mock.js'
import Settings from '../../../src/renderer/pages/Settings'

beforeEach(() => installWindowApi())
afterEach(() => vi.useRealTimers())

describe('Settings', () => {
  it('renders Settings title', () => {
    render(<Settings onBack={() => {}} />)
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders back button', () => {
    render(<Settings onBack={() => {}} />)
    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument()
  })

  it('calls onBack when back button is clicked', async () => {
    const onBack = vi.fn()
    render(<Settings onBack={onBack} />)
    await userEvent.click(screen.getAllByRole('button')[0]) // back btn is first
    expect(onBack).toHaveBeenCalled()
  })

  it('renders all four tabs', () => {
    render(<Settings onBack={() => {}} />)
    expect(screen.getByText('Site Info')).toBeInTheDocument()
    expect(screen.getByText('Theme')).toBeInTheDocument()
    expect(screen.getByText('Domain')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
  })

  it('shows Site Info content by default', async () => {
    render(<Settings onBack={() => {}} />)
    await waitFor(() => expect(screen.getByText('SEO & Browser Tab')).toBeInTheDocument())
    expect(screen.getByText('Your Profile')).toBeInTheDocument()
    expect(screen.getByText('Social Links')).toBeInTheDocument()
  })

  it('switches to Domain tab when clicked', async () => {
    render(<Settings onBack={() => {}} />)
    await userEvent.click(screen.getByText('Domain'))
    await waitFor(() => expect(screen.getByText('Current URL')).toBeInTheDocument())
    expect(screen.getByText('Custom Domain')).toBeInTheDocument()
  })

  it('Domain tab shows user GitHub Pages URL', async () => {
    render(<Settings onBack={() => {}} />)
    await userEvent.click(screen.getByText('Domain'))
    await waitFor(() => expect(screen.getByText('testuser.github.io')).toBeInTheDocument())
  })

  it('switches to Analytics tab when clicked', async () => {
    render(<Settings onBack={() => {}} />)
    await userEvent.click(screen.getByText('Analytics'))
    await waitFor(() => expect(screen.getByText('Google Analytics')).toBeInTheDocument())
    expect(screen.getByPlaceholderText('G-XXXXXXXXXX')).toBeInTheDocument()
  })

  it('switches to Theme tab when clicked', async () => {
    render(<Settings onBack={() => {}} />)
    await userEvent.click(screen.getByText('Theme'))
    // ThemePicker renders — wait for theme list to load
    await waitFor(() => expect(screen.getByText('Install Theme')).toBeInTheDocument())
  })

  it('calls window.api.site.save when a field changes', async () => {
    render(<Settings onBack={() => {}} />)
    await waitFor(() => screen.getByText('SEO & Browser Tab'))
    const titleInput = screen.getByDisplayValue('My Portfolio')
    vi.useFakeTimers()
    fireEvent.change(titleInput, { target: { value: 'New Title' } })
    vi.advanceTimersByTime(700)
    expect(window.api.site.save).toHaveBeenCalled()
  })

  it('DNS guide shows 4 GitHub Pages IP addresses', async () => {
    render(<Settings onBack={() => {}} />)
    await userEvent.click(screen.getByText('Domain'))
    await waitFor(() => screen.getByText('DNS Setup'))
    expect(screen.getByText('185.199.108.153')).toBeInTheDocument()
    expect(screen.getByText('185.199.109.153')).toBeInTheDocument()
    expect(screen.getByText('185.199.110.153')).toBeInTheDocument()
    expect(screen.getByText('185.199.111.153')).toBeInTheDocument()
  })

  it('saves when custom domain input changes', async () => {
    render(<Settings onBack={() => {}} />)
    await userEvent.click(screen.getByText('Domain'))
    await waitFor(() => screen.getByText('Custom Domain'))
    vi.useFakeTimers()
    const domainInput = screen.getByPlaceholderText('yourname.photo')
    fireEvent.change(domainInput, { target: { value: 'mysite.com' } })
    vi.advanceTimersByTime(700)
    expect(window.api.site.save).toHaveBeenCalledWith(
      expect.objectContaining({ customDomain: 'mysite.com' })
    )
  })

  it('saves when Google Analytics ID changes', async () => {
    render(<Settings onBack={() => {}} />)
    await userEvent.click(screen.getByText('Analytics'))
    await waitFor(() => screen.getByPlaceholderText('G-XXXXXXXXXX'))
    vi.useFakeTimers()
    const gaInput = screen.getByPlaceholderText('G-XXXXXXXXXX')
    fireEvent.change(gaInput, { target: { value: 'G-ABC123456' } })
    vi.advanceTimersByTime(700)
    expect(window.api.site.save).toHaveBeenCalledWith(
      expect.objectContaining({ seo: expect.objectContaining({ googleAnalyticsId: 'G-ABC123456' }) })
    )
  })

  it('saves when site title changes', async () => {
    render(<Settings onBack={() => {}} />)
    await waitFor(() => screen.getByDisplayValue('My Portfolio'))
    vi.useFakeTimers()
    fireEvent.change(screen.getByDisplayValue('My Portfolio'), { target: { value: 'Studio X' } })
    vi.advanceTimersByTime(700)
    expect(window.api.site.save).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Studio X' })
    )
  })
})
