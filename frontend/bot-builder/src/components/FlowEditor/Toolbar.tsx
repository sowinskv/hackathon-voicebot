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
    <div className="w-64 bg-white/[0.02] border-r border-white/[0.06] p-4 overflow-y-auto backdrop-blur-xl">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-1 h-1 rounded-full bg-white/60"></div>
        <h3 className="font-semibold text-white text-sm tracking-tight">{t('flow.toolbar.title')}</h3>
      </div>
      <div className="space-y-2">
        {nodeDefinitions.map((node) => (
          <div
            key={node.type}
            draggable
            onDragStart={(e) => handleDragStart(e, node.type)}
            onClick={() => onAddNode(node.type)}
            className="group flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] cursor-move hover:bg-white/[0.05] hover:border-white/10 transition-all duration-200"
          >
            <node.icon className={`w-4 h-4 mt-0.5 text-white/70 group-hover:text-white flex-shrink-0 transition-colors duration-200`} />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-white tracking-tight">{t(node.labelKey as any)}</div>
              <div className="text-xs text-white/50 mt-0.5 leading-relaxed">{t(node.descKey as any)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg">
        <div className="flex items-start gap-2">
          <div className="w-1 h-1 rounded-full bg-white/40 mt-1.5 flex-shrink-0"></div>
          <p className="text-xs text-white/60 leading-relaxed">
            {t('flow.toolbar.tip')}
          </p>
        </div>
      </div>
    </div>
  );
};
