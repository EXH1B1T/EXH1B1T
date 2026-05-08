// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { installWindowApi } from '../../setup/window-api.mock.js'
import AboutEditor from '../../../src/renderer/components/AboutEditor'

beforeEach(() => installWindowApi())
afterEach(() => vi.useRealTimers())

const baseSite = {
  owner:  { name: 'Jane Doe', bio: 'Portrait photographer.' },
  about:  { portrait: null, exhibitions: [] },
  social: { email: 'jane@example.com', instagram: null, facebook: null },
  theme:  { name: 'default', options: {} },
}

describe('AboutEditor', () => {
  it('renders null when site is not provided', () => {
    const { container } = render(<AboutEditor site={null} onSave={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders owner name input', () => {
    render(<AboutEditor site={baseSite} onSave={() => {}} />)
    expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument()
  })

  it('renders bio textarea', () => {
    render(<AboutEditor site={baseSite} onSave={() => {}} />)
    expect(screen.getByDisplayValue('Portrait photographer.')).toBeInTheDocument()
  })

  it('renders email input', () => {
    render(<AboutEditor site={baseSite} onSave={() => {}} />)
    expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument()
  })

  it('shows portrait empty state when no portrait', () => {
    render(<AboutEditor site={baseSite} onSave={() => {}} />)
    expect(screen.getByText(/click to choose a portrait/i)).toBeInTheDocument()
  })

  it('renders portrait image when portrait path is set', () => {
    const site = { ...baseSite, about: { portrait: '/Users/test/portrait.jpg', exhibitions: [] } }
    render(<AboutEditor site={site} onSave={() => {}} />)
    const img = screen.getByAltText('Portrait')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', expect.stringContaining('local://'))
  })

  it('shows "No entries yet" when exhibitions is empty', () => {
    render(<AboutEditor site={baseSite} onSave={() => {}} />)
    expect(screen.getByText(/no entries yet/i)).toBeInTheDocument()
  })

  it('calls window.api.site.save when name changes', () => {
    vi.useFakeTimers()
    render(<AboutEditor site={baseSite} onSave={() => {}} />)
    const nameInput = screen.getByDisplayValue('Jane Doe')
    fireEvent.change(nameInput, { target: { value: 'Jane Smith' } })
    vi.advanceTimersByTime(700)
    expect(window.api.site.save).toHaveBeenCalled()
  })

  it('adds exhibition when Add button is clicked', async () => {
    render(<AboutEditor site={baseSite} onSave={() => {}} />)
    await userEvent.click(screen.getByText('Add'))
    expect(screen.getByPlaceholderText(/exhibition or press title/i)).toBeInTheDocument()
  })

  it('removes exhibition when delete button is clicked', async () => {
    const site = {
      ...baseSite,
      about: {
        portrait: null,
        exhibitions: [{ title: 'Solo Show', venue: 'Gallery X', year: '2023' }],
      },
    }
    render(<AboutEditor site={site} onSave={() => {}} />)
    expect(screen.getByDisplayValue('Solo Show')).toBeInTheDocument()
    await userEvent.click(screen.getByTitle('Remove'))
    expect(screen.queryByDisplayValue('Solo Show')).not.toBeInTheDocument()
  })

  it('uses webUtils.getPathForFile when portrait file is selected', async () => {
    render(<AboutEditor site={baseSite} onSave={() => {}} />)
    const fileInput = document.querySelector('input[type="file"]')
    expect(fileInput).toBeInTheDocument()
    const file = new File(['data'], 'portrait.jpg', { type: 'image/jpeg' })
    await userEvent.upload(fileInput, file)
    expect(window.api.utils.getPathForFile).toHaveBeenCalledWith(file)
  })

  it('calls window.api.site.save when bio changes', () => {
    vi.useFakeTimers()
    render(<AboutEditor site={baseSite} onSave={() => {}} />)
    const bio = screen.getByDisplayValue('Portrait photographer.')
    fireEvent.change(bio, { target: { value: 'New bio' } })
    vi.advanceTimersByTime(700)
    expect(window.api.site.save).toHaveBeenCalledWith(
      expect.objectContaining({ owner: expect.objectContaining({ bio: 'New bio' }) })
    )
  })

  it('calls window.api.site.save when email changes', () => {
    vi.useFakeTimers()
    render(<AboutEditor site={baseSite} onSave={() => {}} />)
    const email = screen.getByDisplayValue('jane@example.com')
    fireEvent.change(email, { target: { value: 'new@example.com' } })
    vi.advanceTimersByTime(700)
    expect(window.api.site.save).toHaveBeenCalledWith(
      expect.objectContaining({ social: expect.objectContaining({ email: 'new@example.com' }) })
    )
  })

  it('calls window.api.site.save when exhibition title changes', () => {
    vi.useFakeTimers()
    const site = {
      ...baseSite,
      about: { portrait: null, exhibitions: [{ title: 'Show A', venue: 'Gallery', year: '2023' }] },
    }
    render(<AboutEditor site={site} onSave={() => {}} />)
    fireEvent.change(screen.getByDisplayValue('Show A'), { target: { value: 'Show B' } })
    vi.advanceTimersByTime(700)
    expect(window.api.site.save).toHaveBeenCalledWith(
      expect.objectContaining({
        about: expect.objectContaining({
          exhibitions: expect.arrayContaining([expect.objectContaining({ title: 'Show B' })]),
        }),
      })
    )
  })

  it('calls window.api.site.save when exhibition venue changes', () => {
    vi.useFakeTimers()
    const site = {
      ...baseSite,
      about: { portrait: null, exhibitions: [{ title: 'Show', venue: 'Old Venue', year: '2023' }] },
    }
    render(<AboutEditor site={site} onSave={() => {}} />)
    fireEvent.change(screen.getByDisplayValue('Old Venue'), { target: { value: 'New Venue' } })
    vi.advanceTimersByTime(700)
    expect(window.api.site.save).toHaveBeenCalled()
  })

  it('calls onSave callback after save', async () => {
    vi.useFakeTimers()
    const onSave = vi.fn()
    render(<AboutEditor site={baseSite} onSave={onSave} />)
    fireEvent.change(screen.getByDisplayValue('Jane Doe'), { target: { value: 'Jane Smith' } })
    vi.advanceTimersByTime(700)
    await Promise.resolve() // flush async callback after await window.api.site.save
    expect(onSave).toHaveBeenCalled()
  })

  it('portrait image uses local:// when portrait is a local path (https: already tested)', () => {
    const site = { ...baseSite, about: { portrait: '/Users/test/photo.jpg', exhibitions: [] } }
    render(<AboutEditor site={site} onSave={() => {}} />)
    const img = screen.getByAltText('Portrait')
    expect(img.src).toContain('local://')
    expect(img.src).not.toMatch(/^\/Users\//)
  })
})
