import { Language } from '../App'

export interface CollectedData {
  policy_number?: string
  incident_date?: string
  location?: string
  damage_description?: string
  other_party_info?: string
  witness_info?: string
}

interface Field {
  key: keyof CollectedData
  label: { en: string; pl: string }
  required: boolean
}

const FIELDS: Field[] = [
  { key: 'policy_number',      label: { en: 'Policy number',        pl: 'Numer polisy'           }, required: true  },
  { key: 'incident_date',      label: { en: 'Date & time',          pl: 'Data i godzina'         }, required: true  },
  { key: 'location',           label: { en: 'Location',             pl: 'Miejsce zdarzenia'      }, required: true  },
  { key: 'damage_description', label: { en: 'Damage description',   pl: 'Opis szkody'            }, required: true  },
  { key: 'other_party_info',   label: { en: 'Other party',          pl: 'Druga strona'           }, required: false },
  { key: 'witness_info',       label: { en: 'Witnesses',            pl: 'Świadkowie'             }, required: false },
]

const REQUIRED_COUNT = FIELDS.filter((f) => f.required).length

interface CollectedDataPanelProps {
  data: CollectedData
  language: Language
}

export default function CollectedDataPanel({ data, language }: CollectedDataPanelProps) {
  const filledRequired = FIELDS.filter((f) => f.required && data[f.key]).length
  const completeness = Math.round((filledRequired / REQUIRED_COUNT) * 100)

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold" style={{ color: '#1a1a1a' }}>
          {language === 'en' ? 'Collected Data' : 'Zebrane dane'}
        </h2>
        <span className="font-mono text-xs" style={{ color: '#6b6869' }}>
          {filledRequired}/{REQUIRED_COUNT}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${completeness}%`,
            backgroundColor: completeness === 100 ? '#16a34a' : '#1a1a1a',
          }}
        />
      </div>

      {/* Fields */}
      <div className="space-y-3">
        {FIELDS.map(({ key, label, required }) => {
          const value = data[key]
          return (
            <div key={key} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs" style={{ color: '#6b6869' }}>
                  {label[language]}
                </span>
                {required && (
                  <span className="font-mono text-xs" style={{ color: '#d4cfc8' }}>*</span>
                )}
              </div>
              <div
                className={`font-mono text-xs px-2 py-1.5 rounded transition-colors duration-300 ${
                  value
                    ? 'bg-gray-50 text-notion-text border border-gray-200'
                    : 'text-gray-300'
                }`}
              >
                {value ?? '—'}
              </div>
            </div>
          )
        })}
      </div>

      {completeness === 100 && (
        <div className="text-xs text-center font-mono text-green-600 animate-fadeIn">
          {language === 'en' ? '✓ all required fields collected' : '✓ wszystkie pola zebrane'}
        </div>
      )}
    </div>
  )
}
