import React from 'react';
import {
  Play,
  MessageSquare,
  Database,
  CheckCircle,
  AlertCircle,
  PhoneForwarded,
  StopCircle
} from 'lucide-react';

interface ToolbarProps {
  onAddNode: (type: string) => void;
}

const nodeDefinitions = [
  { type: 'start', label: 'Start', icon: Play, color: 'text-green-600', description: 'Starting point' },
  { type: 'message', label: 'Message', icon: MessageSquare, color: 'text-blue-600', description: 'Send a message' },
  { type: 'slotCollection', label: 'Slot Collection', icon: Database, color: 'text-purple-600', description: 'Collect information' },
  { type: 'validation', label: 'Validation', icon: CheckCircle, color: 'text-amber-600', description: 'Validate input' },
  { type: 'confirmation', label: 'Confirmation', icon: AlertCircle, color: 'text-cyan-600', description: 'Confirm with user' },
  { type: 'escalation', label: 'Escalation', icon: PhoneForwarded, color: 'text-red-600', description: 'Transfer to agent' },
  { type: 'end', label: 'End', icon: StopCircle, color: 'text-gray-600', description: 'End conversation' },
];

export const Toolbar: React.FC<ToolbarProps> = ({ onAddNode }) => {
  const handleDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <h3 className="font-semibold text-gray-900 mb-4">Node Palette</h3>
      <div className="space-y-2">
        {nodeDefinitions.map((node) => (
          <div
            key={node.type}
            draggable
            onDragStart={(e) => handleDragStart(e, node.type)}
            onClick={() => onAddNode(node.type)}
            className="flex items-start gap-3 p-3 rounded-lg border-2 border-gray-200 cursor-move hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <node.icon className={`w-5 h-5 mt-0.5 ${node.color} flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-gray-900">{node.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{node.description}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Tip:</strong> Drag and drop nodes onto the canvas or click to add at the center.
        </p>
      </div>
    </div>
  );
};
