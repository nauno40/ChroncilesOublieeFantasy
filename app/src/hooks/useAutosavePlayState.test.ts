// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { ApiService } from '../services/api';
import { useAutosavePlayState } from './useAutosavePlayState';
import type { PlayState } from '../types/character';

vi.mock('../services/api', () => ({ ApiService: { patch: vi.fn() } }));

const ps = (hp: number): PlayState => ({
    hp: { current: hp }, mana: { current: 0 }, luck: { current: 0 }, recovery: { used: 0 },
    money: { pa: 0 }, equipment: [], rp: { ideal: '', flaw: '' }, languages: [],
    protection: { armor: { name: '', def: 0 }, shield: { name: '', def: 0 } }, weapons: [],
});

beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(ApiService.patch).mockReset();
});
afterEach(() => vi.useRealTimers());

describe('useAutosavePlayState', () => {
    it('reste idle et ne sauvegarde rien tant que "ready" est faux', () => {
        const { result } = renderHook(({ playState, ready }) => useAutosavePlayState('1', playState, ready), {
            initialProps: { playState: ps(10), ready: false },
        });
        vi.advanceTimersByTime(5000);
        expect(result.current).toBe('idle');
        expect(ApiService.patch).not.toHaveBeenCalled();
    });

    it('la première passe "prête" mémorise l’état chargé sans le sauvegarder', () => {
        const { result } = renderHook(({ playState, ready }) => useAutosavePlayState('1', playState, ready), {
            initialProps: { playState: ps(10), ready: true },
        });
        vi.advanceTimersByTime(5000);
        expect(result.current).toBe('idle');
        expect(ApiService.patch).not.toHaveBeenCalled();
    });

    it('un changement après le débounce déclenche un PATCH partiel avec le playState courant', async () => {
        vi.mocked(ApiService.patch).mockResolvedValue({});
        const { result, rerender } = renderHook(({ playState, ready }) => useAutosavePlayState('1', playState, ready, 1000), {
            initialProps: { playState: ps(10), ready: true },
        });

        rerender({ playState: ps(8), ready: true });
        expect(result.current).toBe('idle'); // pas encore écoulé

        await act(async () => { await vi.advanceTimersByTimeAsync(1000); });

        expect(ApiService.patch).toHaveBeenCalledTimes(1);
        expect(ApiService.patch).toHaveBeenCalledWith('characters', '1', { playState: ps(8) });
        expect(result.current).toBe('saved');
    });

    it('redébounce à chaque changement — seul le dernier état déclenche un PATCH', async () => {
        vi.mocked(ApiService.patch).mockResolvedValue({});
        const { rerender } = renderHook(({ playState, ready }) => useAutosavePlayState('1', playState, ready, 1000), {
            initialProps: { playState: ps(10), ready: true },
        });

        rerender({ playState: ps(9), ready: true });
        await act(async () => { await vi.advanceTimersByTimeAsync(500); }); // avant l'échéance
        rerender({ playState: ps(8), ready: true }); // relance le débounce

        await act(async () => { await vi.advanceTimersByTimeAsync(1000); });

        expect(ApiService.patch).toHaveBeenCalledOnce();
        expect(ApiService.patch).toHaveBeenCalledWith('characters', '1', { playState: ps(8) });
    });

    it('un échec de PATCH passe le statut à "error"', async () => {
        vi.mocked(ApiService.patch).mockRejectedValue(new Error('réseau HS'));
        const { result, rerender } = renderHook(({ playState, ready }) => useAutosavePlayState('1', playState, ready, 1000), {
            initialProps: { playState: ps(10), ready: true },
        });

        rerender({ playState: ps(7), ready: true });
        await act(async () => { await vi.advanceTimersByTimeAsync(1000); });

        expect(result.current).toBe('error');
    });

    it('ne sauvegarde pas si le nouvel état sérialise à l’identique de l’état déjà connu', async () => {
        const { rerender } = renderHook(({ playState, ready }) => useAutosavePlayState('1', playState, ready, 1000), {
            initialProps: { playState: ps(10), ready: true },
        });

        // Nouvel objet, mêmes valeurs : la comparaison est par sérialisation, pas par référence.
        rerender({ playState: ps(10), ready: true });
        await act(async () => { await vi.advanceTimersByTimeAsync(1000); });

        expect(ApiService.patch).not.toHaveBeenCalled();
    });
});
