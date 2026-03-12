import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
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

const NodeWrapper: React.FC<{
  children: React.ReactNode;
  color: string;
  selected?: boolean;
}> = ({ children, color, selected }) => (
  <div
    className={`px-4 py-3 rounded-xl border-2 min-w-[180px] bg-white/[0.04] backdrop-blur-md transition-all duration-200 ${
      selected ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-transparent shadow-[0_8px_30px_rgba(255,255,255,0.12)]' : 'shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
    }`}
    style={{ borderColor: color }}
  >
    {children}
  </div>
);

export const StartNode = memo(({ data, selected }: NodeProps) => (
  <NodeWrapper color="rgba(16, 185, 129, 0.8)" selected={selected}>
    <div className="flex items-center gap-2 mb-2">
      <Play className="w-4 h-4 text-emerald-300" />
      <div className="font-semibold text-white text-sm">{data.label}</div>
    </div>
    {data.message && (
      <div className="text-xs text-white/70 mt-1">{data.message}</div>
    )}
    <Handle type="source" position={Position.Bottom} className="!bg-emerald-400/80 !w-2 !h-2 !border-2 !border-white/30" />
  </NodeWrapper>
));

export const MessageNode = memo(({ data, selected }: NodeProps) => (
  <NodeWrapper color="rgba(59, 130, 246, 0.8)" selected={selected}>
    <Handle type="target" position={Position.Top} className="!bg-blue-400/80 !w-2 !h-2 !border-2 !border-white/30" />
    <div className="flex items-center gap-2 mb-2">
      <MessageSquare className="w-4 h-4 text-blue-300" />
      <div className="font-semibold text-white text-sm">{data.label}</div>
    </div>
    {data.message && (
      <div className="text-xs text-white/70 mt-1 line-clamp-2">{data.message}</div>
    )}
    <Handle type="source" position={Position.Bottom} className="!bg-blue-400/80 !w-2 !h-2 !border-2 !border-white/30" />
  </NodeWrapper>
));

export const SlotCollectionNode = memo(({ data, selected }: NodeProps) => (
  <NodeWrapper color="rgba(139, 92, 246, 0.8)" selected={selected}>
    <Handle type="target" position={Position.Top} className="!bg-purple-400/80 !w-2 !h-2 !border-2 !border-white/30" />
    <div className="flex items-center gap-2 mb-2">
      <Database className="w-4 h-4 text-purple-300" />
      <div className="font-semibold text-white text-sm">{data.label}</div>
    </div>
    {data.slots && data.slots.length > 0 && (
      <div className="text-xs text-white/60 mt-1">
        Collecting: {data.slots.join(', ')}
      </div>
    )}
    <Handle type="source" position={Position.Bottom} className="!bg-purple-400/80 !w-2 !h-2 !border-2 !border-white/30" />
  </NodeWrapper>
));

export const ValidationNode = memo(({ data, selected }: NodeProps) => (
  <NodeWrapper color="rgba(245, 158, 11, 0.8)" selected={selected}>
    <Handle type="target" position={Position.Top} className="!bg-amber-400/80 !w-2 !h-2 !border-2 !border-white/30" />
    <div className="flex items-center gap-2 mb-2">
      <CheckCircle className="w-4 h-4 text-amber-300" />
      <div className="font-semibold text-white text-sm">{data.label}</div>
    </div>
    {data.field && (
      <div className="text-xs text-white/70 mt-1">Field: {data.field}</div>
    )}
    <Handle type="source" position={Position.Bottom} id="valid" className="!bg-emerald-400/80 !w-2 !h-2 !border-2 !border-white/30 !left-[30%]" />
    <Handle type="source" position={Position.Bottom} id="invalid" className="!bg-red-400/80 !w-2 !h-2 !border-2 !border-white/30 !left-[70%]" />
  </NodeWrapper>
));

