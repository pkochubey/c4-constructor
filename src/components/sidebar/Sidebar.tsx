import { useTranslation } from 'react-i18next';
import { C4ElementType, C4_COLORS } from '../../types';
import { DND_CONFIG, ELEMENT_TYPES } from '../../config';
import { useWorkspaceStore } from '../../store';

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const { workspace, currentViewId } = useWorkspaceStore();
  const currentView = workspace.views.find(v => v.id === currentViewId);

  const handleDragStart = (event: React.DragEvent, type: C4ElementType, isEnabled: boolean) => {
    if (!isEnabled || !event.dataTransfer) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData(DND_CONFIG.DATA_TYPE, type);
    event.dataTransfer.effectAllowed = 'move';
  };

  const isElementEnabled = (type: C4ElementType): boolean => {
    if (!currentView) return true;

    switch (currentView.type) {
      case 'systemLandscape':
      case 'systemContext':
        return ['person', 'softwareSystem'].includes(type);
      case 'container':
        return ['container'].includes(type);
      case 'component':
        return ['component'].includes(type);
      default:
        return true;
    }
  };

  return (
    <aside className="w-[220px] bg-gray-50 border-r border-gray-200 flex flex-col h-full overflow-auto py-4 px-4">
      <h3 className="text-sm font-semibold text-gray-700 m-0 mb-2">
        {t('sidebar.title')}
      </h3>
      <div className="flex flex-col gap-2">
        {ELEMENT_TYPES.map((type) => {
          const enabled = isElementEnabled(type as C4ElementType);
          const colors = C4_COLORS[type as C4ElementType];

          return (
            <div
              key={type}
              draggable={enabled}
              onDragStart={(e) => handleDragStart(e, type as C4ElementType, enabled)}
              className={`px-3 py-3 rounded-lg text-sm font-medium text-center transition-all duration-150 select-none 
                ${enabled
                  ? 'cursor-grab hover:scale-[1.02] hover:shadow-md active:cursor-grabbing'
                  : 'opacity-25 cursor-not-allowed grayscale'
                }`}
              style={{
                backgroundColor: colors.background,
                color: colors.text,
                border: `2px solid ${enabled ? colors.border : '#ccc'}`,
              }}
              title={enabled ? '' : t('sidebar.notAllowed', { type: currentView?.type })}
            >
              {t(`elements.${type}`)}
            </div>
          );
        })}
      </div>

      <div className="mt-auto pt-4 border-t border-gray-200">
        <p className="text-[11px] text-gray-400 leading-relaxed italic">
          {currentView?.type === 'systemLandscape'
            ? t('sidebar.tipLandscape')
            : t('sidebar.tipDrilldown')}
        </p>
      </div>
    </aside>
  );
};
