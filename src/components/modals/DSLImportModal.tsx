import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Alert, Textarea } from '../ui';
import { C4Workspace } from '../../types';
import { fileService } from '../../services';
import { parseDSL, logError, validateDSL, ValidationError } from '../../utils';

interface DSLImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (workspace: C4Workspace) => void;
}

export const DSLImportModal: React.FC<DSLImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const { t } = useTranslation();
  const [dslText, setDslText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setDslText('');
      setError(null);
    }
  }, [isOpen]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);

    try {
      const content = await fileService.readAsText(file);
      const workspace = parseAndValidate(content);
      onImport(workspace);
      onClose();
    } catch (err) {
      logError(err, 'Import DSL from file');
      setError(err instanceof Error ? err.message : 'Failed to import DSL');
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImportFromText = () => {
    if (!dslText.trim()) {
      setError('Please enter DSL code');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const workspace = parseAndValidate(dslText);
      onImport(workspace);
      onClose();
    } catch (err) {
      logError(err, 'Import DSL from text');
      setError(err instanceof Error ? err.message : 'Failed to parse DSL');
    } finally {
      setImporting(false);
    }
  };

  const parseAndValidate = (content: string): C4Workspace => {
    try {
      validateDSL(content);
      return parseDSL(content);
    } catch (err) {
      if (err instanceof ValidationError) {
        throw err;
      }
      throw new Error('Failed to parse DSL: ' + (err as Error).message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="medium">
      <ModalHeader
        title={t('modals.import.title')}
        onClose={onClose}
        subtitle={t('modals.import.subtitle')}
      />

      <ModalBody>
        {/* File upload section */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('modals.import.uploadLabel')}
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".dsl,.txt"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-3 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              cursor:pointer
              file:cursor-pointer"
          />
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500 font-medium">{t('modals.import.or')}</span>
          </div>
        </div>

        {/* Paste DSL section */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('modals.import.pasteLabel')}
          </label>
          <Textarea
            value={dslText}
            onChange={(e) => setDslText(e.target.value)}
            placeholder={`workspace "My System" {
    model {
        user = person "User"
        system = softwareSystem "My System"
        user -> system "Uses"
    }
}`}
            rows={10}
            fullWidth
            className="bg-slate-900 text-cyan-400 font-mono"
          />
        </div>

        {error && (
          <div className="mt-4">
            <Alert variant="error">{error}</Alert>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="primary"
          onClick={handleImportFromText}
          disabled={importing || !dslText.trim()}
          leftIcon="📥"
        >
          {importing ? t('modals.import.importing') : t('modals.import.importBtn')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
