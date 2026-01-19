import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Search,
  Plus,
  FileText,
  Calendar,
  User,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Edit,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCreditNotes, useDeleteCreditNote, useUpdateCreditNoteStatus } from '@/hooks/useCreditNotes';
import { CreditNoteEditor } from '@/components/credit-notes/CreditNoteEditor';
import { CreditNoteViewer } from '@/components/credit-notes/CreditNoteViewer';

export default function CreditNotes() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [editorOpen, setEditorOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedCreditNote, setSelectedCreditNote] = useState<string | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [creditNoteToDelete, setCreditNoteToDelete] = useState<string | null>(null);
  
  const itemsPerPage = 10;
  
  const { data: creditNotes = [], isLoading } = useCreditNotes();
  const deleteCreditNote = useDeleteCreditNote();
  const updateStatus = useUpdateCreditNoteStatus();

  const filteredCreditNotes = useMemo(() => {
    return creditNotes.filter((cn) => {
      const matchesSearch = 
        cn.credit_note_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cn.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cn.reason.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || cn.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [creditNotes, searchTerm, statusFilter]);

  const paginatedCreditNotes = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredCreditNotes.slice(start, start + itemsPerPage);
  }, [filteredCreditNotes, page]);

  const totalPages = Math.ceil(filteredCreditNotes.length / itemsPerPage);

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

  const handleView = (id: string) => {
    setSelectedCreditNote(id);
    setViewerOpen(true);
  };

  const handleEdit = (id: string) => {
    setSelectedCreditNote(id);
    setEditorOpen(true);
  };

  const handleDelete = (id: string) => {
    setCreditNoteToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (creditNoteToDelete) {
      deleteCreditNote.mutate(creditNoteToDelete);
      setDeleteDialogOpen(false);
      setCreditNoteToDelete(null);
    }
  };

  const handleValidate = (id: string) => {
    updateStatus.mutate({ id, status: 'validated' });
  };

  const handleCancel = (id: string) => {
    updateStatus.mutate({ id, status: 'cancelled' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Notes de Crédit</h1>
              <p className="text-muted-foreground">Gestion des avoirs clients</p>
            </div>
          </div>
          <Button onClick={() => { setSelectedCreditNote(undefined); setEditorOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle note
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{creditNotes.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Edit className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Brouillons</p>
                <p className="text-xl font-bold">{creditNotes.filter(cn => cn.status === 'draft').length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Validées</p>
                <p className="text-xl font-bold">{creditNotes.filter(cn => cn.status === 'validated').length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Montant total</p>
                <p className="text-xl font-bold">
                  {creditNotes.filter(cn => cn.status === 'validated').reduce((sum, cn) => sum + cn.total, 0).toFixed(2)}€
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 bg-white">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro, client ou motif..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
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
          </div>
        </Card>

        {/* Table */}
        <Card className="bg-white overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-muted/30 to-muted/10">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-xl font-bold text-foreground">Liste des Notes de Crédit</h2>
                <p className="text-sm text-muted-foreground">{filteredCreditNotes.length} note{filteredCreditNotes.length > 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          <ScrollArea className="min-h-[400px] max-h-[calc(100vh-400px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Numéro</TableHead>
                  <TableHead className="min-w-[100px]">Statut</TableHead>
                  <TableHead className="min-w-[140px]">Date</TableHead>
                  <TableHead className="min-w-[150px]">Client</TableHead>
                  <TableHead className="min-w-[200px]">Motif</TableHead>
                  <TableHead className="text-right min-w-[100px]">Total TTC</TableHead>
                  <TableHead className="text-right min-w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : paginatedCreditNotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucune note de crédit trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCreditNotes.map((cn) => (
                    <TableRow key={cn.id}>
                      <TableCell className="font-mono font-semibold">
                        {cn.credit_note_number}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(cn.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {format(new Date(cn.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {cn.customers ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{cn.customers.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm line-clamp-1">{cn.reason}</span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {cn.total.toFixed(2)}€
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleView(cn.id)}
                            title="Voir"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {cn.status === 'draft' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEdit(cn.id)}
                                className="text-blue-600"
                                title="Modifier"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleValidate(cn.id)}
                                className="text-green-600"
                                title="Valider"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDelete(cn.id)}
                                className="text-red-600"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {cn.status === 'validated' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleCancel(cn.id)}
                              className="text-orange-600"
                              title="Annuler"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setPage(Math.max(1, page - 1))}
                    className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => {
                    if (totalPages <= 7) return true;
                    if (p === 1 || p === totalPages) return true;
                    if (Math.abs(p - page) <= 1) return true;
                    return false;
                  })
                  .map((p, idx, arr) => {
                    const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                    return (
                      <PaginationItem key={p}>
                        {showEllipsis && <span className="px-2">...</span>}
                        <PaginationLink
                          onClick={() => setPage(p)}
                          isActive={p === page}
                          className="cursor-pointer"
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
            <div className="text-sm text-muted-foreground">
              Page {page} sur {totalPages}
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreditNoteEditor 
        open={editorOpen} 
        onOpenChange={setEditorOpen}
        creditNoteId={selectedCreditNote}
      />
      
      <CreditNoteViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        creditNoteId={selectedCreditNote}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la note de crédit ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La note de crédit sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
