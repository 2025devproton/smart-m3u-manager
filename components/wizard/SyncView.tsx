'use client';

import { useAppStore } from '@/lib/store';
import { dispatcharrApi } from '@/lib/api';
import { ChannelProfile } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function SyncView() {
    const { smartChannels, setStep, setProcessing, connection, targetProfileId, setTargetProfileId } = useAppStore();
    const [profiles, setProfiles] = useState<ChannelProfile[]>([]);
    const [newProfileName, setNewProfileName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
    const [isMatchingEPG, setIsMatchingEPG] = useState(false);

    const selectedChannels = smartChannels.filter(c => c.selected);

    useEffect(() => {
        loadProfiles();
    }, []);

    const loadProfiles = async () => {
        try {
            const list = await dispatcharrApi.getChannelProfiles(connection.url, connection.token);
            setProfiles(list);
        } catch (e) {
            toast.error('Failed to load channel profiles');
        }
    };

    const handleCreateProfile = async () => {
        if (!newProfileName) return;
        try {
            const p = await dispatcharrApi.createChannelProfile(connection.url, connection.token, newProfileName);
            setProfiles([...profiles, p]);
            setTargetProfileId(p.id);
            setNewProfileName('');
            toast.success(`Profile "${p.name}" created`);
        } catch (e) {
            toast.error('Failed to create profile');
        }
    };

    const startSync = async () => {
        if (!targetProfileId) return toast.error("Please select a target profile");

        setIsCreating(true);
        setSyncProgress({ current: 0, total: selectedChannels.length });

        // Local array to track created channel IDs
        const channelIds: number[] = [];

        try {
            for (let i = 0; i < selectedChannels.length; i++) {
                const channel = selectedChannels[i];

                // 1. Create Streams
                const streamIds: number[] = [];
                for (const stream of channel.streams) {
                    try {
                        const s = await dispatcharrApi.createStream(connection.url, connection.token, stream.url, stream.name);
                        streamIds.push(s.id);
                    } catch (err) {
                        console.error("Stream creation failed", err);
                    }
                }

                // 2. Create Channel and assign to Profile
                if (streamIds.length > 0) {
                    try {
                        const channelData = await dispatcharrApi.createChannel(
                            connection.url,
                            connection.token,
                            channel.name,
                            streamIds,
                            targetProfileId,
                            channel.tvgId,
                            channel.logo,
                            channel.group // Pass the channel group from M3U
                        );
                        // Store channel ID for EPG matching
                        channelIds.push(channelData.id);
                    } catch (err) {
                        console.error("Channel creation failed", err);
                    }
                }

                setSyncProgress(prev => ({ ...prev, current: i + 1 }));
            }

            // Match channels with EPG data after all channels are created
            if (channelIds.length > 0) {
                setIsMatchingEPG(true);
                toast.info('Matching channels with EPG data...');
                try {
                    await dispatcharrApi.matchEPG(
                        connection.url,
                        connection.token,
                        channelIds
                    );
                    toast.success(`EPG matching initiated for ${channelIds.length} channels`);
                } catch (e) {
                    toast.warning('EPG matching failed, but channels were created successfully');
                    console.error('EPG matching error:', e);
                } finally {
                    setIsMatchingEPG(false);
                }
            }

            setStep('success');

        } catch (e) {
            toast.error("Sync failed partway through");
            console.error(e);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Synchronization (Profiles)</CardTitle>
                    <CardDescription>
                        You are about to sync {selectedChannels.length} channels to a specific Channel Profile.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Target Channel Profile</Label>
                        <Select value={targetProfileId?.toString()} onValueChange={(val) => setTargetProfileId(parseInt(val))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a Channel Profile" />
                            </SelectTrigger>
                            <SelectContent>
                                {profiles.map(p => (
                                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or create new</span>
                        </div>
                    </div>

                    <div className="flex gap-2 items-end">
                        <div className="flex-1 space-y-2">
                            <Label>New Profile Name</Label>
                            <Input
                                value={newProfileName}
                                onChange={e => setNewProfileName(e.target.value)}
                                placeholder="e.g. Living Room TV"
                            />
                        </div>
                        <Button variant="secondary" onClick={handleCreateProfile} disabled={!newProfileName}>
                            Create
                        </Button>
                    </div>

                    {isCreating && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Syncing channels...</span>
                                <span>{syncProgress.current} / {syncProgress.total}</span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all" style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }} />
                            </div>
                        </div>
                    )}

                    {isMatchingEPG && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Matching channels with EPG data...</span>
                            </div>
                        </div>
                    )}

                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="ghost" onClick={() => setStep('review')} disabled={isCreating}>Back</Button>
                    <Button onClick={startSync} disabled={!targetProfileId || isCreating}>
                        {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Start Sync
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
