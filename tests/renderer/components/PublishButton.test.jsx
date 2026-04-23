// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { installWindowApi } from '../../setup/window-api.mock.js'
import PublishButton from '../../../src/renderer/components/PublishButton'

beforeEach(() => installWindowApi())

describe('PublishButton', () => {
  it('renders Publish button', () => {
    render(<PublishButton siteUrl="https://testuser.github.io" />)
    expect(screen.getByText('Publish')).toBeInTheDocument()
  })

  it('does not show modal by default', () => {
    render(<PublishButton siteUrl="https://testuser.github.io" />)
    expect(screen.queryByText('Publishing')).not.toBeInTheDocument()
  })

  it('shows publishing modal when Publish is clicked', async () => {
    // Make publish.start hang (never resolves) to keep modal open
    window.api.publish.start = vi.fn(() => new Promise(() => {}))
    render(<PublishButton siteUrl="https://testuser.github.io" />)
    await userEvent.click(screen.getByText('Publish'))
    expect(screen.getByText('Publishing')).toBeInTheDocument()
  })

  it('shows progress steps in modal', async () => {
    window.api.publish.start = vi.fn(() => new Promise(() => {}))
    render(<PublishButton siteUrl="https://testuser.github.io" />)
    await userEvent.click(screen.getByText('Publish'))
    expect(screen.getByText('Preparing files')).toBeInTheDocument()
    expect(screen.getByText('Uploading to GitHub')).toBeInTheDocument()
    expect(screen.getByText('Deploying to Pages')).toBeInTheDocument()
  })

  it('shows success state after publish completes', async () => {
    window.api.publish.start = vi.fn().mockResolvedValue({ ok: true, url: 'https://testuser.github.io' })
    render(<PublishButton siteUrl="https://testuser.github.io" />)
    await userEvent.click(screen.getByText('Publish'))
    await waitFor(() => expect(screen.getByText('Published')).toBeInTheDocument())
    expect(screen.getByText('https://testuser.github.io')).toBeInTheDocument()
    expect(screen.getByText('Open site')).toBeInTheDocument()
  })

  it('shows error state when publish fails', async () => {
    window.api.publish.start = vi.fn().mockResolvedValue({ ok: false, error: 'Network error' })
    render(<PublishButton siteUrl="https://testuser.github.io" />)
    await userEvent.click(screen.getByText('Publish'))
    await waitFor(() => expect(screen.getByText('Publish failed')).toBeInTheDocument())
    expect(screen.getByText('Network error')).toBeInTheDocument()
  })

  it('shows Try again button on error', async () => {
    window.api.publish.start = vi.fn().mockResolvedValue({ ok: false, error: 'Timeout' })
    render(<PublishButton siteUrl="https://testuser.github.io" />)
    await userEvent.click(screen.getByText('Publish'))
    await waitFor(() => expect(screen.getByText('Try again')).toBeInTheDocument())
  })

  it('closes modal when Close is clicked in success state', async () => {
    window.api.publish.start = vi.fn().mockResolvedValue({ ok: true })
    render(<PublishButton siteUrl="https://testuser.github.io" />)
    await userEvent.click(screen.getByText('Publish'))
    await waitFor(() => screen.getByText('Close'))
    await userEvent.click(screen.getByText('Close'))
    expect(screen.queryByText('Published')).not.toBeInTheDocument()
  })

  it('registers onProgress handler when publishing starts', async () => {
    window.api.publish.start = vi.fn(() => new Promise(() => {}))
    render(<PublishButton siteUrl="https://testuser.github.io" />)
    await userEvent.click(screen.getByText('Publish'))
    expect(window.api.publish.onProgress).toHaveBeenCalled()
  })
})
