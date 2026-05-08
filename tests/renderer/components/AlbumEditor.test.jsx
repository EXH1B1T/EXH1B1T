// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { installWindowApi } from '../../setup/window-api.mock.js'
import AlbumEditor from '../../../src/renderer/components/AlbumEditor'

beforeEach(() => installWindowApi())
afterEach(() => vi.useRealTimers())

const baseAlbum = {
  slug: 'portraits',
  title: 'Portraits',
  date: '2024-06',
  description: '',
  coverPhoto: null,
  photos: [],
}

describe('AlbumEditor', () => {
  it('shows placeholder message when no album is provided', () => {
    render(<AlbumEditor album={null} />)
    expect(screen.getByText(/select an album/i)).toBeInTheDocument()
  })

  it('renders album title in input', () => {
    render(<AlbumEditor album={baseAlbum} />)
    expect(screen.getByDisplayValue('Portraits')).toBeInTheDocument()
  })

  it('renders date input', () => {
    render(<AlbumEditor album={baseAlbum} />)
    expect(screen.getByDisplayValue('2024-06')).toBeInTheDocument()
  })

  it('shows PhotoUpload when album has no photos', () => {
    render(<AlbumEditor album={baseAlbum} />)
    // PhotoUpload renders drop zone text
    expect(screen.getByText(/drop photos here/i)).toBeInTheDocument()
  })

  it('shows photo grid when album has photos', () => {
    const album = {
      ...baseAlbum,
      coverPhoto: 'shot.jpg',
      photos: [
        { filename: 'shot.jpg', altText: 'A shot', url: 'https://cdn/shot.jpg', width: 1920, height: 1080, order: 0 },
      ],
    }
    render(<AlbumEditor album={album} />)
    // PhotoGrid renders an img
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('calls window.api.albums.update after title change + debounce', () => {
    vi.useFakeTimers()
    render(<AlbumEditor album={baseAlbum} />)
    const input = screen.getByDisplayValue('Portraits')
    fireEvent.change(input, { target: { value: 'New Title' } })
    vi.advanceTimersByTime(700)
    expect(window.api.albums.update).toHaveBeenCalledWith('portraits', expect.objectContaining({ title: 'New Title' }))
  })

  it('calls window.api.albums.update after date change + debounce', () => {
    vi.useFakeTimers()
    render(<AlbumEditor album={baseAlbum} />)
    const dateInput = screen.getByDisplayValue('2024-06')
    fireEvent.change(dateInput, { target: { value: '2025-01' } })
    vi.advanceTimersByTime(700)
    expect(window.api.albums.update).toHaveBeenCalledWith('portraits', expect.objectContaining({ date: '2025-01' }))
  })

  it('calls window.api.albums.update after description change + debounce', () => {
    vi.useFakeTimers()
    const album = { ...baseAlbum, description: 'Old desc' }
    render(<AlbumEditor album={album} />)
    const descInput = screen.getByDisplayValue('Old desc')
    fireEvent.change(descInput, { target: { value: 'New desc' } })
    vi.advanceTimersByTime(700)
    expect(window.api.albums.update).toHaveBeenCalledWith('portraits', expect.objectContaining({ description: 'New desc' }))
  })

  it('calls onSaved callback after successful save', async () => {
    vi.useFakeTimers()
    const onSaved = vi.fn()
    render(<AlbumEditor album={baseAlbum} onSaved={onSaved} />)
    fireEvent.change(screen.getByDisplayValue('Portraits'), { target: { value: 'Updated' } })
    vi.advanceTimersByTime(700)
    await Promise.resolve() // flush async callback after await window.api.albums.update
    expect(onSaved).toHaveBeenCalled()
  })

  it('calls onSaved after setting cover photo', async () => {
    const album = {
      ...baseAlbum,
      photos: [
        { filename: 'a.jpg', altText: '', url: 'https://cdn/a.jpg', width: 100, height: 100, order: 0 },
        { filename: 'b.jpg', altText: '', url: 'https://cdn/b.jpg', width: 100, height: 100, order: 1 },
      ],
      coverPhoto: 'a.jpg',
    }
    const onSaved = vi.fn()
    render(<AlbumEditor album={album} onSaved={onSaved} />)
    const coverBtns = screen.getAllByTitle('Set as cover')
    await userEvent.click(coverBtns[1])
    expect(window.api.photos.setCover).toHaveBeenCalledWith('portraits', 'b.jpg')
    expect(onSaved).toHaveBeenCalled()
  })

  it('calls onSaved after deleting a photo', async () => {
    const album = {
      ...baseAlbum,
      photos: [{ filename: 'a.jpg', altText: '', url: 'https://cdn/a.jpg', width: 100, height: 100, order: 0 }],
      coverPhoto: 'a.jpg',
    }
    const onSaved = vi.fn()
    render(<AlbumEditor album={album} onSaved={onSaved} />)
    await userEvent.click(screen.getByTitle('Delete'))
    expect(window.api.photos.remove).toHaveBeenCalledWith('portraits', 'a.jpg')
    expect(onSaved).toHaveBeenCalled()
  })

  it('shows confirmation bar when More options → Delete album is clicked', async () => {
    render(<AlbumEditor album={baseAlbum} onSaved={() => {}} />)
    await userEvent.click(screen.getByTitle('More options'))
    await userEvent.click(screen.getByText('Delete album'))
    expect(screen.getByText(/and all its photos/i)).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('hides confirmation bar when Cancel is clicked', async () => {
    render(<AlbumEditor album={baseAlbum} onSaved={() => {}} />)
    await userEvent.click(screen.getByTitle('More options'))
    await userEvent.click(screen.getByText('Delete album'))
    await userEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByText(/and all its photos/i)).not.toBeInTheDocument()
  })

  it('calls albums.delete and onDelete when confirmed', async () => {
    const onDelete = vi.fn()
    render(<AlbumEditor album={baseAlbum} onSaved={() => {}} onDelete={onDelete} />)
    await userEvent.click(screen.getByTitle('More options'))
    await userEvent.click(screen.getByText('Delete album'))
    await userEvent.click(screen.getByText('Delete'))
    expect(window.api.albums.delete).toHaveBeenCalledWith('portraits')
    expect(onDelete).toHaveBeenCalled()
  })
})
