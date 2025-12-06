import axios from 'axios';
import { DispatcharrM3UAccount, DispatcharrChannelGroup, ChannelProfile } from '@/types';

// Helper to get configured client
const getClient = (url: string, token?: string) => {
    // Ensure no trailing slash for cleaner concatenation
    const baseURL = url.replace(/\/$/, '');
    const headers: any = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return axios.create({ baseURL, headers });
};

export const dispatcharrApi = {
    login: async (baseUrl: string, username: string, password: string) => {
        const client = getClient(baseUrl);
        // Try simple JWT login
        const res = await client.post('/api/accounts/token/', { username, password });
        return res.data; // { refresh, access }
    },

    getM3UAccounts: async (baseUrl: string, token?: string) => {
        const client = getClient(baseUrl, token);
        const response = await client.get<DispatcharrM3UAccount[]>('/api/m3u/accounts/');
        return response.data;
    },

    getChannelProfiles: async (baseUrl: string, token?: string) => {
        const client = getClient(baseUrl, token);
        const response = await client.get<ChannelProfile[]>('/api/channels/profiles/');
        return response.data;
    },

    createChannelProfile: async (baseUrl: string, token: string | undefined, name: string) => {
        const client = getClient(baseUrl, token);
        const response = await client.post<ChannelProfile>('/api/channels/profiles/', { name });
        return response.data;
    },

    createStream: async (baseUrl: string, token: string | undefined, url: string, name: string) => {
        const client = getClient(baseUrl, token);
        const response = await client.post('/api/channels/streams/', {
            name: name,
            url: url,
            is_custom: true
        });
        return response.data;
    },

    createChannel: async (baseUrl: string, token: string | undefined, name: string, streamIds: number[], profileId: number, tvgId?: string, logoUrl?: string) => {
        const client = getClient(baseUrl, token);
        let logo_id = null;
        if (logoUrl) {
            try {
                const logoRes = await client.post('/api/channels/logos/', { name, url: logoUrl });
                logo_id = logoRes.data.id;
            } catch (e) {
                console.warn("Failed to create logo", e);
            }
        }

        const payload: any = {
            name,
            // We omit channel_group_id as we are assigning to a profile subsequently.
            streams: streamIds,
        };
        if (tvgId) payload.tvg_id = tvgId;
        if (logo_id) payload.logo_id = logo_id;

        const response = await client.post('/api/channels/channels/', payload);
        const channelId = response.data.id;

        // Assign to Profile
        if (profileId && channelId) {
            try {
                await client.patch(`/api/channels/profiles/${profileId}/channels/${channelId}/`, { enabled: true });
            } catch (e) {
                console.warn("Failed to assign to profile", e);
            }
        }

        return response.data;
    }
};
