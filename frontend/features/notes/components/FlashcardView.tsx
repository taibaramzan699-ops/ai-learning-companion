'use client'

import { useState } from 'react'
import { useFlashcards } from '@/features/notes/hooks/use-notes-ai'
import { Loader2, ChevronLeft, ChevronRight, Check, X, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FlashcardViewerProps {
  noteId: string
}

// Mastery scale from the Flashcard type: 0=new, 1=learning, 2=familiar, 3=mastered
const MASTERED = 3
const NOT_MASTERED = 0

export function FlashcardViewer({ noteId }: FlashcardViewerProps) {
  const { flashcards, loading, error, generate, updateMastery } = useFlashcards(noteId)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  const current = flashcards[currentIndex]

  const handleMastered = () => {
    if (current) {
      updateMastery(current.id, MASTERED)
    }
  }

  const handleNotMastered = () => {
    if (current) {
      updateMastery(current.id, NOT_MASTERED)
    }
  }

  const handleNext = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev + 1) % flashcards.length)
  }

  const handlePrev = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length)
  }

  if (loading && flashcards.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Generating flashcards...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-200">
        {error}
      </div>
    )
  }

  if (flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <p className="text-gray-600 dark:text-gray-400">No flashcards yet</p>
        <Button onClick={() => generate(5)}>Generate Flashcards</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">📚 Flashcards</h3>
        <Button onClick={() => generate(5)} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Regenerate
        </Button>
      </div>

      {/* Flashcard */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="min-h-64 p-6 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg cursor-pointer transform transition-transform hover:scale-105 flex items-center justify-center"
      >
        <div className="text-center">
          <p className="text-sm text-purple-100 mb-2">{isFlipped ? 'Answer' : 'Question'}</p>
          <p className="text-2xl text-white font-semibold">
            {isFlipped ? current.answer : current.question}
          </p>
          <p className="text-sm text-purple-100 mt-4">Click to flip</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <span>{currentIndex + 1}</span>
        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
          />
        </div>
        <span>{flashcards.length}</span>
      </div>

      {/* Controls */}
      <div className="flex gap-2 justify-center">
        <Button onClick={handlePrev} variant="outline" size="icon">
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <Button onClick={handleMastered} className="gap-2 flex-1">
          <Check className="w-4 h-4" />
          Mastered
        </Button>

        <Button onClick={handleNotMastered} variant="outline" className="gap-2 flex-1">
          <X className="w-4 h-4" />
          Again
        </Button>

        <Button onClick={handleNext} variant="outline" size="icon">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Mastered Count */}
      <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
        {flashcards.filter((fc) => fc.mastery === MASTERED).length} of {flashcards.length} mastered
      </div>
    </div>
  )
}