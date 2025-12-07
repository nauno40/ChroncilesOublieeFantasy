import type { Campaign } from '../types/campaign';

const STORAGE_KEY = 'co_campaigns';

export const getCampaigns = (): Campaign[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
};

export const saveCampaign = (campaign: Campaign): void => {
    const campaigns = getCampaigns();
    const index = campaigns.findIndex(c => c.id === campaign.id);
    if (index >= 0) {
        campaigns[index] = campaign;
    } else {
        campaigns.push(campaign);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
};

export const deleteCampaign = (id: string): void => {
    const campaigns = getCampaigns().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
};

export const createCampaign = (name: string, description: string): Campaign => {
    const campaign: Campaign = {
        id: crypto.randomUUID(),
        name,
        description,
        created_at: Date.now(),
        updated_at: Date.now(),
        characters: [],
        encounters: []
    };
    saveCampaign(campaign);
    return campaign;
};
