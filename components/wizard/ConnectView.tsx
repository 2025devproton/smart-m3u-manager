'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { dispatcharrApi } from '@/lib/api';
import { DispatcharrM3UAccount } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Server, LogIn } from 'lucide-react';
import { toast } from 'sonner';

interface ConnectViewProps {
    defaultUser?: string;
    defaultPassword?: string;
}

export default function ConnectView({ defaultUser, defaultPassword }: ConnectViewProps) {
    const { setSelectedAccount, setStep, connection, setConnection } = useAppStore();

    // Local state for form
    const [url, setUrl] = useState(connection.url);
    const [username, setUsername] = useState(defaultUser || '');
    const [password, setPassword] = useState(defaultPassword || '');

    // Reset local state if connection URL changes in store (which happens in parent effect) 
    useEffect(() => {
        setUrl(connection.url);
    }, [connection.url]);

    // Update defaults if they arrive late
    useEffect(() => {
        if (defaultUser) setUsername(defaultUser);
        if (defaultPassword) setPassword(defaultPassword);
    }, [defaultUser, defaultPassword]);

    const [loading, setLoading] = useState(false);
    const [connected, setConnected] = useState(false);
    const [accounts, setAccounts] = useState<DispatcharrM3UAccount[]>([]);

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let token: string | undefined = undefined;
            let cleanUrl = url.replace(/\/$/, '');

            // 1. Try to login if credentials provided
            if (username && password) {
                try {
                    const auth = await dispatcharrApi.login(cleanUrl, username, password);
                    token = auth.access;
                    toast.success("Login successful");
                } catch (err) {
                    console.error(err);
                    throw new Error("Authentication failed");
                }
            }

            // 2. Fetch accounts to verify connection
            const list = await dispatcharrApi.getM3UAccounts(cleanUrl, token);

            // Save to store
            setConnection(cleanUrl, token);
            setAccounts(list);
            setConnected(true);
            toast.success(`Connected to Dispatcharr. Found ${list.length} accounts.`);

        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to connect to Dispatcharr");
            setConnected(false);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (account: DispatcharrM3UAccount) => {
        setSelectedAccount(account);
        setStep('analysis');
    };

    if (!connected) {
        return (
            <div className="max-w-md mx-auto">
                <form onSubmit={handleConnect}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Connect to Dispatcharr</CardTitle>
                            <CardDescription>Enter your server details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Server URL</Label>
                                <Input
                                    value={url}
                                    onChange={e => setUrl(e.target.value)}
                                    placeholder="http://localhost:9191"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Username (Optional)</Label>
                                    <Input
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Password (Optional)</Label>
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                                Connect
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Select M3U Account</h2>
                <Button variant="outline" size="sm" onClick={() => setConnected(false)}>Disconnect</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {accounts.map((account) => (
                    <Card
                        key={account.id}
                        className="cursor-pointer hover:border-primary transition-colors hover:bg-muted/50"
                        onClick={() => handleSelect(account)}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {account.name}
                            </CardTitle>
                            <Server className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{account.username || 'No Auth'}</div>
                            <p className="text-xs text-muted-foreground truncate">
                                {account.server_url || 'Local File'}
                            </p>
                        </CardContent>
                    </Card>
                ))}

                {accounts.length === 0 && (
                    <div className="col-span-full text-center p-8 border rounded-lg border-dashed">
                        <p className="text-muted-foreground">No M3U Accounts found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
