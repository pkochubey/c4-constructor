import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'model' | 'hierarchy' | 'dsl'>('model');

    if (!isOpen) return null;

    const tabs = [
        { id: 'model' as const, label: t('help.tabs.model') },
        { id: 'hierarchy' as const, label: t('help.tabs.hierarchy') },
        { id: 'dsl' as const, label: t('help.tabs.dsl') }
    ];

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(4px)'
        }} onClick={onClose}>
            <div style={{
                backgroundColor: '#fff',
                width: '850px',
                maxHeight: '85vh',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{
                    padding: '24px 32px',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'linear-gradient(to right, #f9fafb, #fff)'
                }}>
                    <div>
                        <h2 style={{ margin: 0, color: '#111827', fontSize: '24px', fontWeight: 800 }}>{t('help.title')}</h2>
                        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '14px' }}>{t('help.subtitle')}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', padding: '0 32px', borderBottom: '1px solid #eee', backgroundColor: '#f9fafb' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '16px 24px',
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: activeTab === tab.id ? '#ff0072' : '#6b7280',
                                borderBottom: activeTab === tab.id ? '3px solid #ff0072' : '3px solid transparent',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ padding: '32px', overflowY: 'auto', flex: 1, color: '#374151', lineHeight: 1.6 }}>

                    {activeTab === 'model' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                            <section>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#08427b' }}></div>
                                    <h3 style={{ margin: 0, fontSize: '18px' }}>{t('elements.person')}</h3>
                                </div>
                                <p style={{ fontSize: '14px', marginBottom: '24px' }}>{t('elements.personDesc')}</p>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: '#1168bd' }}></div>
                                    <h3 style={{ margin: 0, fontSize: '18px' }}>{t('elements.softwareSystem')}</h3>
                                </div>
                                <p style={{ fontSize: '14px', marginBottom: '24px' }}>{t('elements.softwareSystemDesc')}</p>
                            </section>

                            <section>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: '#438dd5' }}></div>
                                    <h3 style={{ margin: 0, fontSize: '18px' }}>{t('elements.container')}</h3>
                                </div>
                                <p style={{ fontSize: '14px', marginBottom: '24px' }}>{t('elements.containerDesc')}</p>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#85bbf0' }}></div>
                                    <h3 style={{ margin: 0, fontSize: '18px' }}>{t('elements.component')}</h3>
                                </div>
                                <p style={{ fontSize: '14px', marginBottom: '24px' }}>{t('elements.componentDesc')}</p>
                            </section>
                        </div>
                    )}

                    {activeTab === 'hierarchy' && (
                        <div>
                            <p>{t('help.rules.subtitle')}</p>

                            <div style={{ backgroundColor: '#f3f4f6', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
                                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
                                    <li style={{ marginBottom: '8px' }}>{t('help.rules.system')}</li>
                                    <li style={{ marginBottom: '8px' }}>{t('help.rules.container')}</li>
                                    <li style={{ marginBottom: '8px' }}>{t('help.rules.person')}</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {activeTab === 'dsl' && (
                        <div>
                            <h3>{t('help.dslInfo.title')}</h3>
                            <p>{t('help.dslInfo.subtitle')}</p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div style={{ border: '1px solid #e5e7eb', padding: '16px', borderRadius: '12px' }}>
                                    <h4 style={{ marginTop: 0, color: '#059669', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        {t('help.dslInfo.handle')}
                                    </h4>
                                    <ul style={{ fontSize: '13px', margin: 0, paddingLeft: '18px' }}>
                                        {(t('help.dslInfo.handleItems', { returnObjects: true }) as string[]).map((item: string, i: number) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div style={{ border: '1px solid #e5e7eb', padding: '16px', borderRadius: '12px' }}>
                                    <h4 style={{ marginTop: 0, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        {t('help.dslInfo.avoid')}
                                    </h4>
                                    <ul style={{ fontSize: '13px', margin: 0, paddingLeft: '18px' }}>
                                        {(t('help.dslInfo.avoidItems', { returnObjects: true }) as string[]).map((item: string, i: number) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div style={{ padding: '20px 32px', borderTop: '1px solid #eee', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        onClick={onClose}
                        variant="primary"
                        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        {t('common.gotIt')}
                    </Button>
                </div>
            </div>
        </div>
    );
};
