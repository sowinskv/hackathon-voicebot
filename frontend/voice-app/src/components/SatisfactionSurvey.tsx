import { useState } from 'react'
import { Language } from '../App'

interface SatisfactionSurveyProps {
  sessionId: string | null
  language: Language
  onDismiss: () => void
}

const LABELS: Record<number, { en: string; pl: string }> = {
  1: { en: 'Very dissatisfied', pl: 'Bardzo niezadowolony' },
  2: { en: 'Dissatisfied',      pl: 'Niezadowolony'       },
  3: { en: 'Neutral',           pl: 'Neutralny'           },
  4: { en: 'Satisfied',         pl: 'Zadowolony'          },
  5: { en: 'Very satisfied',    pl: 'Bardzo zadowolony'   },
}

export default function SatisfactionSurvey({ sessionId, language, onDismiss }: SatisfactionSurveyProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const active = hovered ?? selected

  const handleSubmit = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      if (sessionId) {
        await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/sessions/${sessionId}/rating`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score: selected, comment }),
          }
        )
      }
    } catch (_) {
      // non-blocking — backend may not have endpoint yet
    } finally {
      setSubmitting(false)
      setSubmitted(true)
    }
  }

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 animate-fadeIn">
      <div className="bg-white rounded-lg border border-gray-200 shadow-lg w-full max-w-md mx-4 p-8 animate-fadeIn">

        {submitted ? (
          /* Thank-you state */
          <div className="text-center py-4">
            <div className="text-3xl mb-3">✓</div>
            <p className="font-semibold text-notion-text mb-1">
              {language === 'en' ? 'Thank you for your feedback!' : 'Dziękujemy za opinię!'}
            </p>
            <p className="text-sm text-notion-textLight mb-6">
              {language === 'en'
                ? 'Your response helps us improve.'
                : 'Twoja odpowiedź pomaga nam się doskonalić.'}
            </p>
            <button onClick={onDismiss} className="btn-primary px-8">
              {language === 'en' ? 'Close' : 'Zamknij'}
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-base font-semibold text-notion-text mb-1">
              {language === 'en' ? 'How was your experience?' : 'Jak oceniasz rozmowę?'}
            </h2>
            <p className="text-sm text-notion-textLight mb-6">
              {language === 'en'
                ? 'Your feedback helps us improve our service.'
                : 'Twoja opinia pomaga nam poprawić usługę.'}
            </p>

            {/* Stars */}
            <div className="flex items-center justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setSelected(n)}
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(null)}
                  className="text-3xl transition-transform duration-100 hover:scale-110 focus:outline-none"
                  aria-label={`${n} star`}
                >
                  <span style={{ color: active && n <= active ? '#f59e0b' : '#d1d5db' }}>
                    ★
                  </span>
                </button>
              ))}
            </div>

            {/* Label */}
            <div className="text-center mb-6" style={{ minHeight: '20px' }}>
              {active && (
                <span className="font-mono text-xs text-notion-textLight animate-fadeIn">
                  {LABELS[active][language]}
                </span>
              )}
            </div>

            {/* Comment */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={language === 'en' ? 'Any additional comments? (optional)' : 'Dodatkowe uwagi? (opcjonalnie)'}
              className="input resize-none mb-4 text-sm"
              rows={3}
            />

            {/* Actions */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={onDismiss}
                className="text-sm text-notion-textLight hover:text-notion-text transition-colors"
              >
                {language === 'en' ? 'Skip' : 'Pomiń'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selected || submitting}
                className="btn-primary px-6"
              >
                {submitting
                  ? '…'
                  : language === 'en' ? 'Submit' : 'Wyślij'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
