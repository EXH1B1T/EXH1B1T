// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { installWindowApi } from '../../setup/window-api.mock.js'
import ThemePicker from '../../../src/renderer/components/ThemePicker'

beforeEach(() => {
  installWindowApi({
    theme: {
      list: vi.fn().mockResolvedValue([
        { name: 'lumen', description: 'Light editorial theme',
          previewBg: '#f9f8f5', previewSurface: '#edeae2',
          previewText: '#111111', previewMuted: '#d6d2c8', previewFont: 'Cormorant' },
        { name: 'noir', description: 'Dark cinematic theme',
          previewBg: '#0c0c0c', previewSurface: '#141414',
          previewText: '#ede9e1', previewMuted: '#252521', previewFont: 'Cormorant' },
      ]),
      getCurrent: vi.fn().mockResolvedValue('lumen'),
      install:    vi.fn().mockResolvedValue({ ok: true, name: 'new-theme' }),
      apply:      vi.fn().mockResolvedValue({ ok: true }),
      delete:     vi.fn().mockResolvedValue({ ok: true }),
    },
  })
})

describe('ThemePicker', () => {
  it('renders theme list after loading', async () => {
    render(<ThemePicker />)
    await waitFor(() => expect(screen.getByText('lumen')).toBeInTheDocument())
    expect(screen.getByText('noir')).toBeInTheDocument()
  })

  it('shows description for each theme', async () => {
    render(<ThemePicker />)
    await waitFor(() => expect(screen.getByText('Light editorial theme')).toBeInTheDocument())
    expect(screen.getByText('Dark cinematic theme')).toBeInTheDocument()
  })

  it('shows "IN USE" badge on the active theme', async () => {
    render(<ThemePicker />)
    await waitFor(() => expect(screen.getByText('IN USE')).toBeInTheDocument())
  })

  it('shows "Use" button on inactive themes', async () => {
    render(<ThemePicker />)
    await waitFor(() => expect(screen.getByText('Use')).toBeInTheDocument())
  })

  it('calls theme.apply when Use button is clicked', async () => {
    render(<ThemePicker />)
    await waitFor(() => screen.getByText('Use'))
    await userEvent.click(screen.getByText('Use'))
    expect(window.api.theme.apply).toHaveBeenCalledWith('noir')
  })

  it('changes active theme after applying', async () => {
    render(<ThemePicker />)
    await waitFor(() => screen.getByText('Use'))
    await userEvent.click(screen.getByText('Use'))
    await waitFor(() => expect(screen.getAllByText('IN USE')).toHaveLength(1))
  })

  it('renders Install Theme button', async () => {
    render(<ThemePicker />)
    expect(screen.getByText('Install Theme')).toBeInTheDocument()
  })

  it('renders Theme section title', async () => {
    render(<ThemePicker />)
    expect(screen.getByText('Theme')).toBeInTheDocument()
  })
})
