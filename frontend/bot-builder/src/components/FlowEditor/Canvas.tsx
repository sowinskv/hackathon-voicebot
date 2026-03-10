import React, { useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useFlowState } from '@/hooks/useFlowState';
import { nodeTypes } from './NodeTypes';
import { Toolbar } from './Toolbar';
import { Inspector } from './Inspector';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

const FlowCanvas: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();

  const {
    nodes,
    edges,
    selectedNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    selectNode,
  } = useFlowState();

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: any) => {
      selectNode(node);
    },
    [selectNode]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !reactFlowWrapper.current) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(type, position);
    },
    [screenToFlowPosition, addNode]
  );

  const handleAddNode = useCallback(
    (type: string) => {
      // Add node to center of viewport
      const position = { x: 250, y: 150 };
      addNode(type, position);
    },
    [addNode]
  );

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 300 });
  }, [fitView]);

  return (
    <div className="flex h-full">
      <Toolbar onAddNode={handleAddNode} />

      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          deleteKeyCode="Delete"
          multiSelectionKeyCode="Control"
        >
          <Background />
          <Controls showInteractive={false} />
          <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
            className="!bg-gray-100"
          />
          <Panel position="top-right" className="flex gap-2">
            <button
              onClick={handleFitView}
              className="btn btn-secondary flex items-center gap-2"
              title="Fit view"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </Panel>
        </ReactFlow>

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center p-8 bg-white rounded-lg shadow-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-600 mb-2">Your canvas is empty</p>
              <p className="text-sm text-gray-500">
                Drag nodes from the palette or click to add them
              </p>
            </div>
          </div>
        )}
      </div>

      {selectedNode && (
        <Inspector node={selectedNode} onClose={() => selectNode(null)} />
      )}
    </div>
  );
};

export const Canvas: React.FC = () => {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
};
