import React, { useEffect } from 'react';
import { useFlowState } from '@/hooks/useFlowState';
import { Canvas } from './Canvas';

interface FlowEditorBridgeProps {
  flow: any;
  onChange: (flow: any) => void;
  fields: any[];
}

/**
 * Bridge component that syncs prop-based state with zustand store
 * This allows the Canvas component to work with App.tsx's state management
 */
export const FlowEditorBridge: React.FC<FlowEditorBridgeProps> = ({
  flow,
  onChange,
  fields
}) => {
  const { nodes, edges, setNodes, setEdges, setRequiredFields } = useFlowState();

  // Sync external flow to zustand store on mount or when it changes
  useEffect(() => {
    if (flow?.nodes && flow?.edges) {
      setNodes(flow.nodes);
      setEdges(flow.edges);
    }
  }, [flow?.nodes, flow?.edges, setNodes, setEdges]);

  // Sync fields to zustand store
  useEffect(() => {
    if (fields) {
      setRequiredFields(fields);
    }
  }, [fields, setRequiredFields]);

  // Sync zustand store changes back to parent
  useEffect(() => {
    onChange({
      nodes,
      edges,
      start_node: nodes.find(n => n.type === 'start')?.id || nodes[0]?.id
    });
  }, [nodes, edges, onChange]);

  return <Canvas />;
};
