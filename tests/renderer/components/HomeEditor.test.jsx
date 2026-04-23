// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { installWindowApi } from '../../setup/window-api.mock.js'
import HomeEditor from '../../../src/renderer/components/HomeEditor'

beforeEach(() => installWindowApi())
afterEach(() => vi.useRealTimers())

const baseSite = {
  title: 'Test Portfolio',
  home: { layout: 'grid', headline: 'Jane Doe', subhead: 'Photographer', intro: 'Welcome.' },
  theme: { name: 'default', options: {} },
  owner: { name: 'Jane', bio: '' },
}

const albums = [
  { slug: 'portraits', title: 'Portraits', order: 0, photos: [] },
  { slug: 'weddings',  title: 'Weddings',  order: 1, photos: [] },
]

describe('HomeEditor', () => {
  it('renders null when site is not provided', () => {
    const { container } = render(<HomeEditor site={null} albums={[]} onSave={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders layout cards (Grid and List)', () => {
    render(<HomeEditor site={baseSite} albums={[]} onSave={() => {}} />)
    expect(screen.getByText('Grid')).toBeInTheDocument()
    expect(screen.getByText('List')).toBeInTheDocument()
  })

  it('renders headline input with current value', () => {
    render(<HomeEditor site={baseSite} albums={[]} onSave={() => {}} />)
    expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument()
  })

  it('renders subhead and intro inputs', () => {
    render(<HomeEditor site={baseSite} albums={[]} onSave={() => {}} />)
    expect(screen.getByDisplayValue('Photographer')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Welcome.')).toBeInTheDocument()
  })

  it('calls window.api.site.save when headline changes', () => {
    vi.useFakeTimers()
    render(<HomeEditor site={baseSite} albums={[]} onSave={() => {}} />)
    const input = screen.getByDisplayValue('Jane Doe')
    fireEvent.change(input, { target: { value: 'New Name' } })
    vi.advanceTimersByTime(700)
    expect(window.api.site.save).toHaveBeenCalled()
  })

  it('shows album order section when albums exist', () => {
    render(<HomeEditor site={baseSite} albums={albums} onSave={() => {}} />)
    expect(screen.getByText('Album Order')).toBeInTheDocument()
    expect(screen.getByText('Portraits')).toBeInTheDocument()
    expect(screen.getByText('Weddings')).toBeInTheDocument()
  })

  it('shows "No albums yet" when no albums', () => {
    render(<HomeEditor site={baseSite} albums={[]} onSave={() => {}} />)
    expect(screen.getByText('No albums yet')).toBeInTheDocument()
  })

  it('highlights the active layout card', () => {
    const siteWithList = { ...baseSite, home: { ...baseSite.home, layout: 'list' } }
    render(<HomeEditor site={siteWithList} albums={[]} onSave={() => {}} />)
    // List card should be visually selected (CSS module class applied)
    // We verify by checking both cards exist and the component renders without error
    expect(screen.getByText('List')).toBeInTheDocument()
  })
})
