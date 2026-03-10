import React, { useState } from 'react';
import { useFlowState } from '@/hooks/useFlowState';
import { RequiredField, suggestFields } from '@/services/api';
import { Plus, Trash2, Save, Edit2, Sparkles, Loader } from 'lucide-react';

export const SlotConfigurator: React.FC = () => {
  const { requiredFields, addRequiredField, updateRequiredField, deleteRequiredField, systemPrompt, nodes, edges } = useFlowState();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [formData, setFormData] = useState<RequiredField>({
    name: '',
    type: 'string',
    description: '',
    validation: {
      required: true,
    },
  });

  const fieldTypes = [
    { value: 'string', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'boolean', label: 'Yes/No' },
  ];

  const handleAdd = () => {
    setIsAdding(true);
    setFormData({
      name: '',
      type: 'string',
      description: '',
      validation: { required: true },
    });
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setFormData({ ...requiredFields[index] });
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Field name is required');
      return;
    }

    if (editingIndex !== null) {
      updateRequiredField(editingIndex, formData);
      setEditingIndex(null);
    } else {
      addRequiredField(formData);
      setIsAdding(false);
    }

    setFormData({
      name: '',
      type: 'string',
      description: '',
      validation: { required: true },
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingIndex(null);
    setFormData({
      name: '',
      type: 'string',
      description: '',
      validation: { required: true },
    });
  };

  const handleDelete = (index: number) => {
    if (confirm('Are you sure you want to delete this field?')) {
      deleteRequiredField(index);
    }
  };

  const handleSuggestFields = async () => {
    setIsSuggesting(true);
    try {
      const flow = { nodes, edges };
      const suggestions = await suggestFields(systemPrompt, flow);

      if (suggestions.length === 0) {
        alert('No field suggestions found. Try adding more context to your system prompt or flow.');
        return;
      }

      const message = `Found ${suggestions.length} suggested fields:\n\n${suggestions
        .map((s) => `• ${s.name} (${s.type}) - ${s.description}`)
        .join('\n')}\n\nAdd all suggestions?`;

      if (confirm(message)) {
        suggestions.forEach((suggestion) => {
          addRequiredField({
            name: suggestion.name,
            type: suggestion.type as any,
            description: suggestion.description,
            validation: { required: true },
          });
        });
      }
    } catch (error) {
      console.error('Failed to suggest fields:', error);
      alert('Failed to generate field suggestions. Please try again.');
    } finally {
      setIsSuggesting(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateValidation = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      validation: { ...prev.validation, [field]: value },
    }));
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Required Fields Configuration</h3>
            <p className="text-sm text-gray-500 mt-1">
              Define the information your bot needs to collect
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSuggestFields}
              disabled={isSuggesting}
              className="btn btn-secondary flex items-center gap-2"
            >
              {isSuggesting ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              AI Suggest
            </button>
            <button onClick={handleAdd} className="btn btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Field
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {requiredFields.map((field, index) => (
            <div key={index} className="card p-4">
              {editingIndex === index ? (
                <FieldForm
                  formData={formData}
                  fieldTypes={fieldTypes}
                  updateFormData={updateFormData}
                  updateValidation={updateValidation}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{field.name}</h4>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        {field.type}
                      </span>
                      {field.validation?.required && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{field.description}</p>
                    {field.validation && (
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                        {field.validation.minLength && (
                          <span>Min length: {field.validation.minLength}</span>
                        )}
                        {field.validation.maxLength && (
                          <span>Max length: {field.validation.maxLength}</span>
                        )}
                        {field.validation.min !== undefined && (
                          <span>Min: {field.validation.min}</span>
                        )}
                        {field.validation.max !== undefined && (
                          <span>Max: {field.validation.max}</span>
                        )}
                        {field.validation.pattern && (
                          <span>Pattern: {field.validation.pattern}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(index)}
                      className="btn btn-secondary px-3"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      className="btn btn-danger px-3"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isAdding && (
            <div className="card p-4">
              <FieldForm
                formData={formData}
                fieldTypes={fieldTypes}
                updateFormData={updateFormData}
                updateValidation={updateValidation}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            </div>
          )}

          {requiredFields.length === 0 && !isAdding && (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-2">No fields configured yet</p>
              <p className="text-sm">
                Click "Add Field" or "AI Suggest" to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface FieldFormProps {
  formData: RequiredField;
  fieldTypes: Array<{ value: string; label: string }>;
  updateFormData: (field: string, value: any) => void;
  updateValidation: (field: string, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
}

const FieldForm: React.FC<FieldFormProps> = ({
  formData,
  fieldTypes,
  updateFormData,
  updateValidation,
  onSave,
  onCancel,
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Field Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => updateFormData('name', e.target.value)}
          className="input"
          placeholder="e.g., customer_name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type *
        </label>
        <select
          value={formData.type}
          onChange={(e) => updateFormData('type', e.target.value)}
          className="input"
        >
          {fieldTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Description
      </label>
      <textarea
        value={formData.description}
        onChange={(e) => updateFormData('description', e.target.value)}
        rows={2}
        className="input"
        placeholder="Describe what this field is for..."
      />
    </div>

    <div className="border-t border-gray-200 pt-4">
      <h5 className="font-medium text-gray-900 mb-3">Validation Rules</h5>

      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.validation?.required || false}
            onChange={(e) => updateValidation('required', e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Required field</span>
        </label>

        {formData.type === 'string' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Min Length</label>
                <input
                  type="number"
                  value={formData.validation?.minLength || ''}
                  onChange={(e) => updateValidation('minLength', parseInt(e.target.value) || undefined)}
                  className="input"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Max Length</label>
                <input
                  type="number"
                  value={formData.validation?.maxLength || ''}
                  onChange={(e) => updateValidation('maxLength', parseInt(e.target.value) || undefined)}
                  className="input"
                  placeholder="255"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Pattern (Regex)</label>
              <input
                type="text"
                value={formData.validation?.pattern || ''}
                onChange={(e) => updateValidation('pattern', e.target.value)}
                className="input"
                placeholder="^[A-Za-z]+$"
              />
            </div>
          </>
        )}

        {formData.type === 'number' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Min Value</label>
              <input
                type="number"
                value={formData.validation?.min ?? ''}
                onChange={(e) => updateValidation('min', parseFloat(e.target.value) || undefined)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Max Value</label>
              <input
                type="number"
                value={formData.validation?.max ?? ''}
                onChange={(e) => updateValidation('max', parseFloat(e.target.value) || undefined)}
                className="input"
              />
            </div>
          </div>
        )}
      </div>
    </div>

    <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
      <button onClick={onCancel} className="btn btn-secondary">
        Cancel
      </button>
      <button onClick={onSave} className="btn btn-success flex items-center gap-2">
        <Save className="w-4 h-4" />
        Save Field
      </button>
    </div>
  </div>
);
