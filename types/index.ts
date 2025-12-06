export interface DispatcharrM3UAccount {
    id: number;
    name: string;
    server_url?: string;
    username?: string;
    password?: string;
}

export interface DispatcharrChannelGroup {
    id: number;
    name: string;
}

export interface ChannelProfile {
    id: number;
    name: string;
    channels?: string;
}

export interface M3UStreamRaw {
    url: string;
    title: string;
    tvgId?: string;
    tvgName?: string;
    groupTitle?: string;
    logo?: string;
    attributes?: Record<string, string>;
}

export interface SmartChannel {
    id: string; // Internal UUID
    name: string;
    tvgId?: string;
    logo?: string;
    group?: string;
    streams: SmartStream[];
    selected: boolean; // For UI selection
}

export interface SmartStream {
    id: string; // Internal UUID
    url: string;
    name: string; // e.g. "FHD", "Backup"
    resolution?: string; // e.g. "1080p"
    originalTitle: string;
}
