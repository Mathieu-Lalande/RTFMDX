import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBar from '../components/StatusBar.jsx'

describe('StatusBar', () => {
  it('affiche le chemin du fichier', () => {
    render(<StatusBar filePath="C:/vault/note.md" wordCount={10} charCount={50} />)
    expect(screen.getByText('C:/vault/note.md')).toBeInTheDocument()
  })

  it('affiche "Non sauvegardé" si pas de chemin', () => {
    render(<StatusBar wordCount={0} charCount={0} />)
    expect(screen.getByText('Non sauvegardé')).toBeInTheDocument()
  })

  it('affiche le nombre de mots et caractères', () => {
    render(<StatusBar wordCount={42} charCount={250} />)
    expect(screen.getByText('42 mots')).toBeInTheDocument()
    expect(screen.getByText('250 caractères')).toBeInTheDocument()
  })

  it('affiche "Sauvegardé" quand saveStatus=saved', () => {
    render(<StatusBar wordCount={0} charCount={0} saveStatus="saved" />)
    expect(screen.getByText('Sauvegardé')).toBeInTheDocument()
  })

  it('affiche "Erreur de sauvegarde" quand saveStatus=error', () => {
    render(<StatusBar wordCount={0} charCount={0} saveStatus="error" />)
    expect(screen.getByText('Erreur de sauvegarde')).toBeInTheDocument()
  })

  it('affiche "Git sync" si gitRepoPath est défini', () => {
    render(<StatusBar wordCount={0} charCount={0} gitRepoPath="C:/repo" />)
    expect(screen.getByText('Git sync')).toBeInTheDocument()
  })

  it('n\'affiche pas "Git sync" si pas de repo', () => {
    render(<StatusBar wordCount={0} charCount={0} />)
    expect(screen.queryByText('Git sync')).not.toBeInTheDocument()
  })

  it('affiche "Lecture seule" si isReadOnly', () => {
    render(<StatusBar wordCount={0} charCount={0} isReadOnly />)
    expect(screen.getByText(/Lecture seule/)).toBeInTheDocument()
  })

  it('affiche "Auto-save activé" si autoSaveDelay > 0', () => {
    render(<StatusBar wordCount={0} charCount={0} autoSaveDelay={2000} />)
    expect(screen.getByText('Auto-save activé')).toBeInTheDocument()
  })

  it('n\'affiche pas "Auto-save activé" si autoSaveDelay = 0', () => {
    render(<StatusBar wordCount={0} charCount={0} autoSaveDelay={0} />)
    expect(screen.queryByText('Auto-save activé')).not.toBeInTheDocument()
  })

  it('affiche le zoom quand différent de 1.0', () => {
    render(<StatusBar wordCount={0} charCount={0} zoom={1.5} />)
    expect(screen.getByText('150%')).toBeInTheDocument()
  })

  it('n\'affiche pas le zoom si zoom = 1.0', () => {
    render(<StatusBar wordCount={0} charCount={0} zoom={1.0} />)
    expect(screen.queryByText('100%')).not.toBeInTheDocument()
  })

  it('affiche MD pour les fichiers .md', () => {
    render(<StatusBar filePath="note.md" wordCount={0} charCount={0} />)
    expect(screen.getByText('MD')).toBeInTheDocument()
  })

  it('affiche MXT pour les fichiers .mxt', () => {
    render(<StatusBar filePath="note.mxt" wordCount={0} charCount={0} />)
    expect(screen.getByText('MXT')).toBeInTheDocument()
  })

  it('affiche le mode édition', () => {
    render(<StatusBar wordCount={0} charCount={0} mode="edit" />)
    expect(screen.getByText(/Édition/)).toBeInTheDocument()
  })

  it('affiche le nombre d\'onglets', () => {
    render(<StatusBar wordCount={0} charCount={0} tabCount={3} />)
    expect(screen.getByText('3 onglets')).toBeInTheDocument()
  })

  it('affiche "onglet" au singulier', () => {
    render(<StatusBar wordCount={0} charCount={0} tabCount={1} />)
    expect(screen.getByText('1 onglet')).toBeInTheDocument()
  })
})
