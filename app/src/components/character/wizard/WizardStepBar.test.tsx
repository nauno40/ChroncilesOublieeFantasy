// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { WizardStepBar } from './WizardStepBar';

afterEach(cleanup);

const LABELS = ['Bienvenue', 'Race', 'Profil', 'Voies'];

describe('WizardStepBar', () => {
    it('marque l\'étape courante (aria-current)', () => {
        render(<WizardStepBar labels={LABELS} current={2} maxUnlocked={2} onJump={vi.fn()} />);
        expect(screen.getByRole('button', { name: /Race/ }).getAttribute('aria-current')).toBe('step');
        expect(screen.getByRole('button', { name: /Bienvenue/ }).getAttribute('aria-current')).toBeNull();
    });

    it('désactive les étapes non débloquées', () => {
        render(<WizardStepBar labels={LABELS} current={2} maxUnlocked={2} onJump={vi.fn()} />);
        expect((screen.getByRole('button', { name: /Voies/ }) as HTMLButtonElement).disabled).toBe(true);
        expect((screen.getByRole('button', { name: /Profil/ }) as HTMLButtonElement).disabled).toBe(true);
    });

    it('permet de cliquer sur une étape déjà atteinte, pas sur une verrouillée', () => {
        const onJump = vi.fn();
        render(<WizardStepBar labels={LABELS} current={3} maxUnlocked={3} onJump={onJump} />);

        fireEvent.click(screen.getByRole('button', { name: /Bienvenue/ }));
        expect(onJump).toHaveBeenCalledWith(1);

        onJump.mockClear();
        fireEvent.click(screen.getByRole('button', { name: /Voies/ })); // verrouillée (maxUnlocked=3)
        expect(onJump).not.toHaveBeenCalled();
    });
});
