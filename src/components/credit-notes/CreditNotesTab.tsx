import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Search,
  Eye,
  FileCheck,
  Calendar,
  Euro,
  User,
  Trash2,
  Edit,
  Plus,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { useCreditNotes, useDeleteCreditNote, useUpdateCreditNoteStatus, CreditNote } from '@/hooks/useCreditNotes';
import { CreditNoteEditor } from './CreditNoteEditor';
import { CreditNoteViewer } from './CreditNoteViewer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export function CreditNotesTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [editorOpen, setEditorOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [editingCreditNoteId, setEditingCreditNoteId] = useState<string | undefined>(undefined);
  const [viewingCreditNoteId, setViewingCreditNoteId] = useState<string | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [creditNoteToDelete, setCreditNoteToDelete] = useState<string | null>(null);
  
  const itemsPerPage = 10;
  
  const { data: creditNotes = [], isLoading } = useCreditNotes();
  const deleteCreditNote = useDeleteCreditNote();
  const updateStatus = useUpdateCreditNoteStatus();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Edit className="h-3 w-3 mr-1" />Brouillon</Badge>;
      case 'validated':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Validée</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />Annulée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredCreditNotes = useMemo(() => {
    let filtered = creditNotes;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(cn => cn.status === statusFilter);
    }
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(cn => 
        cn.credit_note_number.toLowerCase().includes(search) ||
        cn.reason.toLowerCase().includes(search) ||
        cn.customers?.name?.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  }, [creditNotes, statusFilter, searchTerm]);

  const paginatedCreditNotes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCreditNotes.slice(start, start + itemsPerPage);
  }, [filteredCreditNotes, currentPage]);

  const totalPages = Math.ceil(filteredCreditNotes.length / itemsPerPage);

  const stats = useMemo(() => {
    const total = creditNotes.reduce((sum, cn) => cn.status !== 'cancelled' ? sum + cn.total : sum, 0);
    const draft = creditNotes.filter(cn => cn.status === 'draft').length;
    const validated = creditNotes.filter(cn => cn.status === 'validated').length;
    return { total, draft, validated, count: creditNotes.length };
  }, [creditNotes]);

  const handleEdit = (creditNote: CreditNote) => {
    if (creditNote.status !== 'draft') {
      toast.error('Seules les notes de crédit en brouillon peuvent être modifiées');
      return;
    }
    setEditingCreditNoteId(creditNote.id);
    setEditorOpen(true);
  };

  const handleView = (creditNote: CreditNote) => {
    setViewingCreditNoteId(creditNote.id);
    setViewerOpen(true);
  };

  const handleDelete = (id: string) => {
    const creditNote = creditNotes.find(cn => cn.id === id);
    if (creditNote?.status !== 'draft') {
      toast.error('Seules les notes de crédit en brouillon peuvent être supprimées');
      return;
    }
    setCreditNoteToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (creditNoteToDelete) {
      deleteCreditNote.mutate(creditNoteToDelete);
      setDeleteDialogOpen(false);
      setCreditNoteToDelete(null);
    }
  };

  const handleValidate = (creditNote: CreditNote) => {
    updateStatus.mutate({ id: creditNote.id, status: 'validated' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Notes</p>
              <p className="text-2xl font-bold">{stats.count}</p>
            </div>
            <FileCheck className="h-8 w-8 opacity-50" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Brouillons</p>
              <p className="text-2xl font-bold">{stats.draft}</p>
            </div>
            <Clock className="h-8 w-8 opacity-50" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Validées</p>
              <p className="text-2xl font-bold">{stats.validated}</p>
            </div>
            <CheckCircle className="h-8 w-8 opacity-50" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Montant Total</p>
              <p className="text-2xl font-bold">{stats.total.toFixed(2)}€</p>
            </div>
            <Euro className="h-8 w-8 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Filtres et Actions */}
      <Card className="p-4 bg-white">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex gap-2 flex-1">
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="validated">Validée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro, raison, client..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-10"
              />
            </div>
          </div>
          
          <Button onClick={() => { setEditingCreditNoteId(undefined); setEditorOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle Note
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="bg-white">
        <div className="overflow-hidden">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Raison</TableHead>
                  <TableHead className="text-right">HT</TableHead>
                  <TableHead className="text-right">TTC</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCreditNotes.map((creditNote) => (
                  <TableRow key={creditNote.id}>
                    <TableCell className="font-mono font-semibold">
                      {creditNote.credit_note_number}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(creditNote.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(creditNote.created_at), 'dd/MM/yyyy', { locale: fr })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {creditNote.customers ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{creditNote.customers.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {creditNote.reason}
                    </TableCell>
                    <TableCell className="text-right">
                      {creditNote.subtotal.toFixed(2)}€
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {creditNote.total.toFixed(2)}€
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleView(creditNote)}
                          className="h-8"
                          title="Voir"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {creditNote.status === 'draft' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleValidate(creditNote)}
                              className="h-8 text-green-600 hover:text-green-700"
                              title="Valider"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEdit(creditNote)}
                              className="h-8 text-blue-600 hover:text-blue-700"
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDelete(creditNote.id)}
                              className="h-8 text-red-600 hover:text-red-700"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedCreditNotes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucune note de crédit trouvée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  if (totalPages <= 7) return true;
                  if (page === 1 || page === totalPages) return true;
                  if (Math.abs(page - currentPage) <= 1) return true;
                  return false;
                })
                .map((page, idx, arr) => {
                  const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                  return (
                    <PaginationItem key={page}>
                      {showEllipsis && <span className="px-2">...</span>}
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={page === currentPage}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          <div className="text-sm text-muted-foreground">
            Page {currentPage} sur {totalPages} ({filteredCreditNotes.length} notes)
          </div>
        </div>
      )}

      {/* Dialogs */}
      <CreditNoteEditor
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setEditingCreditNoteId(undefined);
        }}
        creditNoteId={editingCreditNoteId}
      />

      <CreditNoteViewer
        open={viewerOpen}
        onOpenChange={(open) => {
          setViewerOpen(open);
          if (!open) setViewingCreditNoteId(undefined);
        }}
        creditNoteId={viewingCreditNoteId}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette note de crédit ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La note de crédit sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
