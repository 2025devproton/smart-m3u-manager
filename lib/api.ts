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

    getLogos: async (baseUrl: string, token?: string) => {
        const client = getClient(baseUrl, token);
        const response = await client.get('/api/channels/logos/');
        return response.data;
    },

    getChannelGroups: async (baseUrl: string, token?: string) => {
        const client = getClient(baseUrl, token);
        const response = await client.get<DispatcharrChannelGroup[]>('/api/channels/groups/');
        return response.data;
    },

    createChannelGroup: async (baseUrl: string, token: string | undefined, name: string) => {
        const client = getClient(baseUrl, token);
        const response = await client.post<DispatcharrChannelGroup>('/api/channels/groups/', { name });
        return response.data;
    },

    createStream: async (baseUrl: string, token: string | undefined, url: string, name: string, tvgId?: string, channelGroupId?: number, logoUrl?: string) => {
        const client = getClient(baseUrl, token);
        const payload: any = {
            name: name,
            url: url
            // NOTE: Removed is_custom: true to prevent stream duplication
            // Streams without is_custom are linked to their original M3U account
        };
        if (tvgId) payload.tvg_id = tvgId;
        if (channelGroupId) payload.channel_group = channelGroupId;
        if (logoUrl) payload.logo_url = logoUrl;

        const response = await client.post('/api/channels/streams/', payload);
        return response.data;
    },

    createChannel: async (
        baseUrl: string,
        token: string | undefined,
        name: string,
        streamIds: number[],
        profileId: number,
        tvgId?: string,
        logoUrl?: string,
        channelGroupName?: string
    ) => {
        const client = getClient(baseUrl, token);

        // 1. Handle Channel Group (with Default Group fallback)
        let channel_group_id: number | null = null;
        const groupName = channelGroupName || 'Default Group';

        try {
            // Try to find existing group
            const groups = await dispatcharrApi.getChannelGroups(baseUrl, token);
            const existingGroup = groups.find(g => g.name === groupName);

            if (existingGroup) {
                channel_group_id = existingGroup.id;
                console.log(`Using existing channel group: ${groupName} (ID: ${channel_group_id})`);
            } else {
                // Create new group
                const newGroup = await dispatcharrApi.createChannelGroup(baseUrl, token, groupName);
                channel_group_id = newGroup.id;
                console.log(`Created new channel group: ${groupName} (ID: ${channel_group_id})`);
            }
        } catch (e) {
            console.error("Failed to create/find channel group", e);
        }

        // 2. Handle Logo (with deduplication)
        let logo_id: number | null = null;
        if (logoUrl) {
            try {
                // First, try to find existing logo with same URL
                const logos = await dispatcharrApi.getLogos(baseUrl, token);
                // Handle both paginated and non-paginated responses
                const logoList = logos.results || logos;
                const existingLogo = Array.isArray(logoList)
                    ? logoList.find((l: any) => l.url === logoUrl)
                    : null;

                if (existingLogo) {
                    logo_id = existingLogo.id;
                    console.log(`Using existing logo for ${name} (ID: ${logo_id})`);
                } else {
                    // Create new logo if it doesn't exist
                    const logoRes = await client.post('/api/channels/logos/', {
                        name: `${name} Logo`,
                        url: logoUrl
                    });
                    logo_id = logoRes.data.id;
                    console.log(`Created new logo for ${name} (ID: ${logo_id})`);
                }
            } catch (e) {
                console.error("Failed to create/find logo", e);
            }
        }

        // 3. Create Channel with all metadata
        const payload: any = {
            name,
            streams: streamIds,
        };

        // Always assign these if available
        if (tvgId) {
            payload.tvg_id = tvgId;
            console.log(`Setting tvg_id: ${tvgId}`);
        }
        if (logo_id !== null) {
            payload.logo_id = logo_id;
            console.log(`Assigning logo_id: ${logo_id}`);
        }
        if (channel_group_id !== null) {
            payload.channel_group_id = channel_group_id;
            console.log(`Assigning channel_group_id: ${channel_group_id}`);
        }

        console.log('Creating channel with payload:', JSON.stringify(payload, null, 2));
        const response = await client.post('/api/channels/channels/', payload);
        const channelId = response.data.id;
        console.log(`Channel created successfully (ID: ${channelId})`);

        // 4. Assign to Profile
        if (profileId && channelId) {
            try {
                await client.patch(`/api/channels/profiles/${profileId}/channels/${channelId}/`, { enabled: true });
                console.log(`Channel ${channelId} assigned to profile ${profileId}`);
            } catch (e) {
                console.error("Failed to assign to profile", e);
            }
        }

        return response.data;
    },

    matchEPG: async (
        baseUrl: string,
        token: string | undefined,
        channelIds: number[]
    ) => {
        const client = getClient(baseUrl, token);
        const response = await client.post('/api/channels/channels/match-epg/', {
            channel_ids: channelIds
        });
        return response.data;
    }
};
