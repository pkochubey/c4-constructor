import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Handle, Position, NodeProps } from 'reactflow';
import { C4Element, C4_COLORS } from '../../types';
import { useWorkspaceStore } from '../../store';

interface C4NodeData {
  element: C4Element;
}

const PersonIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ExternalWrapper: React.FC<{ isExternal?: boolean, children: React.ReactNode, borderColor: string }> = ({ isExternal, children, borderColor }) => {
  if (!isExternal) return <>{children}</>;
  return (
    <div style={{
      padding: '3px',
      border: `2px solid ${borderColor}`,
      borderRadius: '10px',
      backgroundColor: 'transparent'
    }}>
      {children}
    </div>
  );
};

export const PersonNode: React.FC<NodeProps<C4NodeData>> = memo(({ data, selected }) => {
  const { t } = useTranslation();
  const { element } = data;
  const colors = C4_COLORS.person;

  return (
    <div className="c4-node-container" style={{ cursor: 'pointer' }}>
      <ExternalWrapper isExternal={element.isExternal} borderColor={colors.border}>
        <div
          className="c4-node c4-person"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px 15px',
            borderRadius: '8px',
            border: selected ? '3px solid #ff0072' : `2px solid ${colors.border}`,
            background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.background}dd 100%)`,
            color: colors.text,
            width: '160px',
            textAlign: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
            transition: 'all 0.2s ease'
          }}
        >
          <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
          <PersonIcon color={colors.text} />
          <div style={{ fontWeight: 700, marginTop: '12px', fontSize: '15px' }}>
            {element.name}
          </div>
          <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            [{t('elements.person')}]
          </div>
          {element.description && (
            <div style={{ fontSize: '11px', marginTop: '10px', opacity: 0.9, lineHeight: '1.4' }}>
              {element.description}
            </div>
          )}
          <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
        </div>
      </ExternalWrapper>
    </div>
  );
});

export const SoftwareSystemNode: React.FC<NodeProps<C4NodeData>> = memo(({ data, selected }) => {
  const { t } = useTranslation();
  const { element } = data;
  const colors = C4_COLORS.softwareSystem;
  const setCurrentView = useWorkspaceStore(state => state.setCurrentView);
  const workspace = useWorkspaceStore(state => state.workspace);

  const onDoubleClick = () => {
    const view = workspace.views.find(v => v.softwareSystemId === element.id && v.type === 'container');
    if (view) {
      setCurrentView(view.id);
    }
  };

  return (
    <div onDoubleClick={onDoubleClick} style={{ cursor: 'pointer' }}>
      <ExternalWrapper isExternal={element.isExternal} borderColor={colors.border}>
        <div
          className="c4-node c4-software-system"
          style={{
            padding: '20px',
            borderRadius: '10px',
            border: selected ? '3px solid #ff0072' : `2px solid ${colors.border}`,
            background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.background}dd 100%)`,
            color: colors.text,
            width: '200px',
            textAlign: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
            transition: 'all 0.2s ease'
          }}
        >
          <Handle type="target" position={Position.Top} />
          <div style={{ fontWeight: 700, fontSize: '16px' }}>
            {element.name}
          </div>
          <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px', textTransform: 'uppercase' }}>
            [{t('elements.softwareSystem')}]
          </div>
          {element.description && (
            <div style={{ fontSize: '11px', marginTop: '12px', opacity: 0.9, lineHeight: '1.4' }}>
              {element.description}
            </div>
          )}
          <Handle type="source" position={Position.Bottom} />
        </div>
      </ExternalWrapper>
    </div>
  );
});

