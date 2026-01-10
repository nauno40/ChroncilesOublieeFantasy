import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { RulesSidebar } from './RulesSidebar';
import { RulesHeader, RuleIntroduction } from './sections/RuleIntroduction';
import { RuleChapter1 } from './sections/RuleChapter1';
import { RuleChapter2 } from './sections/RuleChapter2';
import { RuleChapter3 } from './sections/RuleChapter3';
import { RuleChapter4 } from './sections/RuleChapter4';
import { RuleChapter5 } from './sections/RuleChapter5';
import { RuleChapter6 } from './sections/RuleChapter6';
import { RuleChapter7 } from './sections/RuleChapter7';
import { RuleChapter8 } from './sections/RuleChapter8';
import { RuleConversion } from './sections/RuleConversion';

export const Rules: React.FC = () => {
    const location = useLocation();

    // Handle smooth scrolling for anchor links
    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement> | null, id: string) => {
        if (e) e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Auto-scroll on hash change
    useEffect(() => {
        if (location.hash) {
            const id = location.hash.replace('#', '');
            setTimeout(() => {
                scrollToSection(null, id);
            }, 100);
        }
    }, [location.hash]);

    return (
        <div className="flex h-[calc(100vh-6rem)] overflow-hidden">
            <RulesSidebar scrollToSection={scrollToSection} />

            <main className="flex-1 h-full overflow-y-auto relative scroll-smooth p-4 md:p-8 custom-scrollbar">
                <div className="max-w-7xl mx-auto pb-32">
                    <RulesHeader />
                    <RuleIntroduction />
                    <RuleChapter1 />
                    <RuleChapter2 />
                    <RuleChapter3 />
                    <RuleChapter4 />
                    <RuleChapter5 scrollToSection={scrollToSection} />
                    <RuleChapter6 />
                    <RuleChapter7 />
                    <RuleChapter8 />
                    <RuleConversion />
                </div>
            </main>
        </div>
    );
};
