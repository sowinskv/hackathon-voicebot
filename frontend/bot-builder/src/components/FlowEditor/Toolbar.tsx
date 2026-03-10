import React from 'react';
import {
  Play,
  MessageSquare,
  Database,
  CheckCircle,
  AlertCircle,
  PhoneForwarded,
  StopCircle,
  GitBranch,
  FolderInput
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface ToolbarProps {
  onAddNode: (type: string) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onAddNode }) => {
  const { t } = useLanguage();

  const nodeDefinitions = [
    { type: 'start', labelKey: 'flow.node.start', descKey: 'flow.node.start.desc', icon: Play, color: 'text-green-600' },
    { type: 'message', labelKey: 'flow.node.message', descKey: 'flow.node.message.desc', icon: MessageSquare, color: 'text-blue-600' },
    { type: 'fieldGroup', labelKey: 'flow.node.fieldGroup', descKey: 'flow.node.fieldGroup.desc', icon: FolderInput, color: 'text-purple-600' },
    { type: 'branch', labelKey: 'flow.node.branch', descKey: 'flow.node.branch.desc', icon: GitBranch, color: 'text-orange-600' },
    { type: 'slotCollection', labelKey: 'flow.node.slotCollection', descKey: 'flow.node.slotCollection.desc', icon: Database, color: 'text-purple-500' },
    { type: 'validation', labelKey: 'flow.node.validation', descKey: 'flow.node.validation.desc', icon: CheckCircle, color: 'text-amber-600' },
    { type: 'confirmation', labelKey: 'flow.node.confirmation', descKey: 'flow.node.confirmation.desc', icon: AlertCircle, color: 'text-cyan-600' },
    { type: 'escalation', labelKey: 'flow.node.escalation', descKey: 'flow.node.escalation.desc', icon: PhoneForwarded, color: 'text-red-600' },
    { type: 'end', labelKey: 'flow.node.end', descKey: 'flow.node.end.desc', icon: StopCircle, color: 'text-gray-600' },
  ];
  const handleDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <h3 className="font-semibold text-gray-900 mb-4">{t('flow.toolbar.title')}</h3>
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
              <div className="font-medium text-sm text-gray-900">{t(node.labelKey as any)}</div>
              <div className="text-xs text-gray-500 mt-0.5">{t(node.descKey as any)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          {t('flow.toolbar.tip')}
        </p>
      </div>
    </div>
  );
};