export const ContainerNode: React.FC<NodeProps<C4NodeData>> = memo(({ data, selected }) => {
  const { t } = useTranslation();
  const { element } = data;
  const colors = C4_COLORS.container;
  const setCurrentView = useWorkspaceStore(state => state.setCurrentView);
  const workspace = useWorkspaceStore(state => state.workspace);

  const onDoubleClick = () => {
    const view = workspace.views.find(v => v.containerId === element.id && v.type === 'component');
    if (view) {
      setCurrentView(view.id);
    }
  };

  return (
    <div onDoubleClick={onDoubleClick} style={{ cursor: 'pointer' }}>
      <ExternalWrapper isExternal={element.isExternal} borderColor={colors.border}>
        <div
          className="c4-node c4-container"
          style={{
            padding: '20px',
            borderRadius: '6px',
            border: selected ? '3px solid #ff0072' : `2px solid ${colors.border}`,
            background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.background}dd 100%)`,
            color: colors.text,
            width: '200px',
            textAlign: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
          }}
        >
          <Handle type="target" position={Position.Top} />
          <div style={{ fontWeight: 700, fontSize: '15px' }}>
            {element.name}
          </div>
          <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '4px' }}>
            [{t('elements.container')}{element.technology ? `: ${element.technology}` : ''}]
          </div>
          {element.description && (
            <div style={{ fontSize: '11px', marginTop: '12px', opacity: 0.9 }}>
              {element.description}
            </div>
          )}
          <Handle type="source" position={Position.Bottom} />
        </div>
      </ExternalWrapper>
    </div>
  );
});

export const ComponentNode: React.FC<NodeProps<C4NodeData>> = memo(({ data, selected }) => {
  const { t } = useTranslation();
  const { element } = data;
  const colors = C4_COLORS.component;

  return (
    <div
      className="c4-node c4-component"
      style={{
        padding: '18px',
        borderRadius: '4px',
        border: selected ? '3px solid #ff0072' : `2px solid ${colors.border}`,
        background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.background}ef 100%)`,
        color: colors.text,
        width: '180px',
        textAlign: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div style={{ fontWeight: 600, fontSize: '14px' }}>
        {element.name}
      </div>
      <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '4px' }}>
        [{t('elements.component')}{element.technology ? `: ${element.technology}` : ''}]
      </div>
      {element.description && (
        <div style={{ fontSize: '10px', marginTop: '8px', opacity: 0.9 }}>
          {element.description}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

export const DeploymentNodeComponent: React.FC<NodeProps<C4NodeData>> = memo(({ data, selected }) => {
  const { t } = useTranslation();
  const { element } = data;
  const colors = C4_COLORS.deploymentNode;
  const setCurrentView = useWorkspaceStore(state => state.setCurrentView);
  const workspace = useWorkspaceStore(state => state.workspace);

  const onDoubleClick = () => {
    const view = workspace.views.find(v => v.type === 'deployment' && (v.key === `deploy-${element.id}` || v.name.includes(element.name)));
    if (view) {
      setCurrentView(view.id);
    }
  };

  return (
    <div
      onDoubleClick={onDoubleClick}
      className="c4-node c4-deployment-node"
      style={{
        padding: '20px',
        borderRadius: '12px',
        cursor: 'pointer',
        border: selected ? '3px solid #ff0072' : `2px dashed ${colors.border}`,
        backgroundColor: '#f8f9fa',
        color: '#333',
        width: element.size?.width || 240,
        height: element.size?.height || 180,
        textAlign: 'center',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)'
      }}
    >
      <div style={{ fontWeight: 700, fontSize: '14px', borderBottom: '1px solid #ddd', paddingBottom: '8px', marginBottom: '10px' }}>
        {element.name}
      </div>
      <div style={{ fontSize: '11px', opacity: 0.7 }}>
        [{t('elements.deploymentNode')}{element.technology ? `: ${element.technology}` : ''}]
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

export const InfrastructureNode: React.FC<NodeProps<C4NodeData>> = memo(({ data, selected }) => {
  const { t } = useTranslation();
  const { element } = data;
  const colors = C4_COLORS.infrastructureNode;

  return (
    <div
      className="c4-node c4-infrastructure-node"
      style={{
        padding: '14px',
        borderRadius: '50%',
        border: selected ? '3px solid #ff0072' : `2px solid ${colors.border}`,
        backgroundColor: '#fff',
        color: '#333',
        width: '120px',
        height: '120px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div style={{ fontWeight: 700, fontSize: '12px' }}>
        {element.name}
      </div>
      <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px' }}>
        [{t('elements.infrastructureNode')}]
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

// Export node types map for React Flow
export const nodeTypes = {
  person: PersonNode,
  softwareSystem: SoftwareSystemNode,
  container: ContainerNode,
  component: ComponentNode,
  deploymentNode: DeploymentNodeComponent,
  infrastructureNode: InfrastructureNode
};
