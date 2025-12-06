import { Parser } from 'm3u8-parser';
import { M3UStreamRaw, SmartChannel, SmartStream } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const parseM3U = (content: string): M3UStreamRaw[] => {
    // Regex implementation is often more reliable for "IPTV M3U" (which is just a list of links with metadata)
    // vs "HLS M3U8" (which is segments of a video).
    return parseM3URegex(content);
};

const parseM3URegex = (content: string): M3UStreamRaw[] => {
    const lines = content.split(/\r?\n/);
    const streams: M3UStreamRaw[] = [];
    let currentItem: Partial<M3UStreamRaw> = {};

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (line.startsWith('#EXTINF:')) {
            // Parse attributes
            const info = line.substring(8);
            const commaIndex = info.lastIndexOf(',');
            const rawAttributes = info.substring(0, commaIndex);
            const title = info.substring(commaIndex + 1).trim();

            currentItem = {
                title,
                attributes: {},
            };

            // Extract key="value" attributes
            const attrRegex = /([a-zA-Z0-9-]+)="([^"]*)"/g;
            let match;
            while ((match = attrRegex.exec(rawAttributes)) !== null) {
                if (currentItem.attributes) {
                    currentItem.attributes[match[1]] = match[2];
                }
            }

            // Map common fields
            if (currentItem.attributes) {
                currentItem.tvgId = currentItem.attributes['tvg-id'];
                currentItem.tvgName = currentItem.attributes['tvg-name'];
                currentItem.groupTitle = currentItem.attributes['group-title'];
                currentItem.logo = currentItem.attributes['tvg-logo'];
            }
        } else if (line.startsWith('http') || line.startsWith('rtmp') || line.startsWith('udp')) {
            if (currentItem.title) {
                currentItem.url = line;
                streams.push(currentItem as M3UStreamRaw);
                currentItem = {};
            }
        }
    }
    return streams;
};

export const groupStreams = (streams: M3UStreamRaw[]): SmartChannel[] => {
    const channelsMap = new Map<string, SmartChannel>();

    streams.forEach((stream) => {
        // STRATEGY 1: TVG-ID
        let key = '';

        if (stream.tvgId && stream.tvgId.length > 1) {
            key = `tvgid:${stream.tvgId}`;
        } else {
            // STRATEGY 2: Fuzzy Name
            const normalized = normalizeName(stream.title);
            key = `name:${normalized}`;
        }

        if (!channelsMap.has(key)) {
            // User Request: Use tvg-id as name if available and not empty
            const finalName = (stream.tvgId && stream.tvgId.trim().length > 0)
                ? stream.tvgId
                : simplifyName(stream.title, stream.tvgName);

            channelsMap.set(key, {
                id: uuidv4(),
                name: finalName,
                tvgId: stream.tvgId,
                logo: stream.logo,
                group: stream.groupTitle,
                streams: [],
                selected: true,
            });
        }

        const channel = channelsMap.get(key)!;

        // Add stream to channel
        channel.streams.push({
            id: uuidv4(),
            url: stream.url,
            name: stream.title,
            originalTitle: stream.title,
            resolution: detectResolution(stream.title)
        });

        if (!channel.logo && stream.logo) channel.logo = stream.logo;
        if (!channel.tvgId && stream.tvgId) channel.tvgId = stream.tvgId;
    });

    return Array.from(channelsMap.values());
};

const normalizeName = (name: string): string => {
    return name
        .toLowerCase()
        .replace(/\[.*?\]/g, '') // remove [FHD]
        .replace(/\(.*?\)/g, '') // remove (FHD)
        .replace(/fhd|hd|sd|4k|aaa|hevc|h265/g, '') // remove keywords
        .replace(/[^a-z0-9]/g, '') // remove special chars
        .trim();
};

const simplifyName = (title: string, tvgName?: string): string => {
    if (tvgName) return tvgName;
    return title
        .replace(/\[.*?\]/g, '')
        .replace(/\(.*?\)/g, '')
        .trim();
};

const detectResolution = (title: string): string | undefined => {
    const t = title.toLowerCase();
    if (t.includes('4k')) return '4K';
    if (t.includes('fhd') || t.includes('1080')) return '1080p';
    if (t.includes('hd') || t.includes('720')) return '720p';
    if (t.includes('sd')) return 'SD';
    return undefined;
};
