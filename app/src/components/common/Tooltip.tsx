import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
    content: {
        name: string;
        description: string;
    };
    children: React.ReactNode;
    theme?: 'primary' | 'amber';
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, theme = 'primary' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = (e: React.MouseEvent) => {
        // Position near the cursor
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        setPosition({
            x: Math.max(16, Math.min(mouseX, window.innerWidth - 340)),
            y: mouseY + 20,
        });
        setIsVisible(true);
    };

    const handleMouseLeave = () => {
        setIsVisible(false);
    };

    const borderColor = theme === 'amber' ? 'border-amber-900/60' : 'border-primary-900/60';
    const headerColor = theme === 'amber' ? 'text-amber-500' : 'text-primary-400';
    const headerBorderColor = theme === 'amber' ? 'border-amber-500/10' : 'border-primary-500/10';

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="contents"
            >
                {children}
            </div>
            {isVisible &&
                createPortal(
                    <div
                        className={`fixed w-80 max-w-[calc(100vw-2rem)] bg-stone-950/95 border ${borderColor} p-4 rounded-lg shadow-2xl pointer-events-none backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200`}
                        style={{
                            left: position.x,
                            top: position.y,
                            zIndex: 99999,
                        }}
                    >
                        <h4 className={`font-bold ${headerColor} mb-1.5 font-display tracking-wide border-b ${headerBorderColor} pb-1.5`}>
                            {content.name}
                        </h4>
                        <p className="text-xs text-stone-300 leading-relaxed font-body">
                            {content.description}
                        </p>
                    </div>,
                    document.body
                )}
        </>
    );
};
