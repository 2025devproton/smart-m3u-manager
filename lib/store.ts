import { create } from 'zustand';
import { DispatcharrM3UAccount, SmartChannel, M3UStreamRaw } from '@/types';

interface AppState {
    step: 'connect' | 'analysis' | 'review' | 'sync' | 'success';
    connection: {
        url: string;
        token?: string;
    };
    selectedAccount: DispatcharrM3UAccount | null;
    rawStreams: M3UStreamRaw[];
    smartChannels: SmartChannel[];
    targetProfileId: number | null;
    processing: boolean;

    setStep: (step: AppState['step']) => void;
    setConnection: (url: string, token?: string) => void;
    setSelectedAccount: (account: DispatcharrM3UAccount | null) => void;
    setRawStreams: (streams: M3UStreamRaw[]) => void;
    setSmartChannels: (channels: SmartChannel[]) => void;
    updateSmartChannel: (channelId: string, updates: Partial<SmartChannel>) => void;
    toggleChannelSelection: (channelId: string) => void;
    normalizeChannels: () => void;
    setTargetProfileId: (id: number | null) => void;
    setProcessing: (processing: boolean) => void;
    setChannelSelection: (ids: string[], selected: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
    step: 'connect',
    connection: { url: 'http://localhost:9191' },
    selectedAccount: null,
    rawStreams: [],
    smartChannels: [],
    targetProfileId: null,
    processing: false,

    setStep: (step) => set({ step }),
    setConnection: (url, token) => set({ connection: { url, token } }),
    setSelectedAccount: (account) => set({ selectedAccount: account }),
    setRawStreams: (streams) => set({ rawStreams: streams }),
    setSmartChannels: (channels) => set({ smartChannels: channels }),

    updateSmartChannel: (channelId, updates) => set((state) => ({
        smartChannels: state.smartChannels.map((c) =>
            c.id === channelId ? { ...c, ...updates } : c
        )
    })),

    toggleChannelSelection: (channelId) => set((state) => ({
        smartChannels: state.smartChannels.map((c) =>
            c.id === channelId ? { ...c, selected: !c.selected } : c
        )
    })),

    normalizeChannels: () => set((state) => ({
        smartChannels: state.smartChannels.map((c) => {
            let newName = c.name;
            // Pattern 1: [Hex]{4} -->.*
            newName = newName.replace(/[0-9a-fA-F]{4}\s*-->.*$/, '');
            // Pattern 2: -->.*
            newName = newName.replace(/-->.*$/, '');

            return { ...c, name: newName.trim() };
        })
    })),

    setTargetProfileId: (id) => set({ targetProfileId: id }),
    setProcessing: (processing) => set({ processing }),

    setChannelSelection: (ids, selected) => set((state) => {
        const idSet = new Set(ids);
        return {
            smartChannels: state.smartChannels.map((c) =>
                idSet.has(c.id) ? { ...c, selected } : c
            )
        };
    }),
}));
