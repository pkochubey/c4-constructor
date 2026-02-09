import React, { useCallback, useMemo, useEffect, DragEvent } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  Connection,
  Edge,
  Node,
  useNodesState,
  BackgroundVariant,
  NodeChange,
  EdgeChange,
  MarkerType,
  ReactFlowProvider,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import { nodeTypes } from '../nodes';
import { useTranslation } from 'react-i18next';
import { useWorkspaceStore } from '../../store';
import { C4ElementType, C4_COLORS } from '../../types';

const CanvasInner: React.FC = () => {
  const { t } = useTranslation();
  const reactFlowInstance = useReactFlow();
  const {
    workspace,
    workspaceVersion,
    addElement,
    updateElement,
    deleteElement,
    selectElement,
    addRelationship,
    selectedElementId,
    selectRelationship,
    selectedRelationshipId,
    currentViewId,
    elementsLocked
  } = useWorkspaceStore();

  const currentView = useMemo(() => {
    return workspace.views.find(v => v.id === currentViewId) || workspace.views[0];
  }, [workspace.views, currentViewId]);

  const visibleElements = useMemo(() => {
    if (!currentView) return workspace.elements;

    switch (currentView.type) {
      case 'systemLandscape':
        return workspace.elements.filter(e => !e.parentId);

      case 'systemContext': {
        const focusId = currentView.softwareSystemId;
        if (!focusId) return workspace.elements;
        const relatedIds = new Set<string>();
        workspace.relationships.forEach(rel => {
          if (rel.sourceId === focusId) relatedIds.add(rel.targetId);
          if (rel.targetId === focusId) relatedIds.add(rel.sourceId);
        });
        return workspace.elements.filter(e => relatedIds.has(e.id));
      }

      case 'container': {
        const systemId = currentView.softwareSystemId;
        if (!systemId) return workspace.elements;
        const containers = workspace.elements.filter(e => e.parentId === systemId && e.type === 'container');
        const containerIds = new Set(containers.map(c => c.id));
        const relatedIds = new Set([...containerIds]);

        workspace.relationships.forEach(rel => {
          if (containerIds.has(rel.sourceId)) relatedIds.add(rel.targetId);
          if (containerIds.has(rel.targetId)) relatedIds.add(rel.sourceId);
          if (rel.sourceId === systemId) relatedIds.add(rel.targetId);
          if (rel.targetId === systemId) relatedIds.add(rel.sourceId);
        });

        return workspace.elements.filter(e => e.id !== systemId && (relatedIds.has(e.id)));
      }

      case 'component': {
        const containerId = currentView.containerId;
        if (!containerId) return workspace.elements;
        // Show only components of this container, no related elements
        return workspace.elements.filter(e => e.parentId === containerId && e.type === 'component');
      }

      default:
        return workspace.elements;
    }
  }, [workspace.elements, workspace.relationships, currentView]);

  const initialNodes: Node[] = useMemo(() => {
    return visibleElements.map((element) => {
      const isFocusZone = currentView && (
        (currentView.type === 'systemContext' && element.id === currentView.softwareSystemId) ||
        (currentView.type === 'container' && element.id === currentView.softwareSystemId) ||
        (currentView.type === 'component' && element.id === currentView.containerId)
      );

      const parent = element.parentId ? workspace.elements.find(e => e.id === element.parentId) : null;
      const shouldStick = parent && (
        parent.type === 'group' ||
        currentView?.type === 'systemLandscape'
      );

      let displayPosition = { ...element.position };
      // Only accumulate parent positions if parent is visible in the current view
      // In Component View, the Container is hidden (focus zone), so don't add its position
      if (!shouldStick && element.parentId && currentView?.type !== 'component') {
        let currentParentId: string | undefined = element.parentId;
        while (currentParentId) {
          const p = workspace.elements.find(e => e.id === currentParentId);
          if (p) {
            displayPosition.x += p.position.x;
            displayPosition.y += p.position.y;
            currentParentId = p.parentId;
          } else {
            break;
          }
        }
      }

      const nodeType = isFocusZone ? 'group' : element.type;
      const nodeData = {
        element: {
          ...element,
          name: isFocusZone ? `${element.name} [Context]` : element.name
        }
      };

      return {
        id: element.id,
        type: nodeType,
        position: displayPosition,
        data: nodeData,
        selected: element.id === selectedElementId,
        draggable: !elementsLocked,
        parentNode: shouldStick ? (element.parentId || undefined) : undefined,
        extent: shouldStick ? 'parent' as const : undefined,
        zIndex: isFocusZone || element.type === 'group' ? -1 : 1
      };
    });
  }, [visibleElements, currentView, workspace.elements, selectedElementId, elementsLocked]);

  const structureKey = useMemo(() => {
    const ids = visibleElements.map(e => e.id).sort().join(',');
    return `${currentViewId || 'none'}-${ids}-${workspaceVersion}`;
  }, [currentViewId, visibleElements, workspaceVersion]);

  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);

  useEffect(() => {
    setNodes(initialNodes);
  }, [structureKey, setNodes]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        selected: node.id === selectedElementId,
      }))
    );
  }, [selectedElementId, setNodes]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        draggable: !elementsLocked,
      }))
    );
  }, [elementsLocked, setNodes]);

  // Auto-fit view when switching between views
  useEffect(() => {
    setTimeout(() => {
      reactFlowInstance.fitView();
    }, 100);
  }, [currentViewId, reactFlowInstance]);


  const edges: Edge[] = useMemo(() => {
    const visibleElementIds = new Set(visibleElements.map(e => e.id));

    const getVisibleRep = (id: string): string | null => {
      if (visibleElementIds.has(id)) return id;
      const element = workspace.elements.find(e => e.id === id);
      if (element?.parentId) return getVisibleRep(element.parentId);
      return null;
    };

    const aggregatedEdges = new Map<string, Edge>();

    workspace.relationships.forEach((rel) => {
      const sourceRep = getVisibleRep(rel.sourceId);
      const targetRep = getVisibleRep(rel.targetId);

      if (sourceRep && targetRep && sourceRep !== targetRep) {
        const edgeId = `${sourceRep}-${targetRep}`;
        const isInferred = sourceRep !== rel.sourceId || targetRep !== rel.targetId;

        if (aggregatedEdges.has(edgeId)) return;

        aggregatedEdges.set(edgeId, {
          id: rel.id,
          source: sourceRep,
          target: targetRep,
          label: rel.description,
          type: 'smoothstep',
          animated: false,
          selected: rel.id === selectedRelationshipId,
          style: {
            stroke: rel.id === selectedRelationshipId ? '#ff0072' : '#555',
            strokeWidth: rel.id === selectedRelationshipId ? 3 : 2,
            strokeDasharray: isInferred ? '5,5' : undefined
          },
          labelStyle: { fill: '#333', fontSize: 12, fontWeight: rel.id === selectedRelationshipId ? 'bold' : 'normal' },
          labelBgStyle: { fill: rel.id === selectedRelationshipId ? '#ffe0eb' : '#fff', fillOpacity: 0.9 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: rel.id === selectedRelationshipId ? '#ff0072' : '#555'
          }
        });
      }
    });

    return Array.from(aggregatedEdges.values());
  }, [workspace.elements, workspace.relationships, visibleElements, selectedRelationshipId]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (elementsLocked) return;

      onNodesChangeInternal(changes);

      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
          const element = workspace.elements.find(el => el.id === change.id);
          if (!element) return;

          const parentInStore = element.parentId ? workspace.elements.find(e => e.id === element.parentId) : null;
          const wasSticky = parentInStore && (
            parentInStore.type === 'group' ||
            currentView?.type === 'systemLandscape'
          );

          let absolutePosition = change.position;
          if (wasSticky && parentInStore) {
            absolutePosition = {
              x: parentInStore.position.x + change.position.x,
              y: parentInStore.position.y + change.position.y
            };
          }



          if (element.parentId && currentView?.type !== 'component') {
            const currentParent = workspace.elements.find(e => e.id === element.parentId);
            if (currentParent) {
              updateElement(change.id, {
                position: {
                  x: absolutePosition.x - currentParent.position.x,
                  y: absolutePosition.y - currentParent.position.y
                }
              });
              return;
            }
          }

          updateElement(change.id, { position: absolutePosition });
        }
        if (change.type === 'select') {
          if (change.selected) selectElement(change.id);
        }
        if (change.type === 'remove') {
          deleteElement(change.id);
        }
      });
    },
    [onNodesChangeInternal, updateElement, selectElement, deleteElement, workspace.elements, currentView, elementsLocked]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      changes.forEach((change) => {
        if (change.type === 'remove') {
          const { deleteRelationship } = useWorkspaceStore.getState();
          deleteRelationship(change.id);
        }
      });
    },
    []
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (elementsLocked) return;
      if (connection.source && connection.target) {
        addRelationship(connection.source, connection.target, t('common.uses'));
      }
    },
    [addRelationship, t, elementsLocked]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    if (elementsLocked) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, [elementsLocked]);

  const onDrop = useCallback(
    (event: DragEvent) => {
      if (elementsLocked) return;
      event.preventDefault();

      const type = event.dataTransfer.getData('application/c4-type') as C4ElementType;

      if (!type) return;

      const reactFlowBounds = (event.target as HTMLElement)
        .closest('.react-flow')
        ?.getBoundingClientRect();

      if (!reactFlowBounds) return;

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top
      });

      let finalParentId: string | undefined = undefined;

      if (currentView) {
        // In Container view, auto-parent to Software System
        if (currentView.type === 'container' && type === 'container') {
          finalParentId = currentView.softwareSystemId || undefined;
        }
        // In Component view, auto-parent to Container (use absolute position since container is hidden)
        if (currentView.type === 'component' && type === 'component') {
          finalParentId = currentView.containerId || undefined;
        }
      }

      let adjustedPosition = position;
      if (finalParentId) {
        const parent = workspace.elements.find(e => e.id === finalParentId);
        if (parent) {
          // For visible parents (groups, systems), adjust position relative to parent
          // For hidden focus zone parents (in component view), use absolute position
          const parentIsVisible = currentView?.type === 'systemLandscape' ||
                                  (currentView?.type === 'container' && parent.type === 'softwareSystem');
          if (parentIsVisible) {
            adjustedPosition = {
              x: position.x - parent.position.x,
              y: position.y - parent.position.y
            };
          }
          // else: use absolute position for hidden parents
        }
      }

      addElement(type, adjustedPosition, finalParentId);
    },
    [addElement, reactFlowInstance, currentView, workspace.elements]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      (document.activeElement as HTMLElement)?.blur();
      selectRelationship(null);
      selectElement(node.id);
    },
    [selectElement, selectRelationship]
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      (document.activeElement as HTMLElement)?.blur();
      selectElement(null);
      selectRelationship(edge.id);
    },
    [selectRelationship, selectElement]
  );

  const onPaneClick = useCallback(() => {
    selectElement(null);
    selectRelationship(null);
  }, [selectElement, selectRelationship]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (elementsLocked || ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const { selectedElementId, selectedRelationshipId, deleteElement, deleteRelationship } = useWorkspaceStore.getState();

        if (selectedElementId) {
          deleteElement(selectedElementId);
        } else if (selectedRelationshipId) {
          deleteRelationship(selectedRelationshipId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [elementsLocked]);

  const nodeColor = (node: Node) => {
    const type = node.type as C4ElementType;
    return C4_COLORS[type]?.background || '#888';
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        panOnDrag={!elementsLocked}
        panOnScroll
        zoomOnScroll
        zoomOnPinch
        defaultEdgeOptions={{
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed }
        }}
      >
        <Controls
          onInteractiveChange={(isInteractive) => {
            useWorkspaceStore.setState({ elementsLocked: !isInteractive });
          }}
        />
        <MiniMap nodeColor={nodeColor} zoomable pannable />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
      </ReactFlow>
    </div>
  );
};

export const Canvas: React.FC = () => (
  <ReactFlowProvider>
    <CanvasInner />
  </ReactFlowProvider>
);
