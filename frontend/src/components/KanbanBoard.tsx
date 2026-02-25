import React, { useState } from 'react';

export interface KanbanColumn {
    id: string;
    title: string;
    color?: string; // e.g. 'var(--color-primary)'
}

export interface KanbanCard {
    id: string;
    columnId: string;
    content: React.ReactNode;
}

interface KanbanBoardProps {
    columns: KanbanColumn[];
    cards: KanbanCard[];
    onCardMove: (cardId: string, targetColumnId: string) => void;
    isLoading?: boolean;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ columns, cards, onCardMove, isLoading }) => {
    const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, cardId: string) => {
        setDraggedCardId(cardId);
        e.dataTransfer.effectAllowed = 'move';
        // Need to set data to make drag work in Firefox
        e.dataTransfer.setData('text/plain', cardId);

        // Slightly delay hiding the original element so drag image is generated
        setTimeout(() => {
            const el = document.getElementById(`kanban-card-${cardId}`);
            if (el) el.style.opacity = '0.4';
        }, 0);
    };

    const handleDragEnd = (e: React.DragEvent, cardId: string) => {
        e.preventDefault(); // Using the variable to resolve lint warning
        setDraggedCardId(null);
        const el = document.getElementById(`kanban-card-${cardId}`);
        if (el) el.style.opacity = '1';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        const cardId = e.dataTransfer.getData('text/plain') || draggedCardId;
        if (cardId) {
            onCardMove(cardId, columnId);
        }
        setDraggedCardId(null);
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', height: '400px' }}>
                {columns.map(col => (
                    <div key={col.id} style={{ minWidth: '300px', width: '300px', background: 'var(--color-bg-card)', borderRadius: '0.75rem', padding: '1rem', border: '1px solid var(--color-border)', flexShrink: 0, opacity: 0.5 }}>
                        <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1rem' }}>
                            <div style={{ height: '20px', width: '60%', background: 'var(--color-border)', borderRadius: '4px' }}></div>
                        </div>
                        <div style={{ height: '100px', background: 'var(--color-border)', borderRadius: '8px', marginBottom: '1rem' }}></div>
                        <div style={{ height: '100px', background: 'var(--color-border)', borderRadius: '8px' }}></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            gap: '1rem',
            overflowX: 'auto',
            paddingBottom: '1rem',
            minHeight: '600px',
            alignItems: 'flex-start'
        }}>
            {columns.map(column => {
                const columnCards = cards.filter(c => c.columnId === column.id);

                return (
                    <div
                        key={column.id}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, column.id)}
                        style={{
                            minWidth: '320px',
                            width: '320px',
                            background: 'var(--color-bg-card)',
                            borderRadius: '0.75rem',
                            border: '1px solid var(--color-border)',
                            flexShrink: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            maxHeight: 'calc(100vh - 200px)',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                    >
                        {/* Column Header */}
                        <div style={{
                            padding: '1rem',
                            borderBottom: '1px solid var(--color-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            position: 'sticky',
                            top: 0,
                            background: 'var(--color-bg-card)',
                            borderTopLeftRadius: '0.75rem',
                            borderTopRightRadius: '0.75rem',
                            zIndex: 10
                        }}>
                            <h4 style={{
                                margin: 0,
                                fontSize: '0.875rem',
                                fontWeight: 700,
                                color: column.color || 'var(--color-text)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                {column.title}
                            </h4>
                            <span style={{
                                background: 'var(--color-bg)',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '999px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: 'var(--color-text-muted)'
                            }}>
                                {columnCards.length}
                            </span>
                        </div>

                        {/* Drop Zone / Card List */}
                        <div style={{
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                            overflowY: 'auto',
                            flex: 1,
                            minHeight: '150px' // ensure drop zone exists even if empty
                        }}>
                            {columnCards.map(card => (
                                <div
                                    key={card.id}
                                    id={`kanban-card-${card.id}`}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, card.id)}
                                    onDragEnd={(e) => handleDragEnd(e, card.id)}
                                    style={{
                                        background: 'var(--color-bg)',
                                        borderRadius: '0.5rem',
                                        border: '1px solid var(--color-border)',
                                        cursor: 'grab',
                                        transition: 'all 0.2s',
                                        boxShadow: draggedCardId === card.id ? '0 10px 15px -3px rgba(0, 0, 0, 0.3)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                                    }}
                                    className="hover-lift" // Custom class if you have one
                                >
                                    {card.content}
                                </div>
                            ))}
                            {columnCards.length === 0 && (
                                <div style={{
                                    height: '60px',
                                    border: '2px dashed var(--color-border)',
                                    borderRadius: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--color-text-muted)',
                                    fontSize: '0.8rem'
                                }}>
                                    Drop area
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
