import { Language } from '../App'

const STEPS = {
  en: [
    'You will receive a confirmation email within 24 hours.',
    'Keep your policy number handy — you may need it for follow-up.',
    'A claims adjuster will contact you within 2–3 business days.',
    'For urgent assistance call our hotline: 800 100 200.',
  ],
  pl: [
    'Otrzymasz email z potwierdzeniem w ciągu 24 godzin.',
    'Zachowaj numer polisy — może być potrzebny przy kolejnym kontakcie.',
    'Likwidator szkód skontaktuje się z Tobą w ciągu 2–3 dni roboczych.',
    'W pilnych sprawach zadzwoń na infolinię: 800 100 200.',
  ],
}

interface NextStepsProps {
  language: Language
}

export default function NextSteps({ language }: NextStepsProps) {
  return (
    <div className="card animate-fadeIn">
      <h3 className="text-sm font-semibold mb-3" style={{ color: '#1a1a1a' }}>
        {language === 'en' ? 'What happens next?' : 'Co dalej?'}
      </h3>
      <ol className="space-y-3">
        {STEPS[language].map((step, i) => (
          <li key={i} className="flex items-start gap-3 text-sm" style={{ color: '#6b6869' }}>
            <span className="font-mono text-xs mt-0.5 flex-shrink-0" style={{ color: '#1a1a1a' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
