import { ApiService } from './api';

export type ReportTargetType = 'homebrew_entry' | 'custom_creature';

export const ReportService = {
    // Le déclarant, le statut et l'horodatage sont posés côté serveur
    // (ContentReportStateProcessor) : le client ne fournit que la cible et le motif.
    report: (targetType: ReportTargetType, targetId: number, reason: string) =>
        ApiService.post('content_reports', { targetType, targetId, reason }),
};
