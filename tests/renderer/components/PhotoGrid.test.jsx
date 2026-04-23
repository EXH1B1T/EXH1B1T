// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { installWindowApi } from '../../setup/window-api.mock.js'
import PhotoGrid from '../../../src/renderer/components/PhotoGrid'

beforeEach(() => installWindowApi())
afterEach(() => vi.useRealTimers())

const PHOTOS = [
  { filename: 'a.jpg', altText: 'Photo A', url: 'https://cdn/a.jpg', width: 1920, height: 1080, order: 0 },
  { filename: 'b.jpg', altText: 'Photo B', url: 'https://cdn/b.jpg', width: 800,  height: 600,  order: 1 },
]

describe('PhotoGrid', () => {
  it('shows empty state when no photos', () => {
    render(<PhotoGrid photos={[]} />)
    expect(screen.getByText(/no photos/i)).toBeInTheDocument()
  })

  it('renders an img for each photo', () => {
    render(<PhotoGrid photos={PHOTOS} coverFilename="a.jpg" />)
    const imgs = screen.getAllByRole('img')
    expect(imgs).toHaveLength(2)
  })

  it('uses photo.url as img src', () => {
    render(<PhotoGrid photos={PHOTOS} coverFilename="a.jpg" />)
    expect(screen.getByAltText('Photo A')).toHaveAttribute('src', 'https://cdn/a.jpg')
  })

  it('uses local:// URL when photo has localPath and no url', () => {
    const photos = [{ filename: 'local.jpg', altText: 'Local', url: null, localPath: '/Users/test/local.jpg', width: 100, height: 100, order: 0 }]
    render(<PhotoGrid photos={photos} coverFilename={null} />)
    expect(screen.getByAltText('Local')).toHaveAttribute('src', expect.stringContaining('local://'))
  })

  it('shows COVER badge on cover photo', () => {
    render(<PhotoGrid photos={PHOTOS} coverFilename="a.jpg" />)
    expect(screen.getByText('COVER')).toBeInTheDocument()
  })

  it('calls onSetCover with filename when star button is clicked', async () => {
    const onSetCover = vi.fn()
    render(<PhotoGrid photos={PHOTOS} coverFilename="a.jpg" onSetCover={onSetCover} onDelete={() => {}} />)
    // Hover to reveal overlay, then click cover button
    // Since overlay is CSS-only hover, we need to find buttons in DOM
    const coverBtns = screen.getAllByTitle('Set as cover')
    await userEvent.click(coverBtns[1]) // second photo
    expect(onSetCover).toHaveBeenCalledWith('b.jpg')
  })

  it('calls onDelete with filename when trash button is clicked', async () => {
    const onDelete = vi.fn()
    render(<PhotoGrid photos={PHOTOS} coverFilename="a.jpg" onSetCover={() => {}} onDelete={onDelete} />)
    const deleteBtns = screen.getAllByTitle('Delete')
    await userEvent.click(deleteBtns[0])
    expect(onDelete).toHaveBeenCalledWith('a.jpg')
  })

  it('opens edit panel when pencil button is clicked', async () => {
    render(<PhotoGrid photos={PHOTOS} coverFilename="a.jpg" onSetCover={() => {}} onDelete={() => {}} />)
    const editBtns = screen.getAllByTitle('Edit caption / alt text')
    await userEvent.click(editBtns[0])
    expect(screen.getByText('Photo Details')).toBeInTheDocument()
  })

  it('closes edit panel when X button is clicked', async () => {
    render(<PhotoGrid photos={PHOTOS} coverFilename="a.jpg" onSetCover={() => {}} onDelete={() => {}} />)
    const editBtns = screen.getAllByTitle('Edit caption / alt text')
    await userEvent.click(editBtns[0])
    expect(screen.getByText('Photo Details')).toBeInTheDocument()

    // Click the editOverlay backdrop to close the panel
    const overlay = document.querySelector('[class*="editOverlay"]')
    expect(overlay).toBeTruthy()
    await userEvent.click(overlay)
    expect(screen.queryByText('Photo Details')).not.toBeInTheDocument()
  })

  it('calls onPhotoUpdate after editing caption (with debounce)', () => {
    const onPhotoUpdate = vi.fn()
    render(<PhotoGrid photos={PHOTOS} coverFilename="a.jpg" onSetCover={() => {}} onDelete={() => {}} onPhotoUpdate={onPhotoUpdate} />)

    const editBtns = screen.getAllByTitle('Edit caption / alt text')
    fireEvent.click(editBtns[0])

    vi.useFakeTimers()
    const captionInput = screen.getByPlaceholderText(/add a caption/i)
    fireEvent.change(captionInput, { target: { value: 'Golden hour' } })
    vi.advanceTimersByTime(600)

    expect(onPhotoUpdate).toHaveBeenCalledWith('a.jpg', expect.objectContaining({ caption: 'Golden hour' }))
  })
})
