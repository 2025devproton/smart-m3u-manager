'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { parseM3U, groupStreams } from '@/lib/m3u';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AnalysisView() {
    const { selectedAccount, setStep, setRawStreams, setSmartChannels, connection } = useAppStore();
    const [status, setStatus] = useState('Initializing...');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!selectedAccount) {
            setStep('connect');
            return;
        }
        startAnalysis();
    }, [selectedAccount]);

    const startAnalysis = async () => {
        try {
            setStatus('Downloading M3U Playlist...');
            setProgress(10);

            // Determine URL
            let url = selectedAccount?.server_url;
            if (!url) throw new Error("No URL in account");

            const response = await axios.post('/api/download-m3u', { url });
            const content = response.data;

            setStatus('Parsing M3U Content...');
            setProgress(40);

            await new Promise(r => setTimeout(r, 100));

            const raw = parseM3U(content);
            console.log(`Parsed ${raw.length} raw streams`);
            setRawStreams(raw);

            setStatus('Grouping Channels (Intelligent Logic)...');
            setProgress(70);
            await new Promise(r => setTimeout(r, 500));

            const smart = groupStreams(raw);
            console.log(`Grouped into ${smart.length} smart channels`);
            setSmartChannels(smart);

            setProgress(100);
            setStatus('Done!');

            setTimeout(() => {
                setStep('review');
            }, 500);

        } catch (e: any) {
            console.error(e);
            toast.error('Analysis failed: ' + (e.message || 'Unknown error'));
            setStep('connect');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center py-20 space-y-8">
            <div className="relative">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                    {progress}%
                </div>
            </div>

            <div className="text-center space-y-2 max-w-md">
                <h3 className="text-xl font-semibold">{status}</h3>
                <p className="text-sm text-muted-foreground">
                    This may take a moment depending on the playlist size.
                </p>
            </div>

            <div className="w-full max-w-md h-2 bg-secondary rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
