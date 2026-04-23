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
})
