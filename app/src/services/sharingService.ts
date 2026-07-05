import { ApiService } from './api';

export interface SharedSession {
    id: number;
    title: string;
    date: string | null;
    summary: string | null;
}

export interface SharedCampaign {
    id: number;
    name: string;
    gameMaster: string;
    sessions: SharedSession[];
}

export interface Membership {
    id: number;
    campaign: string;      // IRI
    player: { id: number; pseudo: string } | string;
    joinedAt: string;
}

export const SharingService = {
    joinCampaign(code: string): Promise<SharedCampaign> {
        return ApiService.post<SharedCampaign>('shared_campaigns/join', { code });
    },

    getSharedCampaigns(): Promise<SharedCampaign[]> {
        return ApiService.getAll<SharedCampaign>('shared_campaigns');
    },

    regenerateInvite(campaignId: number): Promise<{ inviteCode: string }> {
        return ApiService.post<{ inviteCode: string }>(`campaigns/${campaignId}/regenerate_invite`, {});
    },

    getMemberships(): Promise<Membership[]> {
        return ApiService.getAll<Membership>('campaign_memberships');
    },

    deleteMembership(id: number): Promise<void> {
        return ApiService.delete('campaign_memberships', id);
    },
};
