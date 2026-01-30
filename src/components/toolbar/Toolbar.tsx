import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkspaceStore } from '../../store';
import { DSLEditorModal, DSLImportModal, HelpModal } from '../modals';
import { Button } from '../ui';

export const Toolbar: React.FC = () => {
  const { t } = useTranslation();
  const { workspace, currentViewId, setCurrentView, clearWorkspace, loadWorkspace, renameView } = useWorkspaceStore();
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isRenamingView, setIsRenamingView] = useState(false);
  const currentView = workspace.views.find(v => v.id === currentViewId);
  const [tempViewName, setTempViewName] = useState('');

  const handleClear = () => {
    if (confirm(t('common.confirmClear'))) {
      clearWorkspace();
    }
  };

  const handleApplyDSL = (newWorkspace: Parameters<typeof loadWorkspace>[0]) => {
    loadWorkspace(newWorkspace);
  };

  const startRename = () => {
    setTempViewName(currentView?.name || '');
    setIsRenamingView(true);
  };

  const submitRename = () => {
    if (currentViewId && tempViewName.trim()) {
      renameView(currentViewId, tempViewName.trim());
    }
    setIsRenamingView(false);
  };

  return (
    <>
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-cyan-400 rounded flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 3h18v18H3V3zm16 16V5H5v14h14zM7 7h4v4H7V7zm6 0h4v4h-4V7zm-6 6h4v4H7v-4zm6 0h4v4h-4v-4z" />
            </svg>
          </div>
          <span className="text-white font-semibold text-base">
            C4 Constructor
          </span>
        </div>

        <div className="w-px h-6 bg-slate-700 mx-2" />

        {/* View Selector */}
        <div className="flex items-center gap-2">
          {currentViewId !== 'landscape' && (
            <button
              onClick={() => setCurrentView('landscape')}
              className="bg-slate-800 text-white p-1.5 rounded border border-slate-700 hover:bg-slate-700 transition-colors flex items-center gap-1.5 px-2.5 mr-1"
              title={t('toolbar.homeTitle')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span className="text-xs font-semibold">{t('common.home')}</span>
            </button>
          )}
          <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">{t('toolbar.view')}</span>
          
          {isRenamingView ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={tempViewName}
                onChange={(e) => setTempViewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitRename();
                  if (e.key === 'Escape') setIsRenamingView(false);
                }}
                className="bg-slate-800 text-white text-sm border border-cyan-500 rounded px-2 py-1 outline-none w-48"
              />
              <button onClick={submitRename} className="text-cyan-400 hover:text-white p-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </button>
              <button onClick={() => setIsRenamingView(false)} className="text-slate-500 hover:text-white p-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <select
                value={currentViewId || ''}
                onChange={(e) => setCurrentView(e.target.value)}
                className="bg-slate-800 text-white text-sm border border-slate-700 rounded px-2 py-1 outline-none hover:border-cyan-500 transition-colors"
              >
                {workspace.views.map(view => (
                  <option key={view.id} value={view.id}>
                    {view.type === 'systemLandscape' ? t('views.landscape') : view.name || view.key}
                  </option>
                ))}
              </select>
              <button 
                onClick={startRename}
                className="text-slate-500 hover:text-cyan-400 p-1 transition-colors"
                title="Rename View"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-2">


          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowHelpModal(true)}
          >
            <div className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              {t('common.help')}
            </div>
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={handleClear}
          >
            {t('toolbar.clearAll')}
          </Button>

          <div className="w-px h-6 bg-slate-700 mx-2" />

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowImportModal(true)}
          >
            {t('toolbar.importDsl')}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowEditorModal(true)}
          >
            {t('toolbar.previewDsl')}
          </Button>
        </div>
      </header>

      {/* DSL Editor Modal */}
      <DSLEditorModal
        isOpen={showEditorModal}
        onClose={() => setShowEditorModal(false)}
        onApply={handleApplyDSL}
      />

      {/* DSL Import Modal */}
      <DSLImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleApplyDSL}
      />

      {/* C4 Help Modal */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </>
  );
};
