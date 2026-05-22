import { useState, useEffect } from 'react';
import { useMarketplaceManagement } from '@/hooks/admin/useMarketplaceManagement';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Search, Download, MoreVertical, Flag, Trash2, CheckCircle, Clock, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  active:  'bg-emerald-100 text-emerald-700',
  sold:    'bg-slate-100 text-slate-600',
  pending: 'bg-amber-100 text-amber-700',
  flagged: 'bg-rose-100 text-rose-700',
};

const CATEGORIES = ['all', 'electronics', 'furniture', 'clothing', 'vehicles', 'food', 'services', 'other'];
const STATUSES    = ['all', 'active', 'sold', 'pending', 'flagged'];

export default function AdminMarketplace() {
  const { items, loading, fetchItems, updateItemStatus, deleteItem, flagItem, exportData } =
    useMarketplaceManagement();

  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('all');
  const [status,   setStatus]   = useState('all');
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [flagTarget,     setFlagTarget]     = useState<string | null>(null);
  const [flagReason,     setFlagReason]     = useState('');
  const [deleteTarget,   setDeleteTarget]   = useState<string | null>(null);

  useEffect(() => {
    fetchItems({ search, category, status });
  }, [search, category, status, fetchItems]);

  const handleFlag = async () => {
    if (!flagTarget || !flagReason.trim()) return;
    await flagItem(flagTarget, flagReason.trim());
    setFlagDialogOpen(false);
    setFlagTarget(null);
    setFlagReason('');
  };

  const handleDelete = async (id: string) => {
    setDeleteTarget(id);
    await deleteItem(id);
    setDeleteTarget(null);
  };

  const openFlagDialog = (id: string) => {
    setFlagTarget(id);
    setFlagDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Marketplace</h1>
          <p className="text-slate-500 text-sm mt-1">Review and manage all marketplace listings</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportData} className="gap-2">
          <Download className="h-4 w-4" />
          Export JSON
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search title or description…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(c => (
              <SelectItem key={c} value={c}>{c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map(s => (
              <SelectItem key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats strip */}
      <div className="flex gap-4 text-sm text-slate-500">
        <span><span className="font-semibold text-slate-800">{items.length}</span> listings</span>
        <span><span className="font-semibold text-emerald-700">{items.filter(i => i.status === 'active').length}</span> active</span>
        <span><span className="font-semibold text-rose-600">{items.filter(i => i.status === 'flagged').length}</span> flagged</span>
        <span><span className="font-semibold text-amber-600">{items.filter(i => i.status === 'pending').length}</span> pending</span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Item</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Listed</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-slate-400">
                  <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Loading listings…
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-slate-400">
                  <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  No listings match your filters
                </TableCell>
              </TableRow>
            ) : (
              items.map(item => (
                <TableRow key={item.id} className="hover:bg-slate-50">
                  <TableCell className="max-w-[200px]">
                    <p className="font-medium text-slate-900 truncate">{item.title}</p>
                    <p className="text-xs text-slate-400 truncate">{item.description}</p>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {item.profiles?.full_name ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm capitalize text-slate-600">{item.category}</TableCell>
                  <TableCell className="text-sm font-medium text-slate-800">
                    ₦{item.price.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${STATUS_COLORS[item.status] ?? ''} border-0 text-xs`}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-400">
                    {format(new Date(item.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {item.status !== 'active' && (
                          <DropdownMenuItem onClick={() => updateItemStatus(item.id, 'active')}>
                            <CheckCircle className="h-4 w-4 mr-2 text-emerald-600" />
                            Mark Active
                          </DropdownMenuItem>
                        )}
                        {item.status !== 'pending' && (
                          <DropdownMenuItem onClick={() => updateItemStatus(item.id, 'pending')}>
                            <Clock className="h-4 w-4 mr-2 text-amber-600" />
                            Mark Pending
                          </DropdownMenuItem>
                        )}
                        {item.status !== 'flagged' && (
                          <DropdownMenuItem onClick={() => openFlagDialog(item.id)}>
                            <Flag className="h-4 w-4 mr-2 text-rose-600" />
                            Flag Item
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-rose-600 focus:text-rose-600"
                          disabled={deleteTarget === item.id}
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {deleteTarget === item.id ? 'Deleting…' : 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Flag dialog */}
      <Dialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag Item for Review</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Describe why this item is being flagged…"
            value={flagReason}
            onChange={e => setFlagReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFlagDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleFlag}
              disabled={!flagReason.trim()}
            >
              Flag Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
