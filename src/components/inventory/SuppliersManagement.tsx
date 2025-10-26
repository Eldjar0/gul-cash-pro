import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Phone, Mail, MapPin, Search, Truck, FileText, Package, Eye, Printer } from 'lucide-react';
import { useSuppliers, useSaveSuppliers, Supplier } from '@/hooks/useSuppliers';
import { useProducts } from '@/hooks/useProducts';
import { toast } from 'sonner';
import { generateSuppliersPDF } from '@/utils/generateSuppliersPDF';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const SuppliersManagement = () => {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const { data: products = [] } = useProducts();
  const saveMutation = useSaveSuppliers();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [supplierProductsOpen, setSupplierProductsOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    notes: '',
    is_active: true,
  });

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        contact_name: supplier.contact_name || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        city: supplier.city || '',
        postal_code: supplier.postal_code || '',
        notes: supplier.notes || '',
        is_active: supplier.is_active,
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '',
        contact_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postal_code: '',
        notes: '',
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Le nom du fournisseur est obligatoire');
      return;
    }

    const newSupplier: Supplier = {
      id: editingSupplier?.id || crypto.randomUUID(),
      name: formData.name,
      contact_name: formData.contact_name || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      city: formData.city || undefined,
      postal_code: formData.postal_code || undefined,
      notes: formData.notes || undefined,
      is_active: formData.is_active,
      created_at: editingSupplier?.created_at || new Date().toISOString(),
    };

    let updatedSuppliers: Supplier[];
    if (editingSupplier) {
      updatedSuppliers = suppliers.map(s => s.id === editingSupplier.id ? newSupplier : s);
    } else {
      updatedSuppliers = [...suppliers, newSupplier];
    }

    await saveMutation.mutateAsync(updatedSuppliers);
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) return;

    const updatedSuppliers = suppliers.filter(s => s.id !== id);
    await saveMutation.mutateAsync(updatedSuppliers);
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.is_active && (
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleViewSupplier = (supplier: Supplier) => {
    setViewingSupplier(supplier);
    setSupplierProductsOpen(true);
  };

  const getSupplierProducts = (supplierName: string) => {
    return products.filter(p => 
      p.supplier?.toLowerCase() === supplierName.toLowerCase()
    );
  };

  const generateSupplierStockPDF = (supplier: Supplier) => {
    const supplierProducts = getSupplierProducts(supplier.name);
    
    if (supplierProducts.length === 0) {
      toast.error('Aucun produit pour ce fournisseur');
      return;
    }

    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('fr-FR');

    // En-tête
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('État des Stocks par Fournisseur', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fournisseur: ${supplier.name}`, 14, 35);
    doc.text(`Date: ${today}`, 14, 42);
    
    if (supplier.contact_name) {
      doc.text(`Contact: ${supplier.contact_name}`, 14, 49);
    }
    if (supplier.phone) {
      doc.text(`Tél: ${supplier.phone}`, 14, 56);
    }

    // Tableau des produits
    const tableData = supplierProducts.map(p => [
      p.name,
      p.barcode || '-',
      `${p.stock || 0} ${p.unit || ''}`,
      `${p.min_stock || 0}`,
      p.stock === 0 ? 'Rupture' : p.stock <= (p.min_stock || 0) ? 'Faible' : 'OK',
      `${(p.price || 0).toFixed(2)} €`
    ]);

    (doc as any).autoTable({
      startY: supplier.phone ? 63 : 56,
      head: [['Produit', 'Code-barres', 'Stock', 'Stock Min', 'État', 'Prix']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [20, 184, 166],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 25 }
      },
      didParseCell: (data: any) => {
        if (data.row.section === 'body' && data.column.index === 4) {
          const status = data.cell.raw;
          if (status === 'Rupture') {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          } else if (status === 'Faible') {
            data.cell.styles.textColor = [249, 115, 22];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    // Résumé
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const totalProducts = supplierProducts.length;
    const outOfStock = supplierProducts.filter(p => p.stock === 0).length;
    const lowStock = supplierProducts.filter(p => p.stock > 0 && p.stock <= (p.min_stock || 0)).length;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Résumé:', 14, finalY);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total produits: ${totalProducts}`, 14, finalY + 7);
    doc.text(`En rupture: ${outOfStock}`, 14, finalY + 14);
    doc.text(`Stock faible: ${lowStock}`, 14, finalY + 21);

    // Sauvegarder
    doc.save(`stock-${supplier.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF généré avec succès');
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un fournisseur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          variant="outline" 
          onClick={() => generateSuppliersPDF(suppliers)}
          disabled={suppliers.length === 0}
        >
          <FileText className="h-4 w-4 mr-2" />
          Exporter PDF
        </Button>
        <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-teal-600 to-cyan-600">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Fournisseur
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <Card className="p-12 text-center">
          <Truck className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun fournisseur trouvé</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm ? 'Aucun résultat' : 'Créez votre premier fournisseur'}
          </p>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Créer un fournisseur
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((supplier) => {
            const supplierProducts = getSupplierProducts(supplier.name);
            const productsCount = supplierProducts.length;
            const lowStockCount = supplierProducts.filter(p => p.stock > 0 && p.stock <= (p.min_stock || 0)).length;
            const outOfStockCount = supplierProducts.filter(p => p.stock === 0).length;

            return (
              <Card key={supplier.id} className="hover:shadow-md transition-all cursor-pointer" onClick={() => handleViewSupplier(supplier)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{supplier.name}</h3>
                      {supplier.contact_name && (
                        <p className="text-sm text-muted-foreground">{supplier.contact_name}</p>
                      )}
                      <Badge variant="outline" className="mt-2">
                        {productsCount} produit{productsCount > 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(supplier)} title="Modifier">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(supplier.id)} title="Supprimer">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {supplier.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{supplier.email}</span>
                      </div>
                    )}
                    {supplier.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{supplier.phone}</span>
                      </div>
                    )}
                    {supplier.address && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{supplier.address}</span>
                      </div>
                    )}
                  </div>

                  {productsCount > 0 && (
                    <div className="mt-4 pt-3 border-t flex justify-between text-xs">
                      {outOfStockCount > 0 && (
                        <span className="text-destructive font-medium">{outOfStockCount} en rupture</span>
                      )}
                      {lowStockCount > 0 && (
                        <span className="text-orange-600 font-medium">{lowStockCount} stock faible</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog Produits Fournisseur */}
      <Dialog open={supplierProductsOpen} onOpenChange={setSupplierProductsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Produits de {viewingSupplier?.name}</DialogTitle>
                <DialogDescription>
                  Liste des produits liés à ce fournisseur avec leur état de stock
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => viewingSupplier && generateSupplierStockPDF(viewingSupplier)}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                Imprimer État des Stocks
              </Button>
            </div>
          </DialogHeader>
          
          <div className="space-y-4 overflow-y-auto max-h-[60vh]">
            {viewingSupplier && getSupplierProducts(viewingSupplier.name).length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Aucun produit pour ce fournisseur</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {viewingSupplier && getSupplierProducts(viewingSupplier.name).map((product) => (
                  <Card key={product.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 flex items-center justify-center bg-muted rounded">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold">{product.name}</h4>
                              {product.barcode && (
                                <Badge variant="outline" className="mt-1 font-mono text-xs">
                                  {product.barcode}
                                </Badge>
                              )}
                            </div>
                            <span className="font-bold text-lg">{product.price.toFixed(2)} €</span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Stock actuel:</span>
                              <div className="font-semibold mt-1">
                                {product.stock || 0} {product.unit}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Stock minimum:</span>
                              <div className="font-semibold mt-1">
                                {product.min_stock || 0}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">État:</span>
                              <div className="mt-1">
                                <Badge variant={
                                  product.stock === 0 ? 'destructive' : 
                                  product.stock <= (product.min_stock || 0) ? 'secondary' : 
                                  'default'
                                }>
                                  {product.stock === 0 ? 'Rupture' : 
                                   product.stock <= (product.min_stock || 0) ? 'Stock faible' : 
                                   'OK'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Édition Fournisseur */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nom du fournisseur"
              />
            </div>

            <div>
              <Label htmlFor="contact_name">Nom du contact</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                placeholder="Nom du contact"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemple.com"
                />
              </div>

              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="06 12 34 56 78"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 rue de la République"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postal_code">Code postal</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  placeholder="75001"
                />
              </div>

              <div>
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Paris"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes supplémentaires..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave}>
                {editingSupplier ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
