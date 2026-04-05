import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TabBar from '../components/TabBar.jsx'

// Mock du hook useVault
vi.mock('../context/VaultContext.jsx', () => ({
  useVault: vi.fn(),
}))

import { useVault } from '../context/VaultContext.jsx'

const makeTab = (overrides = {}) => ({
  path: '/vault/note.md',
  name: 'note.md',
  isDirty: false,
  ...overrides,
})

describe('TabBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ne rend rien si pas d\'onglets', () => {
    useVault.mockReturnValue({ tabs: [], activeTabPath: null, setActiveTab: vi.fn(), closeTab: vi.fn() })
    const { container } = render(<TabBar />)
    expect(container.firstChild).toBeNull()
  })

  it('affiche le nom du fichier sans extension', () => {
    useVault.mockReturnValue({
      tabs: [makeTab({ path: '/vault/note.md', name: 'note.md' })],
      activeTabPath: '/vault/note.md',
      setActiveTab: vi.fn(),
      closeTab: vi.fn(),
    })
    render(<TabBar />)
    expect(screen.getByText('note')).toBeInTheDocument()
  })

  it('affiche plusieurs onglets', () => {
    useVault.mockReturnValue({
      tabs: [
        makeTab({ path: '/vault/a.md', name: 'a.md' }),
        makeTab({ path: '/vault/b.mxt', name: 'b.mxt' }),
      ],
      activeTabPath: '/vault/a.md',
      setActiveTab: vi.fn(),
      closeTab: vi.fn(),
    })
    render(<TabBar />)
    expect(screen.getByText('a')).toBeInTheDocument()
    expect(screen.getByText('b')).toBeInTheDocument()
  })

  it('appelle setActiveTab au clic sur un onglet', () => {
    const setActiveTab = vi.fn()
    useVault.mockReturnValue({
      tabs: [makeTab({ path: '/vault/note.md', name: 'note.md' })],
      activeTabPath: null,
      setActiveTab,
      closeTab: vi.fn(),
    })
    render(<TabBar />)
    fireEvent.click(screen.getByText('note'))
    expect(setActiveTab).toHaveBeenCalledWith('/vault/note.md')
  })

  it('appelle closeTab au clic sur le bouton fermer', () => {
    const closeTab = vi.fn()
    useVault.mockReturnValue({
      tabs: [makeTab({ path: '/vault/note.md', name: 'note.md' })],
      activeTabPath: '/vault/note.md',
      setActiveTab: vi.fn(),
      closeTab,
    })
    render(<TabBar />)
    // Le bouton fermer est un <span> avec un SVG ×
    const closeBtn = screen.getAllByRole('generic').find(el => el.querySelector('svg line'))
    // Utiliser le premier span avec svg
    const svgs = document.querySelectorAll('svg line')
    fireEvent.click(svgs[0].closest('span'))
    expect(closeTab).toHaveBeenCalledWith('/vault/note.md')
  })

  it('affiche un point bleu si l\'onglet est modifié (isDirty)', () => {
    useVault.mockReturnValue({
      tabs: [makeTab({ path: '/vault/note.md', name: 'note.md', isDirty: true })],
      activeTabPath: '/vault/note.md',
      setActiveTab: vi.fn(),
      closeTab: vi.fn(),
    })
    const { container } = render(<TabBar />)
    // Le point dirty est un span avec borderRadius 50%
    const dot = container.querySelector('span[style*="border-radius: 50%"]')
    expect(dot).toBeInTheDocument()
  })

  it('n\'affiche pas de point si l\'onglet n\'est pas modifié', () => {
    useVault.mockReturnValue({
      tabs: [makeTab({ path: '/vault/note.md', name: 'note.md', isDirty: false })],
      activeTabPath: '/vault/note.md',
      setActiveTab: vi.fn(),
      closeTab: vi.fn(),
    })
    const { container } = render(<TabBar />)
    const dot = container.querySelector('span[style*="border-radius: 50%"]')
    expect(dot).not.toBeInTheDocument()
  })
})
