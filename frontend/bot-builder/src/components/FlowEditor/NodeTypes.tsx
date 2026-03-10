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
    className={`px-4 py-3 rounded-lg border-2 min-w-[180px] bg-white shadow-md ${
      selected ? 'ring-2 ring-primary-500 ring-offset-2' : ''
    }`}
    style={{ borderColor: color }}
  >
    {children}
  </div>
);

export const StartNode = memo(({ data, selected }: NodeProps) => (
  <NodeWrapper color="#10b981" selected={selected}>
    <div className="flex items-center gap-2 mb-2">
      <Play className="w-5 h-5 text-green-600" />
      <div className="font-semibold text-gray-900">{data.label}</div>
    </div>
    {data.message && (
      <div className="text-sm text-gray-600 mt-1">{data.message}</div>
    )}
    <Handle type="source" position={Position.Bottom} className="!bg-green-500" />
  </NodeWrapper>
));

export const MessageNode = memo(({ data, selected }: NodeProps) => (
  <NodeWrapper color="#3b82f6" selected={selected}>
    <Handle type="target" position={Position.Top} className="!bg-blue-500" />
    <div className="flex items-center gap-2 mb-2">
      <MessageSquare className="w-5 h-5 text-blue-600" />
      <div className="font-semibold text-gray-900">{data.label}</div>
    </div>
    {data.message && (
      <div className="text-sm text-gray-600 mt-1 line-clamp-2">{data.message}</div>
    )}
    <Handle type="source" position={Position.Bottom} className="!bg-blue-500" />
  </NodeWrapper>
));

export const SlotCollectionNode = memo(({ data, selected }: NodeProps) => (
  <NodeWrapper color="#8b5cf6" selected={selected}>
    <Handle type="target" position={Position.Top} className="!bg-purple-500" />
    <div className="flex items-center gap-2 mb-2">
      <Database className="w-5 h-5 text-purple-600" />
      <div className="font-semibold text-gray-900">{data.label}</div>
    </div>
    {data.slots && data.slots.length > 0 && (
      <div className="text-xs text-gray-500 mt-1">
        Collecting: {data.slots.join(', ')}
      </div>
    )}
    <Handle type="source" position={Position.Bottom} className="!bg-purple-500" />
  </NodeWrapper>
));

export const ValidationNode = memo(({ data, selected }: NodeProps) => (
  <NodeWrapper color="#f59e0b" selected={selected}>
    <Handle type="target" position={Position.Top} className="!bg-amber-500" />
    <div className="flex items-center gap-2 mb-2">
      <CheckCircle className="w-5 h-5 text-amber-600" />
      <div className="font-semibold text-gray-900">{data.label}</div>
    </div>
    {data.field && (
      <div className="text-sm text-gray-600 mt-1">Field: {data.field}</div>
    )}
    <Handle type="source" position={Position.Bottom} id="valid" className="!bg-green-500 !left-[30%]" />
    <Handle type="source" position={Position.Bottom} id="invalid" className="!bg-red-500 !left-[70%]" />
  </NodeWrapper>
));

export const ConfirmationNode = memo(({ data, selected }: NodeProps) => (
  <NodeWrapper color="#06b6d4" selected={selected}>
    <Handle type="target" position={Position.Top} className="!bg-cyan-500" />
    <div className="flex items-center gap-2 mb-2">
      <AlertCircle className="w-5 h-5 text-cyan-600" />
      <div className="font-semibold text-gray-900">{data.label}</div>
    </div>
    {data.message && (
      <div className="text-sm text-gray-600 mt-1 line-clamp-2">{data.message}</div>
    )}
    <Handle type="source" position={Position.Bottom} id="confirmed" className="!bg-green-500 !left-[30%]" />
    <Handle type="source" position={Position.Bottom} id="rejected" className="!bg-red-500 !left-[70%]" />
  </NodeWrapper>
));

export const EscalationNode = memo(({ data, selected }: NodeProps) => (
  <NodeWrapper color="#ef4444" selected={selected}>
    <Handle type="target" position={Position.Top} className="!bg-red-500" />
    <div className="flex items-center gap-2 mb-2">
      <PhoneForwarded className="w-5 h-5 text-red-600" />
      <div className="font-semibold text-gray-900">{data.label}</div>
    </div>
    {data.reason && (
      <div className="text-sm text-gray-600 mt-1 line-clamp-2">{data.reason}</div>
    )}
    <Handle type="source" position={Position.Bottom} className="!bg-red-500" />
  </NodeWrapper>
));

export const EndNode = memo(({ data, selected }: NodeProps) => (
  <NodeWrapper color="#64748b" selected={selected}>
    <Handle type="target" position={Position.Top} className="!bg-gray-500" />
    <div className="flex items-center gap-2 mb-2">
      <StopCircle className="w-5 h-5 text-gray-600" />
      <div className="font-semibold text-gray-900">{data.label}</div>
    </div>
    {data.message && (
      <div className="text-sm text-gray-600 mt-1">{data.message}</div>
    )}
  </NodeWrapper>
));

export const BranchNode = memo(({ data, selected }: NodeProps) => {
  const branches = data.branches || [];

  return (
    <div
      className={`bg-white rounded-lg border-2 shadow-lg min-w-[250px] ${
        selected ? 'ring-2 ring-orange-300 ring-offset-2' : ''
      }`}
      style={{ borderColor: '#f97316' }}
    >
      <Handle type="target" position={Position.Top} className="!bg-orange-500" />

      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-orange-600" />
          <div className="font-semibold text-gray-900">{data.label}</div>
        </div>
        {data.description && (
          <p className="text-xs text-gray-500 mt-1">{data.description}</p>
        )}
      </div>

      {/* Branches */}
      <div className="p-2 space-y-1">
        {branches.length > 0 ? (
          branches.map((branch: any, idx: number) => (
            <div
              key={branch.id || idx}
              className="text-xs bg-orange-50 rounded px-2 py-1 flex items-center justify-between"
            >
              <span className="font-medium text-orange-700">{branch.name}</span>
              <span className="text-gray-500">
                {branch.required_fields?.length || 0} fields
              </span>
            </div>
          ))
        ) : (
          <div className="text-xs text-gray-400 text-center py-2">
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
          className="!bg-orange-500"
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
        className="!bg-gray-400"
      />
    </div>
  );
});

export const FieldGroupNode = memo(({ data, selected }: NodeProps) => {
  const fields = data.fields || [];

  return (
    <NodeWrapper color="#a855f7" selected={selected}>
      <Handle type="target" position={Position.Top} className="!bg-purple-500" />
      <div className="flex items-center gap-2 mb-2">
        <FolderInput className="w-5 h-5 text-purple-600" />
        <div className="font-semibold text-gray-900">{data.label}</div>
      </div>
      {data.description && (
        <div className="text-xs text-gray-500 mb-2">{data.description}</div>
      )}
      {fields.length > 0 ? (
        <div className="text-xs text-gray-600 mt-1">
          {fields.length} field{fields.length !== 1 ? 's' : ''}: {fields.slice(0, 3).join(', ')}
          {fields.length > 3 && '...'}
        </div>
      ) : (
        <div className="text-xs text-gray-400 mt-1">No fields selected</div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-purple-500" />
    </NodeWrapper>
  );
});

export const nodeTypes = {
  start: StartNode,
  message: MessageNode,
  slotCollection: SlotCollectionNode,
  fieldGroup: FieldGroupNode,
  branch: BranchNode,
  validation: ValidationNode,
  confirmation: ConfirmationNode,
  escalation: EscalationNode,
  end: EndNode,
};