export const ConfirmationNode = memo(({ data, selected }: NodeProps) => (
  <NodeWrapper color="rgba(6, 182, 212, 0.8)" selected={selected}>
    <Handle type="target" position={Position.Top} className="!bg-cyan-400/80 !w-2 !h-2 !border-2 !border-white/30" />
    <div className="flex items-center gap-2 mb-2">
      <AlertCircle className="w-4 h-4 text-cyan-300" />
      <div className="font-semibold text-white text-sm">{data.label}</div>
    </div>
    {data.message && (
      <div className="text-xs text-white/70 mt-1 line-clamp-2">{data.message}</div>
    )}
    <Handle type="source" position={Position.Bottom} id="confirmed" className="!bg-emerald-400/80 !w-2 !h-2 !border-2 !border-white/30 !left-[30%]" />
    <Handle type="source" position={Position.Bottom} id="rejected" className="!bg-red-400/80 !w-2 !h-2 !border-2 !border-white/30 !left-[70%]" />
  </NodeWrapper>
));

export const EscalationNode = memo(({ data, selected }: NodeProps) => (
  <NodeWrapper color="rgba(239, 68, 68, 0.8)" selected={selected}>
    <Handle type="target" position={Position.Top} className="!bg-red-400/80 !w-2 !h-2 !border-2 !border-white/30" />
    <div className="flex items-center gap-2 mb-2">
      <PhoneForwarded className="w-4 h-4 text-red-300" />
      <div className="font-semibold text-white text-sm">{data.label}</div>
    </div>
    {data.reason && (
      <div className="text-xs text-white/70 mt-1 line-clamp-2">{data.reason}</div>
    )}
    <Handle type="source" position={Position.Bottom} className="!bg-red-400/80 !w-2 !h-2 !border-2 !border-white/30" />
  </NodeWrapper>
));

export const EndNode = memo(({ data, selected }: NodeProps) => (
  <NodeWrapper color="rgba(100, 116, 139, 0.8)" selected={selected}>
    <Handle type="target" position={Position.Top} className="!bg-slate-400/80 !w-2 !h-2 !border-2 !border-white/30" />
    <div className="flex items-center gap-2 mb-2">
      <StopCircle className="w-4 h-4 text-slate-300" />
      <div className="font-semibold text-white text-sm">{data.label}</div>
    </div>
    {data.message && (
      <div className="text-xs text-white/70 mt-1">{data.message}</div>
    )}
  </NodeWrapper>
));

