'use client';

import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Check, Plug, BrainCircuit, ListChecks, UploadCloud } from 'lucide-react';

const steps = [
    { id: 'connect', label: 'Connect', icon: Plug },
    { id: 'analysis', label: 'Analyze', icon: BrainCircuit },
    { id: 'review', label: 'Review', icon: ListChecks },
    { id: 'sync', label: 'Sync', icon: UploadCloud },
];

export default function WizardSteps() {
    const { step } = useAppStore();

    // Calculate current index
    const currentIndex = steps.findIndex(s => s.id === step);
    const isSuccess = step === 'success';

    return (
        <div className="relative w-full max-w-4xl mx-auto px-4 isolate">
            {/* Background Line */}
            <div className="absolute top-5 left-[20px] right-[20px] h-0.5 bg-border -z-10" />

            {/* Progress Line */}
            <div
                className="absolute top-5 left-[20px] h-0.5 bg-primary -z-10 transition-all duration-500 ease-out"
                style={{
                    width: isSuccess
                        ? 'calc(100% - 40px)'
                        : `calc(${(currentIndex / (steps.length - 1)) * 100}% - ${(40 * (currentIndex / (steps.length - 1)))}px)`
                }}
            />

            <div className="flex justify-between relative z-0">
                {steps.map((s, i) => {
                    const isCompleted = isSuccess || i < currentIndex;
                    const isCurrent = s.id === step;
                    const Icon = s.icon;

                    return (
                        <div key={s.id} className="flex flex-col items-center gap-2">
                            {/* Icon Circle */}
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative z-10",
                                    "bg-background",
                                    isCompleted ? "bg-primary border-primary text-primary-foreground" :
                                        isCurrent ? "border-primary text-primary ring-4 ring-primary/10" : "border-muted text-muted-foreground"
                                )}
                            >
                                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                            </div>
                            <span
                                className={cn(
                                    "text-xs font-medium uppercase tracking-wider transition-colors duration-300",
                                    isCurrent ? "text-primary font-bold" : "text-muted-foreground"
                                )}
                            >
                                {s.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
