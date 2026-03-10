import React, { useState } from 'react';

interface Props {
  flow: any;
  onChange: (flow: any) => void;
  fields: any[];
}

interface CollectionStep {
  fieldName: string;
  order: number;
}

const FlowEditor: React.FC<Props> = ({ flow, onChange, fields }) => {
  const [collectionSequence, setCollectionSequence] = useState<CollectionStep[]>(
    flow.collectionSequence || []
  );
  const [showFieldSelector, setShowFieldSelector] = useState(false);

  const availableFields = fields.filter(
    (field) => !collectionSequence.some((step) => step.fieldName === field.name)
  );

  const handleAddField = (fieldName: string) => {
    const newStep: CollectionStep = {
      fieldName,
      order: collectionSequence.length,
    };
    const updated = [...collectionSequence, newStep];
    setCollectionSequence(updated);
    onChange({ ...flow, collectionSequence: updated });
    setShowFieldSelector(false);
  };

  const handleRemoveField = (index: number) => {
    const updated = collectionSequence
      .filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, order: i }));
    setCollectionSequence(updated);
    onChange({ ...flow, collectionSequence: updated });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...collectionSequence];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    updated.forEach((step, i) => (step.order = i));
    setCollectionSequence(updated);
    onChange({ ...flow, collectionSequence: updated });
  };

  const handleMoveDown = (index: number) => {
    if (index === collectionSequence.length - 1) return;
    const updated = [...collectionSequence];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    updated.forEach((step, i) => (step.order = i));
    setCollectionSequence(updated);
    onChange({ ...flow, collectionSequence: updated });
  };

  const getFieldDetails = (fieldName: string) => {
    return fields.find((f) => f.name === fieldName);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-notion-text mb-2">
          Collection Flow
        </h2>
        <p className="text-notion-textLight">
          Define the order in which your bot collects information from the user.
        </p>
      </div>

      {/* Collection Sequence */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-notion-text">
            Collection Sequence
          </h3>
          {fields.length === 0 && (
            <span className="text-xs text-notion-textLight">
              Add fields in the Fields tab first
            </span>
          )}
        </div>

        {collectionSequence.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="text-4xl mb-3">📋</div>
            <h4 className="text-sm font-medium text-notion-text mb-2">
              No Fields in Collection Yet
            </h4>
            <p className="text-xs text-notion-textLight mb-4">
              Add fields from your configuration to create the collection flow
            </p>
            {fields.length > 0 && (
              <button
                onClick={() => setShowFieldSelector(true)}
                className="btn-primary text-sm"
              >
                Add First Field
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {collectionSequence.map((step, index) => {
              const field = getFieldDetails(step.fieldName);
              if (!field) return null;

              return (
                <div
                  key={index}
                  className="card p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="text-notion-textLight hover:text-notion-text disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ↑
                      </button>
                      <span className="text-xs font-medium text-notion-textLight">
                        {index + 1}
                      </span>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === collectionSequence.length - 1}
                        className="text-notion-textLight hover:text-notion-text disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ↓
                      </button>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-notion-text">
                          {field.label}
                        </h4>
                        <span className="text-xs px-2 py-0.5 bg-notion-hover rounded text-notion-textLight">
                          {field.type}
                        </span>
                        {field.required && (
                          <span className="text-xs text-red-600">*</span>
                        )}
                      </div>
                      <p className="text-xs text-notion-textLight">
                        {field.promptTemplate}
                      </p>
                      {field.validation && Object.keys(field.validation).length > 0 && (
                        <div className="mt-1 text-xs text-notion-accent">
                          ✓ Has validation rules
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveField(index)}
                    className="text-sm text-notion-textLight hover:text-red-600 px-2"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Field Button */}
      {availableFields.length > 0 && collectionSequence.length > 0 && (
        <button
          onClick={() => setShowFieldSelector(true)}
          className="w-full py-3 border-2 border-dashed border-notion-border rounded text-sm text-notion-textLight hover:border-notion-text hover:text-notion-text transition-colors"
        >
          + Add Field to Collection
        </button>
      )}

      {/* Field Selector Modal */}
      {showFieldSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-notion-border">
              <h3 className="text-lg font-semibold text-notion-text">
                Select Field to Add
              </h3>
              <p className="text-sm text-notion-textLight mt-1">
                Choose a field from your configuration
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {availableFields.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-notion-textLight">
                    All fields have been added to the collection
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableFields.map((field, index) => (
                    <div
                      key={index}
                      onClick={() => handleAddField(field.name)}
                      className="card p-4 cursor-pointer hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-notion-text">
                          {field.label}
                        </h4>
                        <span className="text-xs px-2 py-0.5 bg-notion-hover rounded text-notion-textLight">
                          {field.type}
                        </span>
                        {field.required && (
                          <span className="text-xs text-red-600">*</span>
                        )}
                      </div>
                      <p className="text-xs text-notion-textLight">
                        {field.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-notion-border">
              <button
                onClick={() => setShowFieldSelector(false)}
                className="btn-secondary w-full"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlowEditor;
