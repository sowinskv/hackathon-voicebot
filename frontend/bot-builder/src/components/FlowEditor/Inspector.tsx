import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { X, Trash2, Plus } from 'lucide-react';
import { useFlowState } from '@/hooks/useFlowState';

interface InspectorProps {
  node: Node | null;
  onClose: () => void;
}

export const Inspector: React.FC<InspectorProps> = ({ node, onClose }) => {
  const { updateNode, deleteNode } = useFlowState();
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (node) {
      setFormData(node.data);
    }
  }, [node]);

  if (!node) return null;

  const handleChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    updateNode(node.id, newData);
  };

  const handleArrayChange = (field: string, index: number, value: string) => {
    const array = [...(formData[field] || [])];
    array[index] = value;
    handleChange(field, array);
  };

  const handleAddArrayItem = (field: string) => {
    const array = [...(formData[field] || []), ''];
    handleChange(field, array);
  };

  const handleRemoveArrayItem = (field: string, index: number) => {
    const array = [...(formData[field] || [])];
    array.splice(index, 1);
    handleChange(field, array);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this node?')) {
      deleteNode(node.id);
      onClose();
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Node Properties</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Label
          </label>
          <input
            type="text"
            value={formData.label || ''}
            onChange={(e) => handleChange('label', e.target.value)}
            className="input"
          />
        </div>

        {/* Type-specific fields */}
        {(node.type === 'start' || node.type === 'message' || node.type === 'end') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={formData.message || ''}
              onChange={(e) => handleChange('message', e.target.value)}
              rows={4}
              className="input"
              placeholder="Enter the message to display..."
            />
          </div>
        )}

        {node.type === 'slotCollection' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prompt
              </label>
              <textarea
                value={formData.prompt || ''}
                onChange={(e) => handleChange('prompt', e.target.value)}
                rows={3}
                className="input"
                placeholder="Enter the prompt to collect information..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slots to Collect
              </label>
              <div className="space-y-2">
                {(formData.slots || []).map((slot: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={slot}
                      onChange={(e) => handleArrayChange('slots', index, e.target.value)}
                      className="input flex-1"
                      placeholder="Field name"
                    />
                    <button
                      onClick={() => handleRemoveArrayItem('slots', index)}
                      className="btn btn-secondary px-3"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleAddArrayItem('slots')}
                  className="btn btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Slot
                </button>
              </div>
            </div>
          </>
        )}

        {node.type === 'validation' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field to Validate
              </label>
              <input
                type="text"
                value={formData.field || ''}
                onChange={(e) => handleChange('field', e.target.value)}
                className="input"
                placeholder="Field name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Validation Rules
              </label>
              <div className="space-y-2">
                {(formData.rules || []).map((rule: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={rule}
                      onChange={(e) => handleArrayChange('rules', index, e.target.value)}
                      className="input flex-1"
                      placeholder="e.g., required, email, min:5"
                    />
                    <button
                      onClick={() => handleRemoveArrayItem('rules', index)}
                      className="btn btn-secondary px-3"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleAddArrayItem('rules')}
                  className="btn btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Rule
                </button>
              </div>
            </div>
          </>
        )}

        {node.type === 'confirmation' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmation Message
            </label>
            <textarea
              value={formData.message || ''}
              onChange={(e) => handleChange('message', e.target.value)}
              rows={3}
              className="input"
              placeholder="Ask user to confirm the collected information..."
            />
          </div>
        )}

        {node.type === 'escalation' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Escalation Reason
              </label>
              <textarea
                value={formData.reason || ''}
                onChange={(e) => handleChange('reason', e.target.value)}
                rows={3}
                className="input"
                placeholder="Why is this being escalated?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transfer To
              </label>
              <input
                type="text"
                value={formData.transferTo || ''}
                onChange={(e) => handleChange('transferTo', e.target.value)}
                className="input"
                placeholder="Department or agent"
              />
            </div>
          </>
        )}

        {/* Delete button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleDelete}
            className="btn btn-danger w-full flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Node
          </button>
        </div>
      </div>
    </div>
  );
};
