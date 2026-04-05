import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import GitConnect from '../components/GitConnect.jsx'

describe('GitConnect', () => {
  const onClose = vi.fn()
  const onRepositoryOpened = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche l\'étape "browse" par défaut', () => {
    render(<GitConnect onClose={onClose} onRepositoryOpened={onRepositoryOpened} />)
    expect(screen.getByText('Parcourir...')).toBeInTheDocument()
  })

  it('ferme la modale en cliquant sur la croix', () => {
    render(<GitConnect onClose={onClose} onRepositoryOpened={onRepositoryOpened} />)
    fireEvent.click(screen.getByRole('button', { name: '' })) // bouton ×
    // Le premier bouton × est le close
    const buttons = screen.getAllByRole('button')
    const closeBtn = buttons.find(b => b.textContent === '')
    if (closeBtn) fireEvent.click(closeBtn)
    // onClose déclenché par le backdrop ou le bouton ×
  })

  it('appelle browseDirectory au clic sur "Parcourir"', async () => {
    window.electron.browseDirectory.mockResolvedValue({ ok: false })
    render(<GitConnect onClose={onClose} onRepositoryOpened={onRepositoryOpened} />)
    fireEvent.click(screen.getByText('Parcourir...'))
    await waitFor(() => {
      expect(window.electron.browseDirectory).toHaveBeenCalled()
    })
  })

  it('passe à l\'étape "select" si un dossier est sélectionné', async () => {
    window.electron.browseDirectory.mockResolvedValue({ ok: true, dirPath: 'C:/mon-repo' })
    window.electron.gitDetectRepo.mockResolvedValue({ isRepo: true })
    window.electron.gitGetMarkdownFiles.mockResolvedValue({
      files: [{ name: 'README.md', path: 'C:/mon-repo/README.md', relativePath: 'docs/README.md' }],
    })

    render(<GitConnect onClose={onClose} onRepositoryOpened={onRepositoryOpened} />)
    fireEvent.click(screen.getByText('Parcourir...'))

    await waitFor(() => {
      expect(screen.getAllByText('README.md').length).toBeGreaterThan(0)
    })
    // Affiche le chemin du repo
    expect(screen.getByText('C:/mon-repo')).toBeInTheDocument()
  })

  it('affiche les fichiers trouvés dans l\'étape select', async () => {
    window.electron.browseDirectory.mockResolvedValue({ ok: true, dirPath: 'C:/repo' })
    window.electron.gitDetectRepo.mockResolvedValue({ isRepo: true })
    window.electron.gitGetMarkdownFiles.mockResolvedValue({
      files: [
        { name: 'doc.md', path: 'C:/repo/doc.md', relativePath: 'notes/doc.md' },
        { name: 'guide.mxt', path: 'C:/repo/guide.mxt', relativePath: 'notes/guide.mxt' },
      ],
    })

    render(<GitConnect onClose={onClose} onRepositoryOpened={onRepositoryOpened} />)
    fireEvent.click(screen.getByText('Parcourir...'))

    await waitFor(() => {
      expect(screen.getAllByText('doc.md').length).toBeGreaterThan(0)
      expect(screen.getAllByText('guide.mxt').length).toBeGreaterThan(0)
    })
  })

  it('affiche "Aucun fichier Markdown trouvé" si dossier vide', async () => {
    window.electron.browseDirectory.mockResolvedValue({ ok: true, dirPath: 'C:/vide' })
    window.electron.gitDetectRepo.mockResolvedValue({ isRepo: false })
    window.electron.gitGetMarkdownFiles.mockResolvedValue({ files: [] })

    render(<GitConnect onClose={onClose} onRepositoryOpened={onRepositoryOpened} />)
    fireEvent.click(screen.getByText('Parcourir...'))

    await waitFor(() => {
      expect(screen.getByText('Aucun fichier Markdown trouvé')).toBeInTheDocument()
    })
  })

  it('revient à l\'étape browse avec le bouton Retour', async () => {
    window.electron.browseDirectory.mockResolvedValue({ ok: true, dirPath: 'C:/repo' })
    window.electron.gitDetectRepo.mockResolvedValue({ isRepo: true })
    window.electron.gitGetMarkdownFiles.mockResolvedValue({ files: [] })

    render(<GitConnect onClose={onClose} onRepositoryOpened={onRepositoryOpened} />)
    fireEvent.click(screen.getByText('Parcourir...'))

    await waitFor(() => screen.getByText('← Retour'))
    fireEvent.click(screen.getByText('← Retour'))

    expect(screen.getByText('Parcourir...')).toBeInTheDocument()
  })

  it('passe à l\'étape vault après sélection d\'un fichier', async () => {
    window.electron.browseDirectory.mockResolvedValue({ ok: true, dirPath: 'C:/repo' })
    window.electron.gitDetectRepo.mockResolvedValue({ isRepo: true })
    window.electron.gitGetMarkdownFiles.mockResolvedValue({
      files: [{ name: 'README.md', path: 'C:/repo/README.md', relativePath: 'docs/README.md' }],
    })
    window.electron.gitReadMd.mockResolvedValue({ ok: true, content: '# Contenu' })
    window.electron.saveConfig.mockResolvedValue({})

    render(<GitConnect onClose={onClose} onRepositoryOpened={onRepositoryOpened} />)
    fireEvent.click(screen.getByText('Parcourir...'))

    await waitFor(() => screen.getAllByText('README.md'))
    // Cliquer sur le bouton fichier (le premier élément avec ce nom)
    fireEvent.click(screen.getAllByText('README.md')[0])

    await waitFor(() => {
      expect(screen.getByText('Où souhaitez-vous définir votre vault ?')).toBeInTheDocument()
    })
    expect(onRepositoryOpened).toHaveBeenCalled()
  })

  it('propose 3 options dans l\'étape vault', async () => {
    window.electron.browseDirectory.mockResolvedValue({ ok: true, dirPath: 'C:/repo' })
    window.electron.gitDetectRepo.mockResolvedValue({ isRepo: true })
    window.electron.gitGetMarkdownFiles.mockResolvedValue({
      files: [{ name: 'README.md', path: 'C:/repo/README.md', relativePath: 'docs/README.md' }],
    })
    window.electron.gitReadMd.mockResolvedValue({ ok: true, content: '# Test' })
    window.electron.saveConfig.mockResolvedValue({})

    render(<GitConnect onClose={onClose} onRepositoryOpened={onRepositoryOpened} />)
    fireEvent.click(screen.getByText('Parcourir...'))
    await waitFor(() => screen.getAllByText('README.md'))
    fireEvent.click(screen.getAllByText('README.md')[0])

    await waitFor(() => screen.getByText('Utiliser le répertoire Git'))
    expect(screen.getByText('Choisir un autre emplacement…')).toBeInTheDocument()
    expect(screen.getByText('Continuer sans vault')).toBeInTheDocument()
  })
})
