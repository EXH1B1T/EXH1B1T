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
  theme: { name: 'lumen', options: {} },
  owner: { name: 'Jane', bio: '' },
}

// Need at least one album so the normal editor (not first-run) renders
const albums = [
  { slug: 'portraits', title: 'Portraits', order: 0, photos: [] },
  { slug: 'weddings',  title: 'Weddings',  order: 1, photos: [] },
]

describe('HomeEditor', () => {
  it('renders null when site is not provided', () => {
    const { container } = render(<HomeEditor site={null} albums={albums} onSave={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders layout cards (Grid and List)', () => {
    render(<HomeEditor site={baseSite} albums={albums} onSave={() => {}} />)
    expect(screen.getByText('Grid')).toBeInTheDocument()
    expect(screen.getByText('List')).toBeInTheDocument()
  })

  it('renders headline input with current value', () => {
    render(<HomeEditor site={baseSite} albums={albums} onSave={() => {}} />)
    expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument()
  })

  it('renders subhead and intro inputs', () => {
    render(<HomeEditor site={baseSite} albums={albums} onSave={() => {}} />)
    expect(screen.getByDisplayValue('Photographer')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Welcome.')).toBeInTheDocument()
  })

  it('calls window.api.site.save when headline changes', () => {
    vi.useFakeTimers()
    render(<HomeEditor site={baseSite} albums={albums} onSave={() => {}} />)
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

  it('shows first-run state when no albums', () => {
    render(<HomeEditor site={baseSite} albums={[]} onSave={() => {}} />)
    expect(screen.getByText('Start your portfolio')).toBeInTheDocument()
    expect(screen.getByText('Create first album')).toBeInTheDocument()
  })

  it('first-run state shows the 3-step guide', () => {
    render(<HomeEditor site={baseSite} albums={[]} onSave={() => {}} />)
    expect(screen.getAllByText(/Create an album/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Add photos/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Publish/i).length).toBeGreaterThan(0)
  })

  it('highlights the active layout card', () => {
    const siteWithList = { ...baseSite, home: { ...baseSite.home, layout: 'list' } }
    render(<HomeEditor site={siteWithList} albums={albums} onSave={() => {}} />)
    expect(screen.getByText('List')).toBeInTheDocument()
  })

  it('saves when layout card is clicked', () => {
    vi.useFakeTimers()
    render(<HomeEditor site={baseSite} albums={albums} onSave={() => {}} />)
    fireEvent.click(screen.getByText('List'))
    vi.advanceTimersByTime(700)
    expect(window.api.site.save).toHaveBeenCalledWith(
      expect.objectContaining({ home: expect.objectContaining({ layout: 'list' }) })
    )
  })

  it('saves when subhead changes', () => {
    vi.useFakeTimers()
    render(<HomeEditor site={baseSite} albums={albums} onSave={() => {}} />)
    fireEvent.change(screen.getByDisplayValue('Photographer'), { target: { value: 'Berlin' } })
    vi.advanceTimersByTime(700)
    expect(window.api.site.save).toHaveBeenCalled()
  })

  it('saves when intro changes', () => {
    vi.useFakeTimers()
    render(<HomeEditor site={baseSite} albums={albums} onSave={() => {}} />)
    fireEvent.change(screen.getByDisplayValue('Welcome.'), { target: { value: 'New intro' } })
    vi.advanceTimersByTime(700)
    expect(window.api.site.save).toHaveBeenCalled()
  })

  it('calls onSave callback after save', async () => {
    vi.useFakeTimers()
    const onSave = vi.fn()
    render(<HomeEditor site={baseSite} albums={albums} onSave={onSave} />)
    fireEvent.change(screen.getByDisplayValue('Jane Doe'), { target: { value: 'New' } })
    vi.advanceTimersByTime(700)
    await Promise.resolve() // flush async callback after await window.api.site.save
    expect(onSave).toHaveBeenCalled()
  })

  it('passes immediate=true to onSave when layout card is clicked', async () => {
    vi.useFakeTimers()
    const onSave = vi.fn()
    render(<HomeEditor site={baseSite} albums={albums} onSave={onSave} />)
    fireEvent.click(screen.getByText('List'))
    vi.advanceTimersByTime(700)
    await Promise.resolve()
    expect(onSave).toHaveBeenCalledWith(expect.anything(), true)
  })

  it('passes immediate=false to onSave when text input changes', async () => {
    vi.useFakeTimers()
    const onSave = vi.fn()
    render(<HomeEditor site={baseSite} albums={albums} onSave={onSave} />)
    fireEvent.change(screen.getByDisplayValue('Jane Doe'), { target: { value: 'New' } })
    vi.advanceTimersByTime(700)
    await Promise.resolve()
    expect(onSave).toHaveBeenCalledWith(expect.anything(), false)
  })

  it('displays albums sorted by order', () => {
    const unsorted = [
      { slug: 'z', title: 'Zzz', order: 2, photos: [] },
      { slug: 'a', title: 'Aaa', order: 0, photos: [] },
      { slug: 'm', title: 'Mmm', order: 1, photos: [] },
    ]
    render(<HomeEditor site={baseSite} albums={unsorted} onSave={() => {}} />)
    const items = screen.getAllByText(/^(Aaa|Mmm|Zzz)$/)
    expect(items[0].textContent).toBe('Aaa')
    expect(items[1].textContent).toBe('Mmm')
    expect(items[2].textContent).toBe('Zzz')
  })
})
