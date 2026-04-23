// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { installWindowApi } from '../../setup/window-api.mock.js'
import UpdateBanner from '../../../src/renderer/components/UpdateBanner'

// Capture the callbacks registered via updater.onProgress / onReady
let progressCb = null
let readyCb    = null

beforeEach(() => {
  progressCb = null
  readyCb    = null
  installWindowApi({
    updater: {
      onAvailable: vi.fn(),
      onProgress:  vi.fn((cb) => { progressCb = cb }),
      onReady:     vi.fn((cb) => { readyCb    = cb }),
      install:     vi.fn(),
    },
  })
})

describe('UpdateBanner', () => {
  it('renders nothing initially (no update available)', () => {
    const { container } = render(<UpdateBanner />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows downloading state when progress event fires', () => {
    render(<UpdateBanner />)
    act(() => progressCb?.({ percent: 42, version: '1.1.0' }))
    expect(screen.getByText(/กำลังโหลดอัพเดท/)).toBeInTheDocument()
  })

  it('shows version number in downloading state', () => {
    render(<UpdateBanner />)
    act(() => progressCb?.({ percent: 50, version: '2.0.0' }))
    expect(screen.getByText(/v2\.0\.0/)).toBeInTheDocument()
  })

  it('shows ready state when download completes', () => {
    render(<UpdateBanner />)
    act(() => readyCb?.({ version: '1.1.0' }))
    expect(screen.getByText(/อัพเดทพร้อมแล้ว/)).toBeInTheDocument()
  })

  it('shows restart and dismiss buttons in ready state', () => {
    render(<UpdateBanner />)
    act(() => readyCb?.({ version: '1.1.0' }))
    expect(screen.getByText('รีสตาร์ท')).toBeInTheDocument()
    expect(screen.getByText('ทีหลัง')).toBeInTheDocument()
  })

  it('calls updater.install when restart button is clicked', async () => {
    render(<UpdateBanner />)
    act(() => readyCb?.({ version: '1.1.0' }))
    await userEvent.click(screen.getByText('รีสตาร์ท'))
    expect(window.api.updater.install).toHaveBeenCalled()
  })

  it('hides banner when dismiss button is clicked', async () => {
    const { container } = render(<UpdateBanner />)
    act(() => readyCb?.({ version: '1.1.0' }))
    expect(screen.getByText('ทีหลัง')).toBeInTheDocument()
    await userEvent.click(screen.getByText('ทีหลัง'))
    expect(container).toBeEmptyDOMElement()
  })

  it('does not re-show after dismiss even if progress fires again', async () => {
    const { container } = render(<UpdateBanner />)
    act(() => readyCb?.({ version: '1.1.0' }))
    await userEvent.click(screen.getByText('ทีหลัง'))
    // Banner should stay dismissed
    expect(container).toBeEmptyDOMElement()
  })
})
