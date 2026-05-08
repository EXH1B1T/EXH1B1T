// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { installWindowApi } from '../../setup/window-api.mock.js'
import NavEditor from '../../../src/renderer/components/NavEditor'

beforeEach(() => installWindowApi())
afterEach(() => vi.useRealTimers())

const baseSite = {
  nav: {
    style: 'sidebar',
    homeVisible: true,
    aboutVisible: true,
    hiddenAlbums: [],
    links: [],
  },
  theme: { name: 'default', options: {} },
}

const albums = [
  { slug: 'portraits', title: 'Portraits', order: 0 },
  { slug: 'weddings',  title: 'Weddings',  order: 1 },
]

describe('NavEditor', () => {
  it('renders null when site is not provided', () => {
    const { container } = render(<NavEditor site={null} albums={[]} onSave={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders style cards (Sidebar and Hamburger)', () => {
    render(<NavEditor site={baseSite} albums={[]} onSave={() => {}} />)
    expect(screen.getByText('Sidebar')).toBeInTheDocument()
    expect(screen.getByText('Hamburger')).toBeInTheDocument()
  })

  it('renders Home and About toggles', () => {
    render(<NavEditor site={baseSite} albums={[]} onSave={() => {}} />)
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
    const switches = screen.getAllByRole('switch')
    expect(switches.length).toBeGreaterThanOrEqual(2)
  })

  it('Home toggle reflects homeVisible state', () => {
    render(<NavEditor site={baseSite} albums={[]} onSave={() => {}} />)
    const switches = screen.getAllByRole('switch')
    // First switch is Home, second is About
    expect(switches[0]).toHaveAttribute('aria-checked', 'true')
  })

  it('About toggle reflects aboutVisible state', () => {
    const site = { ...baseSite, nav: { ...baseSite.nav, aboutVisible: false } }
    render(<NavEditor site={site} albums={[]} onSave={() => {}} />)
    const switches = screen.getAllByRole('switch')
    expect(switches[1]).toHaveAttribute('aria-checked', 'false')
  })

  it('renders album rows with toggles', () => {
    render(<NavEditor site={baseSite} albums={albums} onSave={() => {}} />)
    expect(screen.getByText('Portraits')).toBeInTheDocument()
    expect(screen.getByText('Weddings')).toBeInTheDocument()
  })

  it('album toggle is checked when album is NOT in hiddenAlbums', () => {
    render(<NavEditor site={baseSite} albums={albums} onSave={() => {}} />)
    const switches = screen.getAllByRole('switch')
    // Home + About + 2 albums = 4 switches
    expect(switches[2]).toHaveAttribute('aria-checked', 'true')  // portraits visible
  })

  it('album toggle is unchecked when album IS in hiddenAlbums', () => {
    const site = { ...baseSite, nav: { ...baseSite.nav, hiddenAlbums: ['portraits'] } }
    render(<NavEditor site={site} albums={albums} onSave={() => {}} />)
    const switches = screen.getAllByRole('switch')
    expect(switches[2]).toHaveAttribute('aria-checked', 'false')
  })

  it('calls window.api.site.save when style card is clicked', () => {
    vi.useFakeTimers()
    render(<NavEditor site={baseSite} albums={[]} onSave={() => {}} />)
    fireEvent.click(screen.getByText('Hamburger'))
    vi.advanceTimersByTime(700)
    expect(window.api.site.save).toHaveBeenCalled()
  })

  it('adds a custom link when "Add custom link" is clicked', async () => {
    render(<NavEditor site={baseSite} albums={[]} onSave={() => {}} />)
    await userEvent.click(screen.getByText('Add custom link'))
    expect(screen.getByPlaceholderText('Label')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('https://…')).toBeInTheDocument()
  })

  it('removes a custom link when delete button is clicked', async () => {
    const site = {
      ...baseSite,
      nav: { ...baseSite.nav, links: [{ label: 'Blog', url: 'https://blog.me' }] },
    }
    render(<NavEditor site={site} albums={[]} onSave={() => {}} />)
    expect(screen.getByDisplayValue('Blog')).toBeInTheDocument()
    await userEvent.click(screen.getByTitle('Remove link'))
    expect(screen.queryByDisplayValue('Blog')).not.toBeInTheDocument()
  })

  it('saves when custom link label changes', () => {
    vi.useFakeTimers()
    const site = {
      ...baseSite,
      nav: { ...baseSite.nav, links: [{ label: 'Blog', url: 'https://blog.me' }] },
    }
    render(<NavEditor site={site} albums={[]} onSave={() => {}} />)
    fireEvent.change(screen.getByDisplayValue('Blog'), { target: { value: 'Journal' } })
    vi.advanceTimersByTime(700)
    expect(window.api.site.save).toHaveBeenCalledWith(
      expect.objectContaining({
        nav: expect.objectContaining({
          links: expect.arrayContaining([expect.objectContaining({ label: 'Journal' })]),
        }),
      })
    )
  })

  it('saves when custom link URL changes', () => {
    vi.useFakeTimers()
    const site = {
      ...baseSite,
      nav: { ...baseSite.nav, links: [{ label: 'Blog', url: 'https://blog.me' }] },
    }
    render(<NavEditor site={site} albums={[]} onSave={() => {}} />)
    fireEvent.change(screen.getByDisplayValue('https://blog.me'), { target: { value: 'https://new.me' } })
    vi.advanceTimersByTime(700)
    expect(window.api.site.save).toHaveBeenCalledWith(
      expect.objectContaining({
        nav: expect.objectContaining({
          links: expect.arrayContaining([expect.objectContaining({ url: 'https://new.me' })]),
        }),
      })
    )
  })

  it('calls site.save when Home toggle is clicked', () => {
    vi.useFakeTimers()
    render(<NavEditor site={baseSite} albums={[]} onSave={() => {}} />)
    const switches = screen.getAllByRole('switch')
    fireEvent.click(switches[0]) // Home toggle
    vi.advanceTimersByTime(700)
    expect(window.api.site.save).toHaveBeenCalledWith(
      expect.objectContaining({ nav: expect.objectContaining({ homeVisible: false }) })
    )
  })

  it('calls site.save when About toggle is clicked', () => {
    vi.useFakeTimers()
    render(<NavEditor site={baseSite} albums={[]} onSave={() => {}} />)
    const switches = screen.getAllByRole('switch')
    fireEvent.click(switches[1]) // About toggle
    vi.advanceTimersByTime(700)
    expect(window.api.site.save).toHaveBeenCalledWith(
      expect.objectContaining({ nav: expect.objectContaining({ aboutVisible: false }) })
    )
  })

  it('calls albums.reorder when album order changes via drag-drop', async () => {
    render(<NavEditor site={baseSite} albums={albums} onSave={() => {}} />)
    // Simulate drag-drop: dragstart on first row, drop on second
    const rows = document.querySelectorAll('[draggable]')
    expect(rows.length).toBeGreaterThanOrEqual(2)
    fireEvent.dragStart(rows[0], { dataTransfer: { effectAllowed: '', setData: () => {} } })
    fireEvent.dragOver(rows[1], { dataTransfer: { dropEffect: '' } })
    fireEvent.drop(rows[1], { dataTransfer: {} })
    expect(window.api.albums.reorder).toHaveBeenCalled()
  })
})
