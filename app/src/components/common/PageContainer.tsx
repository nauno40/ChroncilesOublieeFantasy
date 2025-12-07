import React from 'react';
import clsx from 'clsx';

interface PageContainerProps {
    children: React.ReactNode;
    className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children, className }) => {
    return (
        <div className={clsx('max-w-6xl mx-auto space-y-6 pb-12', className)}>
            {children}
        </div>
    );
};
