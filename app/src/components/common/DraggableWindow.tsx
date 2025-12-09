import React, { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { GripVertical, X } from 'lucide-react';

interface DraggableWindowProps {
    id: string; // Key for localStorage persistence
    title: string;
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    defaultPosition?: { x: number; y: number };
    defaultSize?: { width: number | string; height: number | string };
    minWidth?: number | string;
    minHeight?: number | string;
    headerContent?: React.ReactNode; // Optional extra header content
}

export const DraggableWindow: React.FC<DraggableWindowProps> = ({
    id,
    title,
    isOpen,
    onClose,
    children,
    defaultPosition = { x: 100, y: 100 },
    defaultSize = { width: 320, height: 400 },
    minWidth = 200,
    minHeight = 150,
    headerContent
}) => {
    const [state, setState] = useState({
        x: defaultPosition.x,
        y: defaultPosition.y,
        width: defaultSize.width,
        height: defaultSize.height,
    });

    // Load from storage on mount
    useEffect(() => {
        const stored = localStorage.getItem(`window_state_${id}`);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setState(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error("Failed to parse window state", e);
            }
        }
    }, [id]);

    // Save to storage on change
    const onDragStop = (_e: any, d: any) => {
        const newState = { ...state, x: d.x, y: d.y };
        setState(newState);
        localStorage.setItem(`window_state_${id}`, JSON.stringify(newState));
    };

    const onResizeStop = (_e: any, _direction: any, ref: any, _delta: any, position: any) => {
        const newState = {
            width: ref.style.width,
            height: ref.style.height,
            ...position
        };
        setState(newState);
        localStorage.setItem(`window_state_${id}`, JSON.stringify(newState));
    };

    if (!isOpen) return null;

    return (
        <Rnd
            size={{ width: state.width, height: state.height }}
            position={{ x: state.x, y: state.y }}
            onDragStop={onDragStop}
            onResizeStop={onResizeStop}
            minWidth={minWidth}
            minHeight={minHeight}
            dragHandleClassName="window-drag-handle"
            bounds="window"
            className="z-50"
            style={{ position: 'fixed', zIndex: 1000 }} // Force high z-index
        >
            <div className="flex flex-col w-full h-full glass-panel rounded-xl shadow-2xl border-primary-500/20 overflow-hidden bg-stone-950/80 backdrop-blur-md">
                {/* Header */}
                <div className="window-drag-handle cursor-move flex items-center justify-between p-3 border-b border-white/10 bg-black/40 select-none">
                    <div className="flex items-center gap-2 text-stone-300">
                        <GripVertical size={16} className="text-stone-500" />
                        <span className="font-display font-bold text-sm tracking-wide">{title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {headerContent}
                        <button
                            onClick={onClose} // Prevent drag on click
                            className="p-1 hover:bg-white/10 rounded text-stone-500 hover:text-white transition-colors"
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden relative flex flex-col">
                    {children}
                </div>
            </div>
        </Rnd>
    );
};
