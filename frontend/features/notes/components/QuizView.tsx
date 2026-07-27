'use client'

import { useState } from 'react'
import { useQuiz } from '@/features/notes/hooks/use-notes-ai'
import { Loader2, RefreshCw, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QuizInterfaceProps {
  noteId: string
}

export function QuizInterface({ noteId }: QuizInterfaceProps) {
  const { questions, answers, loading, error, generate, submitAnswer, calculateScore } = useQuiz(noteId)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null)

  const current = questions[currentIndex]

  const handleSelectAnswer = (optionIndex: number) => {
    submitAnswer(current.id, optionIndex)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % questions.length)
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + questions.length) % questions.length)
  }

  const handleSubmit = () => {
    const result = calculateScore()
    setScore(result)
    setSubmitted(true)
  }

  if (loading && questions.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Generating quiz...</span>
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

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <p className="text-gray-600 dark:text-gray-400">No quiz yet</p>
        <Button onClick={() => generate(5)}>Generate Quiz</Button>
      </div>
    )
  }

  if (submitted && score) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-6xl font-bold text-green-600 mb-2">
            {score.correct}/{score.total}
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            You got {Math.round((score.correct / score.total) * 100)}% correct!
          </p>
          <Button onClick={() => { setSubmitted(false); setScore(null); setCurrentIndex(0); }} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </div>

        {/* Results Summary */}
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const selectedIndex = answers[q.id]
            const isCorrect = selectedIndex === q.correct_answer
            return (
              <div key={q.id} className="p-4 border rounded-lg">
                <p className="font-semibold mb-2">Q{idx + 1}: {q.question}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Your answer:{' '}
                  <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                    {selectedIndex != null ? q.options[selectedIndex] : 'Not answered'}
                  </span>
                </p>
                {!isCorrect && (
                  <p className="text-sm text-green-600">Correct: {q.options[q.correct_answer]}</p>
                )}
                {q.explanation && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">{q.explanation}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">🧠 Quiz</h3>
        <Button onClick={() => generate(5)} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Regenerate
        </Button>
      </div>

      {/* Question */}
      <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Question {currentIndex + 1}/{questions.length}</p>
        <h3 className="text-xl font-semibold mb-6">{current.question}</h3>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {current.options.map((option: string, idx: number) => (
            <button
              key={idx}
              onClick={() => handleSelectAnswer(idx)}
              className={`w-full p-3 text-left rounded-lg border-2 transition-colors ${
                answers[current.id] === idx
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <span>{currentIndex + 1}</span>
        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
        <span>{questions.length}</span>
      </div>

      {/* Controls */}
      <div className="flex gap-2 justify-center">
        <Button onClick={handlePrev} variant="outline" disabled={currentIndex === 0}>
          Previous
        </Button>
        <Button onClick={handleNext} variant="outline" disabled={currentIndex === questions.length - 1}>
          Next
        </Button>
        {currentIndex === questions.length - 1 && (
          <Button onClick={handleSubmit} className="gap-2">
            <Check className="w-4 h-4" />
            Submit Quiz
          </Button>
        )}
      </div>

      {/* Answered Indicators */}
      <div className="flex gap-2 flex-wrap justify-center">
        {questions.map((q, idx) => (
          <div
            key={q.id}
            onClick={() => setCurrentIndex(idx)}
            className={`w-8 h-8 rounded flex items-center justify-center cursor-pointer text-sm font-semibold ${
              answers[q.id] != null
                ? 'bg-blue-500 text-white'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
            }`}
          >
            {idx + 1}
          </div>
        ))}
      </div>
    </div>
  )
}