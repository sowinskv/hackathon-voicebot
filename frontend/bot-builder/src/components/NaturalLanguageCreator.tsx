import React, { useState } from 'react';

interface Props {
  onGenerate: (generated: any) => void;
}

const NaturalLanguageCreator: React.FC<Props> = ({ onGenerate }) => {
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState<'pl' | 'en'>('en');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const examples = [
    {
      title: 'Insurance Claim',
      desc: 'Collect car accident details',
      prompt: 'Create a bot that collects information about a car accident: policy number, date and time of incident, location, damage description, other party information, and witnesses. The bot should be empathetic and professional.',
    },
    {
      title: 'Customer Support',
      desc: 'Handle support requests',
      prompt: 'Create a bot that helps customers with support requests: name, email, phone number, issue category (technical, billing, general), issue description, and urgency level. The bot should be friendly and helpful.',
    },
    {
      title: 'Appointment Booking',
      desc: 'Schedule appointments',
      prompt: 'Create a bot that books appointments: patient name, date of birth, phone number, preferred date and time, reason for visit, and any special requirements. The bot should be warm and accommodating.',
    },
  ];

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please describe what your bot should do');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      // Call your backend API to generate the bot using Gemini
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bot/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, language }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate bot');
      }

      const generated = await response.json();
      onGenerate(generated);
    } catch (err: any) {
      setError(err.message || 'Failed to generate bot. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseExample = (prompt: string) => {
    setDescription(prompt);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-notion-text mb-2">
          Create Bot with Natural Language
        </h2>
        <p className="text-notion-textLight">
          Describe what your bot should do, and AI will automatically create the flow, prompt, and fields.
        </p>
      </div>

      {/* Language Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-notion-text mb-2">
          Bot Language
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setLanguage('en')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              language === 'en'
                ? 'bg-notion-text text-white'
                : 'bg-white border border-notion-border text-notion-text hover:bg-notion-hover'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('pl')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              language === 'pl'
                ? 'bg-notion-text text-white'
                : 'bg-white border border-notion-border text-notion-text hover:bg-notion-hover'
            }`}
          >
            Polish
          </button>
        </div>
      </div>

      {/* Description Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-notion-text mb-2">
          Describe Your Bot
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Example: Create a bot that collects information about a car accident. It should ask for the policy number, date and time of incident, location, damage description, and any witnesses. The bot should be empathetic and professional."
          className="input min-h-[200px] resize-none"
          disabled={isGenerating}
        />
        <div className="mt-2 text-xs text-notion-textLight">
          Be specific about: what information to collect, the bot's personality, and any special requirements.
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Generate Button */}
      <div className="mb-8">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !description.trim()}
          className="btn-primary w-full py-3"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Generating with AI...
            </span>
          ) : (
            '✨ Generate Bot'
          )}
        </button>
      </div>

      {/* Examples */}
      <div>
        <h3 className="text-sm font-medium text-notion-text mb-4">Quick Start Examples</h3>
        <div className="grid gap-4">
          {examples.map((example, idx) => (
            <div
              key={idx}
              className="card p-4 cursor-pointer hover:shadow-sm transition-shadow"
              onClick={() => handleUseExample(example.prompt)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-notion-text mb-1">{example.title}</h4>
                  <p className="text-sm text-notion-textLight">{example.desc}</p>
                </div>
                <button className="text-xs text-notion-accent hover:underline">
                  Use this
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NaturalLanguageCreator;
