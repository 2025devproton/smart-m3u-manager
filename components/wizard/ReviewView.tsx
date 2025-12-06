import { useState, Fragment, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, ChevronDown, ChevronRight, PlayCircle, ArrowUpDown, Wand2, Pencil, Check, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SmartChannel } from '@/types';

type SortField = 'name' | 'group' | 'streams' | 'tvgId';
type SortDirection = 'asc' | 'desc';

export default function ReviewView() {
    const { smartChannels, toggleChannelSelection, setStep, rawStreams, normalizeChannels, updateSmartChannel, setChannelSelection } = useAppStore();
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [filterDuplicate, setFilterDuplicate] = useState(false);
    const [showSelectedOnly, setShowSelectedOnly] = useState(false);
    const [filterQuery, setFilterQuery] = useState('');

    // Sort State
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedRows(newSet);
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Edit Handlers
    const startEdit = (channel: SmartChannel) => {
        setEditingId(channel.id);
        setEditName(channel.name);
    };

    const saveEdit = () => {
        if (editingId && editName.trim()) {
            updateSmartChannel(editingId, { name: editName.trim() });
            setEditingId(null);
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') saveEdit();
        if (e.key === 'Escape') cancelEdit();
    };

    // Derived state
    const processedChannels = useMemo(() => {
        let result = smartChannels;

        if (filterDuplicate) {
            result = result.filter(c => c.streams.length > 1);
        }

        if (showSelectedOnly) {
            result = result.filter(c => c.selected);
        }

        if (filterQuery) {
            const query = filterQuery.toLowerCase();
            result = result.filter(c =>
                c.name?.toLowerCase().includes(query) ||
                c.group?.toLowerCase().includes(query) ||
                c.tvgId?.toLowerCase().includes(query)
            );
        }

        result.sort((a, b) => {
            let valA: any = a[sortField] || '';
            let valB: any = b[sortField] || '';

            if (sortField === 'streams') {
                valA = a.streams.length;
                valB = b.streams.length;
            }

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [smartChannels, filterDuplicate, sortField, sortDirection, filterQuery, showSelectedOnly]);

    const selectedCount = smartChannels.filter(c => c.selected).length;

    // Bulk Selection Logic
    const allFilteredSelected = processedChannels.length > 0 && processedChannels.every(c => c.selected);
    const handleSelectAll = () => {
        const ids = processedChannels.map(c => c.id);
        setChannelSelection(ids, !allFilteredSelected);
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                {/* Header Row: Title, Stats, Primary Action */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-muted/40 rounded-lg border">
                    <div className="space-y-1">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            Analysis Result
                            <Badge variant="outline" className="ml-2 font-normal">
                                {smartChannels.length} Channels
                            </Badge>
                        </h3>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center"><PlayCircle className="w-4 h-4 mr-1" /> {rawStreams.length} Raw Streams</span>
                            <span className="flex items-center text-green-600 font-medium">Reduced by {rawStreams.length - smartChannels.length}</span>
                        </div>
                    </div>
                    <Button onClick={() => setStep('sync')} disabled={selectedCount === 0} size="lg">
                        Sync {selectedCount} Channels
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>

                {/* Toolbar Row: Filters & Bulk Actions */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-2">
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            type="search"
                            placeholder="Search in name, group..."
                            className="w-full pl-9 bg-background"
                            value={filterQuery}
                            onChange={(e) => setFilterQuery(e.target.value)}
                        />
                    </div>


                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <Button variant="ghost" size="sm" onClick={normalizeChannels} title="Clean channel names">
                            <Wand2 className="w-4 h-4 mr-2" />
                            Normalize
                        </Button>

                        <div className="w-px h-6 bg-border mx-2" />

                        <div className="flex items-center space-x-2">
                            <Switch id="sel-filter" checked={showSelectedOnly} onCheckedChange={setShowSelectedOnly} />
                            <Label htmlFor="sel-filter" className="whitespace-nowrap cursor-pointer">Selected Only</Label>
                        </div>
                        <div className="w-px h-6 bg-border mx-2" />
                        <div className="flex items-center space-x-2">
                            <Switch id="dup-filter" checked={filterDuplicate} onCheckedChange={setFilterDuplicate} />
                            <Label htmlFor="dup-filter" className="whitespace-nowrap cursor-pointer">Duplicates Only</Label>
                        </div>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Channel List</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[600px] rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px] p-4 text-center">
                                        <Checkbox
                                            checked={allFilteredSelected}
                                            onCheckedChange={(checked) => setChannelSelection(processedChannels.map(c => c.id), !!checked)}
                                            aria-label="Select all"
                                        />
                                    </TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                    <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort('name')}>
                                        Channel Name <ArrowUpDown className="w-3 h-3 inline ml-1" />
                                    </TableHead>
                                    <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort('group')}>
                                        Group <ArrowUpDown className="w-3 h-3 inline ml-1" />
                                    </TableHead>
                                    <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort('streams')}>
                                        Streams <ArrowUpDown className="w-3 h-3 inline ml-1" />
                                    </TableHead>
                                    <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort('tvgId')}>
                                        TVG ID <ArrowUpDown className="w-3 h-3 inline ml-1" />
                                    </TableHead>
                                    <TableHead className="text-right w-[100px]">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {processedChannels.map((channel) => (
                                    <Fragment key={channel.id}>
                                        <TableRow className={cn("hover:bg-muted/50", !channel.selected && "opacity-50")}>
                                            <TableCell className="p-4 text-center">
                                                <Checkbox
                                                    checked={channel.selected}
                                                    onCheckedChange={() => toggleChannelSelection(channel.id)}
                                                    aria-label={`Select ${channel.name}`}
                                                />
                                            </TableCell>
                                            <TableCell onClick={() => toggleExpand(channel.id)} className="cursor-pointer">
                                                {expandedRows.has(channel.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                            </TableCell>
                                            <TableCell className="font-medium min-w-[200px]">
                                                {editingId === channel.id ? (
                                                    <Input
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        onKeyDown={handleKeyDown}
                                                        className="h-8"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <div className="flex items-center">
                                                        {channel.logo && <img src={channel.logo} alt="icon" className="w-6 h-6 inline-block mr-2 object-contain" />}
                                                        <span onDoubleClick={() => startEdit(channel)} className="cursor-pointer hover:underline decoration-dashed underline-offset-4">
                                                            {channel.name}
                                                        </span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>{channel.group || 'Uncategorized'}</TableCell>
                                            <TableCell>
                                                <Badge variant={channel.streams.length > 1 ? "default" : "secondary"} className="text-xs">
                                                    {channel.streams.length} Source{channel.streams.length !== 1 && 's'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground font-mono">
                                                {channel.tvgId || '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {editingId === channel.id ? (
                                                    <div className="flex justify-end gap-1">
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={saveEdit}>
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={cancelEdit}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => startEdit(channel)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>

                                        {/* Expanded Detail Row */}
                                        {expandedRows.has(channel.id) && (
                                            <TableRow className="bg-muted/30">
                                                <TableCell colSpan={7} className="p-4">
                                                    <div className="pl-12 space-y-2">
                                                        <p className="text-xs font-semibold uppercase text-muted-foreground">Available Streams</p>
                                                        {channel.streams.map(stream => (
                                                            <div key={stream.id} className="flex items-center justify-between text-sm p-2 bg-background rounded border">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-mono text-xs bg-muted px-1 rounded">{stream.resolution || 'UNK'}</span>
                                                                    <span className="truncate max-w-[400px]" title={stream.url}>{stream.originalTitle}</span>
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {/* Could show ping/latency later */}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
