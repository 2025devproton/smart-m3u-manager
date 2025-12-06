'use client';

import { useAppStore } from '@/lib/store';
import ConnectView from '@/components/wizard/ConnectView';
import AnalysisView from '@/components/wizard/AnalysisView';
import ReviewView from '@/components/wizard/ReviewView';
import SyncView from '@/components/wizard/SyncView';
import { Toaster } from 'sonner';
import WizardSteps from '@/components/wizard/WizardSteps';
import { useEffect } from 'react';

interface SmartManagerProps {
    defaultUrl?: string;
    defaultUser?: string;
    defaultPassword?: string;
}

export default function SmartManager({ defaultUrl, defaultUser, defaultPassword }: SmartManagerProps) {
    const step = useAppStore((state) => state.step);
    const setConnection = useAppStore((state) => state.setConnection);

    useEffect(() => {
        // If defaults are provided and we are in the initial state, set them.
        // We can also just set them if the user hasn't typed anything yet, but store persistence might interfere.
        // For now, let's just update the initial state if provided.
        // Actually, ConnectView uses the store directly.
        // We should probably pass these defaults to ConnectView OR update the store here.

        // Simplest: Update store if it's at default.
        // NOTE: This might cause a re-render or hydration mismatch if not careful, 
        // but inside useEffect it's safe (client-only).
        if (defaultUrl) {
            setConnection(defaultUrl, undefined);
            // We don't have a way to pre-fill username/password in the store "connection" object 
            // because the store currently only holds { url, token }.
            // Wait, check store.ts.
        }

    }, [defaultUrl, setConnection]);

    // PROBLEM: The store logic for "ConnectView" manages username/password as local state 
    // until login is successful? Let's check ConnectView.tsx.
    // If ConnectView manages it locally, I should pass these props down to ConnectView.

    return (
        <main className="min-h-screen bg-background p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between pb-6 border-b">
                    <div className="flex items-center gap-4">
                        <img src="/icon.png" alt="Logo" className="w-16 h-16 rounded-lg shadow-sm" />
                        <div>
                            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                                Smart M3U <span className="text-primary">Manager</span>
                            </h1>
                            <p className="leading-7 [&:not(:first-child)]:mt-2 text-muted-foreground">
                                Intelligent stream consolidation for Dispatcharr.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Steps */}
                <div className="py-4">
                    <WizardSteps />
                </div>

                {/* Wizard Content */}
                <div className="min-h-[400px]">
                    {step === 'connect' && <ConnectView defaultUser={defaultUser} defaultPassword={defaultPassword} />}
                    {step === 'analysis' && <AnalysisView />}
                    {step === 'review' && <ReviewView />}
                    {step === 'sync' && <SyncView />}
                    {step === 'success' && (
                        <div className="text-center py-20">
                            <h2 className="text-3xl font-bold text-green-500 mb-4">Success!</h2>
                            <p>Channels have been synchronized with Dispatcharr.</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-8 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                            >
                                Start Over
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <Toaster />
        </main>
    );
}
