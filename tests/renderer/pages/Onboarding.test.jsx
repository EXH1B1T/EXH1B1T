// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { installWindowApi } from '../../setup/window-api.mock.js'
import Onboarding from '../../../src/renderer/pages/Onboarding'

beforeEach(() => installWindowApi())
afterEach(() => vi.useRealTimers())

describe('Onboarding — Login screen', () => {
  it('renders EXH1B1T logotype', () => {
    render(<Onboarding onDone={() => {}} />)
    // Logo renders each character in a separate <span> — check the logo container's text
    const logo = document.querySelector('.logo')
    expect(logo).toBeInTheDocument()
    expect(logo.textContent).toBe('EXH1B1T')
  })

  it('renders tagline', () => {
    render(<Onboarding onDone={() => {}} />)
    expect(screen.getByText('Your portfolio. Free forever.')).toBeInTheDocument()
  })

  it('renders Login with GitHub button', () => {
    render(<Onboarding onDone={() => {}} />)
    expect(screen.getByText(/login with github/i)).toBeInTheDocument()
  })

  it('renders Sign up free link', () => {
    render(<Onboarding onDone={() => {}} />)
    expect(screen.getByText(/sign up free/i)).toBeInTheDocument()
  })
})

describe('Onboarding — Login flow', () => {
  it('shows device code screen after Login is clicked', async () => {
    window.api.auth.requestDeviceCode = vi.fn().mockResolvedValue({
      ok: true,
      user_code: 'ABCD-1234',
      verification_uri: 'https://github.com/login/device',
    })
    window.api.auth.pollToken = vi.fn(() => new Promise(() => {})) // hang

    render(<Onboarding onDone={() => {}} />)
    await userEvent.click(screen.getByText(/login with github/i))

    await waitFor(() => expect(screen.getByText('ABCD-1234')).toBeInTheDocument())
    expect(screen.getByText(/waiting for confirmation/i)).toBeInTheDocument()
  })

  it('shows error message when requestDeviceCode fails', async () => {
    window.api.auth.requestDeviceCode = vi.fn().mockResolvedValue({
      ok: false,
      error: 'Could not reach GitHub.',
    })
    render(<Onboarding onDone={() => {}} />)
    await userEvent.click(screen.getByText(/login with github/i))
    await waitFor(() => expect(screen.getByText(/could not reach github/i)).toBeInTheDocument())
  })

  it('shows checking screen after token is obtained', async () => {
    window.api.auth.requestDeviceCode = vi.fn().mockResolvedValue({
      ok: true, user_code: 'WXYZ-5678', verification_uri: 'https://github.com/login/device',
    })
    window.api.auth.pollToken = vi.fn().mockResolvedValue({
      ok: true, user: { login: 'alice' },
    })
    window.api.github.checkRepo = vi.fn(() => new Promise(() => {})) // hang at check

    render(<Onboarding onDone={() => {}} />)
    await userEvent.click(screen.getByText(/login with github/i))
    await waitFor(() => expect(screen.getByText(/setting up your portfolio/i)).toBeInTheDocument())
  })

  it('calls onDone after successful setup with new repo', async () => {
    const onDone = vi.fn()
    window.api.auth.requestDeviceCode = vi.fn().mockResolvedValue({
      ok: true, user_code: 'AAAA-1111', verification_uri: '',
    })
    window.api.auth.pollToken = vi.fn().mockResolvedValue({ ok: true })
    window.api.github.checkRepo = vi.fn().mockResolvedValue({ ok: true, repoExists: false, hasData: false })
    window.api.github.setupRepo = vi.fn().mockResolvedValue({ ok: true })

    render(<Onboarding onDone={onDone} />)
    await userEvent.click(screen.getByText(/login with github/i))
    await waitFor(() => expect(window.api.github.setupRepo).toHaveBeenCalled())
    // Component has 1 second delay before calling onDone — wait it out with real timers
    await waitFor(() => expect(onDone).toHaveBeenCalled(), { timeout: 2000 })
  })

  it('shows restore screen when repo has existing _data/', async () => {
    window.api.auth.requestDeviceCode = vi.fn().mockResolvedValue({ ok: true, user_code: 'BBBB-2222', verification_uri: '' })
    window.api.auth.pollToken = vi.fn().mockResolvedValue({ ok: true })
    window.api.github.checkRepo = vi.fn().mockResolvedValue({ ok: true, repoExists: true, hasData: true })

    render(<Onboarding onDone={() => {}} />)
    await userEvent.click(screen.getByText(/login with github/i))
    await waitFor(() => expect(screen.getByText(/found your existing site/i)).toBeInTheDocument())
    expect(screen.getByText(/restore from cloud/i)).toBeInTheDocument()
  })

  it('shows conflict screen when repo exists without _data/', async () => {
    window.api.auth.requestDeviceCode = vi.fn().mockResolvedValue({ ok: true, user_code: 'CCCC-3333', verification_uri: '' })
    window.api.auth.pollToken = vi.fn().mockResolvedValue({ ok: true })
    window.api.github.checkRepo = vi.fn().mockResolvedValue({ ok: true, repoExists: true, hasData: false })

    render(<Onboarding onDone={() => {}} />)
    await userEvent.click(screen.getByText(/login with github/i))
    await waitFor(() => expect(screen.getByText(/this repo is already in use/i)).toBeInTheDocument())
    expect(screen.getByText(/overwrite and start fresh/i)).toBeInTheDocument()
  })

  it('returns to login when Cancel is clicked on conflict screen', async () => {
    window.api.auth.requestDeviceCode = vi.fn().mockResolvedValue({ ok: true, user_code: 'DDDD-4444', verification_uri: '' })
    window.api.auth.pollToken = vi.fn().mockResolvedValue({ ok: true })
    window.api.github.checkRepo = vi.fn().mockResolvedValue({ ok: true, repoExists: true, hasData: false })

    render(<Onboarding onDone={() => {}} />)
    await userEvent.click(screen.getByText(/login with github/i))
    await waitFor(() => screen.getByText(/cancel/i))
    await userEvent.click(screen.getByText('Cancel'))
    await waitFor(() => expect(screen.getByText(/login with github/i)).toBeInTheDocument())
  })
})
