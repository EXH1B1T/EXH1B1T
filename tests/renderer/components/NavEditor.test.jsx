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
})