export const BranchNode = memo(({ data, selected }: NodeProps) => {
  const branches = data.branches || [];

  return (
    <div
      className={`bg-white/[0.04] backdrop-blur-md rounded-xl border-2 shadow-[0_4px_20px_rgba(0,0,0,0.3)] min-w-[250px] transition-all duration-200 ${
        selected ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-transparent shadow-[0_8px_30px_rgba(255,255,255,0.12)]' : ''
      }`}
      style={{ borderColor: 'rgba(249, 115, 22, 0.8)' }}
    >
      <Handle type="target" position={Position.Top} className="!bg-orange-400/80 !w-2 !h-2 !border-2 !border-white/30" />

      {/* Header */}
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-orange-300" />
          <div className="font-semibold text-white text-sm">{data.label}</div>
        </div>
        {data.description && (
          <p className="text-xs text-white/60 mt-1">{data.description}</p>
        )}
      </div>

      {/* Branches */}
      <div className="p-2 space-y-1">
        {branches.length > 0 ? (
          branches.map((branch: any, idx: number) => (
            <div
              key={branch.id || idx}
              className="text-xs bg-white/[0.04] rounded px-2 py-1 flex items-center justify-between border border-white/5"
            >
              <span className="font-medium text-orange-200">{branch.name}</span>
              <span className="text-white/50">
                {branch.required_fields?.length || 0} fields
              </span>
            </div>
          ))
        ) : (
          <div className="text-xs text-white/40 text-center py-2">
            No branches configured
          </div>
        )}
      </div>

      {/* Multiple output handles (one per branch) */}
      {branches.map((branch: any, idx: number) => (
        <Handle
          key={branch.id || idx}
          type="source"
          position={Position.Bottom}
          id={branch.id}
          className="!bg-orange-400/80 !w-2 !h-2 !border-2 !border-white/30"
          style={{
            left: `${(100 / (branches.length + 1)) * (idx + 1)}%`,
          }}
        />
      ))}

      {/* Default fallback handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="fallback"
        className="!bg-slate-400/80 !w-2 !h-2 !border-2 !border-white/30"
      />
    </div>
  );
});

export const FieldGroupNode = memo(({ data, selected }: NodeProps) => {
  const fields = data.fields || [];

  return (
    <NodeWrapper color="rgba(168, 85, 247, 0.8)" selected={selected}>
      <Handle type="target" position={Position.Top} className="!bg-purple-400/80 !w-2 !h-2 !border-2 !border-white/30" />
      <div className="flex items-center gap-2 mb-2">
        <FolderInput className="w-4 h-4 text-purple-300" />
        <div className="font-semibold text-white text-sm">{data.label}</div>
      </div>
      {data.description && (
        <div className="text-xs text-white/60 mb-2">{data.description}</div>
      )}
      {fields.length > 0 ? (
        <div className="text-xs text-white/70 mt-1">
          {fields.length} field{fields.length !== 1 ? 's' : ''}: {fields.slice(0, 3).join(', ')}
          {fields.length > 3 && '...'}
        </div>
      ) : (
        <div className="text-xs text-white/40 mt-1">No fields selected</div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-purple-400/80 !w-2 !h-2 !border-2 !border-white/30" />
    </NodeWrapper>
  );
});

// Survey node for satisfaction surveys
export const SurveyNode = memo(({ data, selected }: NodeProps) => (
  <NodeWrapper color="rgba(236, 72, 153, 0.8)" selected={selected}>
    <Handle type="target" position={Position.Top} className="!bg-pink-400/80 !w-2 !h-2 !border-2 !border-white/30" />
    <div className="flex items-center gap-2 mb-2">
      <CheckCircle className="w-4 h-4 text-pink-300" />
      <div className="font-semibold text-white text-sm">{data.label}</div>
    </div>
    {data.description && (
      <div className="text-xs text-white/70 mt-1">{data.description}</div>
    )}
    <Handle type="source" position={Position.Bottom} className="!bg-pink-400/80 !w-2 !h-2 !border-2 !border-white/30" />
  </NodeWrapper>
));

// Default node for any custom or unrecognized types
export const DefaultNode = memo(({ data, selected }: NodeProps) => (
  <NodeWrapper color="rgba(168, 85, 247, 0.8)" selected={selected}>
    <Handle type="target" position={Position.Top} className="!bg-purple-400/80 !w-2 !h-2 !border-2 !border-white/30" />
    <div className="flex items-center gap-2 mb-2">
      <Database className="w-4 h-4 text-purple-300" />
      <div className="font-semibold text-white text-sm">{data.label || 'Custom Node'}</div>
    </div>
    {data.description && (
      <div className="text-xs text-white/70 mt-1">{data.description}</div>
    )}
    <Handle type="source" position={Position.Bottom} className="!bg-purple-400/80 !w-2 !h-2 !border-2 !border-white/30" />
  </NodeWrapper>
));

export const nodeTypes = {
  start: StartNode,
  message: MessageNode,
  slotCollection: SlotCollectionNode,
  slot_collection: SlotCollectionNode, // Alias for backwards compatibility
  fieldGroup: FieldGroupNode,
  branch: BranchNode,
  validation: ValidationNode,
  confirmation: ConfirmationNode,
  escalation: EscalationNode,
  survey: SurveyNode,
  end: EndNode,
  default: DefaultNode,
};
