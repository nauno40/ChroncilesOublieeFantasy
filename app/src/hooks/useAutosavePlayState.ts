import { useEffect, useRef, useState } from 'react';
import { ApiService } from '../services/api';
import type { PlayState } from '../types/character';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Auto-sauvegarde du `playState` d'un personnage pour le mode session (mobile) : PATCH partiel
 * `{ playState }` (merge-patch) après un débounce, sans bouton « Enregistrer ». Le PATCH partiel
 * n'envoie pas la relation `campaign` → aucune résolution d'IRI → pas de 400 même quand le perso
 * est rattaché à la campagne du MJ (owner-scopée).
 *
 * `ready` doit passer à true seulement une fois le personnage chargé : la valeur initiale sert de
 * référence et n'est pas re-sauvegardée.
 */
export const useAutosavePlayState = (
  id: string | undefined,
  playState: PlayState | undefined,
  ready: boolean,
  delay = 1000,
): SaveStatus => {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || !id || !playState) return;
    const serialized = JSON.stringify(playState);
    // Première passe « prête » : on mémorise l'état chargé sans le re-sauvegarder.
    if (lastSaved.current === null) {
      lastSaved.current = serialized;
      return;
    }
    if (serialized === lastSaved.current) return;

    if (timer.current) clearTimeout(timer.current);
    // Tout le setState vit dans le callback (asynchrone) : pas de setState synchrone dans l'effet.
    timer.current = setTimeout(async () => {
      setStatus('saving');
      try {
        await ApiService.patch('characters', id, { playState });
        lastSaved.current = serialized;
        setStatus('saved');
      } catch {
        setStatus('error');
      }
    }, delay);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [id, playState, ready, delay]);

  return status;
};
