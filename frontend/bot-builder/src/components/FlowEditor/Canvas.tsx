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
import { useLanguage } from '@/i18n/LanguageContext';
import { nodeTypes } from './NodeTypes';
import { Toolbar } from './Toolbar';
import { Inspector } from './Inspector';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

const FlowCanvas: React.FC = () => {
  const { t } = useLanguage();
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

  const { zoomIn, zoomOut } = useReactFlow();

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 300 });
  }, [fitView]);

  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 300 });
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 300 });
  }, [zoomOut]);

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
          <Background
            color="rgba(255, 255, 255, 0.05)"
            gap={20}
            size={1}
          />
          <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
            className="!bg-white/[0.04] !border-white/[0.08] rounded-lg overflow-hidden"
            maskColor="rgba(0, 0, 0, 0.6)"
          />
          <Panel position="top-right" className="flex flex-col gap-3">
            {/* Zoom In */}
            <button
              onClick={handleZoomIn}
              className="group relative w-12 h-12 rounded-full bg-white/[0.04] backdrop-blur-xl border border-white/10 text-white/70 hover:text-white transition-all duration-300 flex items-center justify-center hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]"
              title="Zoom in"
            >
              <div className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/[0.08] transition-all duration-300" />
              <ZoomIn className="w-5 h-5 relative z-10" />
            </button>

            {/* Zoom Out */}
            <button
              onClick={handleZoomOut}
              className="group relative w-12 h-12 rounded-full bg-white/[0.04] backdrop-blur-xl border border-white/10 text-white/70 hover:text-white transition-all duration-300 flex items-center justify-center hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]"
              title="Zoom out"
            >
              <div className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/[0.08] transition-all duration-300" />
              <ZoomOut className="w-5 h-5 relative z-10" />
            </button>

            {/* Fit View */}
            <button
              onClick={handleFitView}
              className="group relative w-12 h-12 rounded-full bg-white/[0.04] backdrop-blur-xl border border-white/10 text-white/70 hover:text-white transition-all duration-300 flex items-center justify-center hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]"
              title={t('flow.canvas.fitView')}
            >
              <div className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/[0.08] transition-all duration-300" />
              <Maximize className="w-5 h-5 relative z-10" />
            </button>
          </Panel>
        </ReactFlow>

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center p-8 bg-white/[0.02] backdrop-blur-xl rounded-xl border border-white/[0.08]">
              <div className="w-2 h-2 rounded-full bg-white/40 mx-auto mb-4"></div>
              <p className="text-white mb-2 font-medium">{t('flow.canvas.empty')}</p>
              <p className="text-sm text-white/60">
                {t('flow.canvas.empty.hint')}
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
