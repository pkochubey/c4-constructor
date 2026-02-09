import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkspaceStore } from '../../store';
import { Input, Textarea, Select, Button } from '../ui';
import { sanitizeKey } from '../../utils/validation';

export const PropertiesPanel: React.FC = () => {
  const { t } = useTranslation();
  const {
    workspace,
    selectedElementId,
    selectedRelationshipId,
    updateElement,
    renameElement,
    updateRelationship,
    deleteElement,
    deleteRelationship,
    addRelationship,
    addView,
    setCurrentView,
    selectRelationship
  } = useWorkspaceStore();

  // Get fresh element from store to avoid stale closures
  const getSelectedElement = useCallback(() =>
    workspace.elements.find((e) => e.id === selectedElementId), [workspace.elements, selectedElementId]);

  const getSelectedRelationship = useCallback(() =>
    workspace.relationships.find((r) => r.id === selectedRelationshipId), [workspace.relationships, selectedRelationshipId]);

  const selectedElement = getSelectedElement();
  const selectedRelationship = getSelectedRelationship();

  // Local form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [technology, setTechnology] = useState('');
  const [parentId, setParentId] = useState('');
  const [isExternal, setIsExternal] = useState(false);

  // New relationship state
  const [isAddingRel, setIsAddingRel] = useState(false);
  const [newRelTargetId, setNewRelTargetId] = useState('');
  const [newRelDesc, setNewRelDesc] = useState(t('common.uses'));
  const [newRelDirection, setNewRelDirection] = useState<'outbound' | 'inbound'>('outbound');

  // Sync form state with selection
  useEffect(() => {
    if (selectedElement) {
      setName(selectedElement.name);
      setDescription(selectedElement.description);
      setTechnology(selectedElement.technology || '');
      setParentId(selectedElement.parentId || '');
      setIsExternal(!!selectedElement.isExternal);
      setIsAddingRel(false);
      setNewRelTargetId('');
      setNewRelDesc(t('common.uses'));
      setNewRelDirection('outbound');
    } else if (selectedRelationship) {
      setDescription(selectedRelationship.description);
      setTechnology(selectedRelationship.technology || '');
    }
  }, [selectedElementId, selectedRelationshipId, selectedElement, selectedRelationship, t]);

  // Get potential parent elements
  const getPotentialParents = () => {
    const element = getSelectedElement();
    if (!element) return [];

    return workspace.elements.filter((e) => {
      if (e.id === element.id) return false;
      // Everything can be in a group
      if (e.type === 'group') return true;
      // Containers can be in systems
      if (element.type === 'container' && e.type === 'softwareSystem') return true;
      // Components can be in containers
      if (element.type === 'component' && e.type === 'container') return true;
      // Systems/Persons/Groups can also be in systems if needed (C4 allows)
      if (['softwareSystem', 'person', 'group'].includes(element.type) && e.type === 'softwareSystem') return true;
      return false;
    });
  };

  const createViewForElement = () => {
    const element = getSelectedElement();
    if (!element) return;

    if (element.type === 'container') {
      const view = addView({
        key: `${sanitizeKey(element.name)}_Components`,
        type: 'component',
        name: t('views.components', { name: element.name }),
        description: t('views.componentsDesc', { name: element.name }),
        containerId: element.id
      });
      setCurrentView(view.id);
    }
  };

  const handleAddRelationship = () => {
    const element = getSelectedElement();
    if (element && newRelTargetId) {
      const sourceId = newRelDirection === 'outbound' ? element.id : newRelTargetId;
      const targetId = newRelDirection === 'outbound' ? newRelTargetId : element.id;
      addRelationship(sourceId, targetId, newRelDesc);
      setIsAddingRel(false);
      setNewRelTargetId('');
    }
  };

  if (!selectedElement && !selectedRelationship) {
    return (
      <aside className="w-[280px] bg-slate-50 border-l border-slate-200 p-4 flex flex-col h-full shadow-inner">
        <h3 className="text-sm font-bold text-slate-800 m-0 mb-4 uppercase tracking-wider">{t('properties.title')}</h3>
        <p className="text-xs text-slate-500 italic">
          {t('properties.noSelection')}
        </p>
      </aside>
    );
  }

  // Helper to find parent path for elements in dropdown
  const getElementLabel = (el: any) => {
    if (!el.parentId) return `${el.name} [${t(`elements.${el.type}`)}]`;
    const parent = workspace.elements.find(p => p.id === el.parentId);
    return `${parent?.name} > ${el.name} [${t(`elements.${el.type}`)}]`;
  };

  return (
    <aside className="w-[280px] bg-white border-l border-slate-200 p-4 flex flex-col h-full overflow-auto shadow-xl">
      <h3 className="text-sm font-bold text-cyan-600 m-0 mb-6 uppercase tracking-widest border-b pb-2">
        {selectedElement ? t(`elements.${selectedElement.type}`) : 'Relationship'}
      </h3>

      {selectedElement && (
        <div key={selectedElement.id} className="flex flex-col gap-5">
          <div>
            <Input
              label={t('properties.name')}
              value={name}
              onChange={(e) => {
                const newValue = e.target.value;
                setName(newValue);
                // Get fresh element to avoid stale closure issues
                const currentElement = getSelectedElement();
                if (currentElement) {
                  updateElement(currentElement.id, { name: newValue });
                }
              }}
              onBlur={() => {
                const currentElement = getSelectedElement();
                if (currentElement && name.trim()) {
                  renameElement(currentElement.id, name.trim());
                }
              }}
              placeholder={t('properties.placeholders.name')}
              fullWidth
            />
          </div>

          <div>
            <Textarea
              label={t('properties.description')}
              value={description}
              onChange={(e) => {
                const newValue = e.target.value;
                setDescription(newValue);
                const currentElement = getSelectedElement();
                if (currentElement) {
                  updateElement(currentElement.id, { description: newValue });
                }
              }}
              placeholder={t('properties.placeholders.description')}
              rows={3}
              fullWidth
            />
          </div>

          {!['component'].includes(selectedElement.type) && (
            <div className="flex items-center gap-3 p-2 bg-slate-50 rounded border border-slate-100">
              <input
                id="is-external"
                type="checkbox"
                className="w-4 h-4 text-cyan-500 border-slate-300 rounded focus:ring-cyan-500"
                checked={isExternal}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsExternal(checked);
                  const currentElement = getSelectedElement();
                  if (currentElement) {
                    updateElement(currentElement.id, { isExternal: checked });
                  }
                }}
              />
              <label htmlFor="is-external" className="text-sm font-medium text-slate-700 cursor-pointer">
                {t('properties.external')}
              </label>
            </div>
          )}

          {['container', 'component'].includes(selectedElement.type) && (
            <div>
              <Input
                label={t('properties.technology')}
                value={technology}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setTechnology(newValue);
                  const currentElement = getSelectedElement();
                  if (currentElement) {
                    updateElement(currentElement.id, { technology: newValue || undefined });
                  }
                }}
                placeholder={t('properties.placeholders.technology')}
                fullWidth
              />
            </div>
          )}

          <div>
            <Select
              label={t('properties.parent') || 'Parent'}
              value={parentId}
              onChange={(e) => {
                const val = e.target.value;
                setParentId(val);
                const currentElement = getSelectedElement();
                if (currentElement) {
                  updateElement(currentElement.id, { parentId: val || undefined });
                }
              }}
              options={[
                { value: '', label: 'None' },
                ...getPotentialParents().map((p) => ({ value: p.id, label: getElementLabel(p) })),
              ]}
              fullWidth
            />
          </div>

          {/* Relationships Section */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider m-0">
                {t('properties.relationships')}
              </h4>
              {!isAddingRel && (
                <button
                  onClick={() => setIsAddingRel(true)}
                  className="text-[10px] text-cyan-500 hover:text-cyan-700 font-bold uppercase"
                >
                  + {t('properties.addRelationship')}
                </button>
              )}
            </div>

            {isAddingRel ? (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 flex flex-col gap-3">
                {/* Direction selector */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                    {t('properties.direction')}
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewRelDirection('outbound')}
                      className={`flex-1 px-3 py-2 text-xs font-medium rounded border transition-colors ${
                        newRelDirection === 'outbound'
                          ? 'bg-cyan-500 text-white border-cyan-500'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {t('properties.outbound')} →
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewRelDirection('inbound')}
                      className={`flex-1 px-3 py-2 text-xs font-medium rounded border transition-colors ${
                        newRelDirection === 'inbound'
                          ? 'bg-cyan-500 text-white border-cyan-500'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      ← {t('properties.inbound')}
                    </button>
                  </div>
                </div>
                <Select
                  label={newRelDirection === 'outbound' ? t('properties.toElement') : t('properties.fromElement')}
                  value={newRelTargetId}
                  onChange={(e) => setNewRelTargetId(e.target.value)}
                  options={[
                    { value: '', label: t('properties.selectTarget') },
                    ...workspace.elements
                      .filter(e => e.id !== selectedElement.id)
                      .map(e => ({ value: e.id, label: getElementLabel(e) }))
                      .sort((a, b) => a.label.localeCompare(b.label))
                  ]}
                  fullWidth
                />
                <Input
                  label={t('properties.description')}
                  value={newRelDesc}
                  onChange={(e) => setNewRelDesc(e.target.value)}
                  fullWidth
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="flex-1" onClick={() => setIsAddingRel(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button size="sm" variant="primary" className="flex-1" onClick={handleAddRelationship} disabled={!newRelTargetId}>
                    {t('common.save')}
                  </Button>
                </div>
              </div>
            ) : null}

            {/* Existing Relationships List */}
            <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
              {workspace.relationships
                .filter(r => r.sourceId === selectedElement.id || r.targetId === selectedElement.id)
                .map(rel => {
                  const isOutbound = rel.sourceId === selectedElement.id;
                  const partnerId = isOutbound ? rel.targetId : rel.sourceId;
                  const partner = workspace.elements.find(e => e.id === partnerId);

                  return (
                    <div
                      key={rel.id}
                      onClick={() => selectRelationship(rel.id)}
                      className="group flex flex-col p-2 bg-white hover:bg-cyan-50 border border-slate-200 rounded cursor-pointer transition-colors relative"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1 rounded ${isOutbound ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {isOutbound ? t('properties.outShort') : t('properties.inShort')}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-700 truncate flex-1">
                          {partner?.name || 'Unknown'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRelationship(rel.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-500 italic mt-0.5 truncate pl-10">
                        {rel.description || t('common.uses')}
                      </div>
                    </div>
                  );
                })
              }
              {workspace.relationships.filter(r => r.sourceId === selectedElement.id || r.targetId === selectedElement.id).length === 0 && (
                <div className="text-[10px] text-slate-400 italic py-2 text-center">{t('properties.noRelationships')}</div>
              )}
            </div>
          </div>

          {selectedElement.type === 'container' && (
            <div className="pt-2 border-t border-slate-100">
              <Button
                variant="primary"
                onClick={createViewForElement}
                size="sm"
                fullWidth
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2"
              >
                {t('properties.createComponentView')}
              </Button>
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-slate-100">
            <Button
              variant="danger"
              onClick={() => {
                const element = getSelectedElement();
                if (element) deleteElement(element.id);
              }}
              size="sm"
              fullWidth
              className="opacity-70 hover:opacity-100 transition-opacity"
            >
              {t('common.delete')}
            </Button>
          </div>
        </div>
      )}

      {selectedRelationship && (
        <div className="flex flex-col gap-5">
          <div>
            <Input
              label={t('properties.description')}
              value={description}
              onChange={(e) => {
                const newValue = e.target.value;
                setDescription(newValue);
                const currentRelationship = getSelectedRelationship();
                if (currentRelationship) {
                  updateRelationship(currentRelationship.id, { description: newValue });
                }
              }}
              placeholder="e.g., Uses, Sends data to"
              fullWidth
            />
          </div>

          <div>
            <Input
              label={t('properties.technology')}
              value={technology}
              onChange={(e) => {
                const newValue = e.target.value;
                setTechnology(newValue);
                const currentRelationship = getSelectedRelationship();
                if (currentRelationship) {
                  updateRelationship(currentRelationship.id, { technology: newValue || undefined });
                }
              }}
              placeholder="e.g., HTTPS, AMQP"
              fullWidth
            />
          </div>

          <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div className="font-bold mb-1 text-slate-400 uppercase tracking-tighter">Connection</div>
            <div className="flex items-center gap-2">
              <span className="truncate max-w-[80px] text-slate-700">{workspace.elements.find((e) => e.id === selectedRelationship.sourceId)?.name}</span>
              <span className="text-cyan-400">➔</span>
              <span className="truncate max-w-[80px] text-slate-700">{workspace.elements.find((e) => e.id === selectedRelationship.targetId)?.name}</span>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-100">
            <Button
              variant="danger"
              onClick={() => deleteRelationship(selectedRelationship.id)}
              size="sm"
              fullWidth
            >
              {t('common.delete')}
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
};
