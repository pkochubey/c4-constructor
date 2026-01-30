import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Alert } from '../ui';
import { C4Workspace } from '../../types';
import { clipboardService, fileService } from '../../services';
import { generateDSL, parseDSL, logError } from '../../utils';
import { useWorkspaceStore } from '../../store';

interface DSLEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (workspace: C4Workspace) => void;
}

export const DSLEditorModal: React.FC<DSLEditorModalProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  const { t } = useTranslation();
  const { workspace, previousElementPositions } = useWorkspaceStore();
  const [dslText, setDslText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Initialize DSL text when modal opens
  useEffect(() => {
    if (isOpen) {
      setDslText(generateDSL(workspace));
      setError(null);
    }
  }, [isOpen, workspace]);

  const handleCopy = async () => {
    try {
      await clipboardService.copy(dslText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logError(err, 'Copy DSL');
      setError('Failed to copy to clipboard');
    }
  };

  const handleDownload = () => {
    const filename = fileService.generateDSLFilename(workspace.name);
    fileService.download(dslText, filename);
  };

  const handleApply = () => {
    if (!dslText.trim()) {
      setError('DSL cannot be empty');
      return;
    }

    try {
      const importedWorkspace = parseDSL(dslText);

      // Restore positions for existing elements
      const currentPositionMap = new Map<string, { x: number; y: number }>();
      workspace.elements.forEach((element) => {
        currentPositionMap.set(`${element.name}|${element.type}`, element.position);
      });

      importedWorkspace.elements = importedWorkspace.elements.map((element) => {
        const key = `${element.name}|${element.type}`;
        const savedPosition = previousElementPositions.get(key) || currentPositionMap.get(key);

        if (savedPosition) {
          return { ...element, position: savedPosition };
        }
        return element;
      });

      onApply(importedWorkspace);
      setError(null);
      onClose();
    } catch (err) {
      logError(err, 'Apply DSL');
      setError('Failed to parse DSL: ' + (err as Error).message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <ModalHeader
        title={t('modals.editor.title')}
        subtitle={t('modals.editor.subtitle')}
        onClose={onClose}
      />

      {error && (
        <div className="mx-6 mt-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <ModalBody scrollable={false} className="p-0 flex-1 min-h-[500px]">
        <textarea
          value={dslText}
          onChange={(e) => setDslText(e.target.value)}
          className="w-full h-full min-h-[500px] p-5 bg-slate-900 text-cyan-400 font-mono text-sm leading-relaxed resize-none focus:outline-none"
          spellCheck={false}
        />
      </ModalBody>

      <ModalFooter align="space-between">
        <div className="flex gap-3">
          <Button variant="primary" size="sm" onClick={handleCopy}>
            {copied ? '✓ ' : ''}{t('modals.editor.copy')}
          </Button>
          <Button variant="primary" onClick={handleDownload}>
            Download .dsl
          </Button>
        </div>
        <div className="flex gap-3">
          <Button variant="primary" size="sm" onClick={onClose}>
            {t('common.close')}
          </Button>
          <Button variant="success" size="sm" onClick={handleApply}>
            {t('modals.editor.apply')}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};
