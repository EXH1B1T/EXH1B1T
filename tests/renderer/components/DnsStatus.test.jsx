// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DnsStatus from '../../../src/renderer/components/DnsStatus'

describe('DnsStatus', () => {
  it('renders nothing when status is idle', () => {
    const { container } = render(<DnsStatus status="idle" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when status is undefined', () => {
    const { container } = render(<DnsStatus />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows waiting message', () => {
    render(<DnsStatus status="waiting" />)
    expect(screen.getByText(/waiting for dns/i)).toBeInTheDocument()
  })

  it('shows verifying message', () => {
    render(<DnsStatus status="verifying" />)
    expect(screen.getByText(/verifying dns/i)).toBeInTheDocument()
  })

  it('shows active / verified message', () => {
    render(<DnsStatus status="active" />)
    expect(screen.getByText(/dns verified/i)).toBeInTheDocument()
  })

  it('renders a dot element for visual indicator', () => {
    render(<DnsStatus status="waiting" />)
    // The dot is a div with data-status attribute
    const dot = document.querySelector('[data-status="waiting"]')
    expect(dot).toBeInTheDocument()
  })
})
