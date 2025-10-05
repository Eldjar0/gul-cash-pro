import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCustomerCredit } from '@/hooks/useCustomerCredit';
import { useCustomers } from '@/hooks/useCustomers';
import { Wallet, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

export function CustomerCreditManagement() {
  const { data: customers } = useCustomers();
  const { data: creditAccounts } = useCustomerCredit();
  const [searchTerm, setSearchTerm] = useState('');

  const customersWithCredit = customers?.filter(customer => {
    const account = creditAccounts?.find(acc => acc.customer_id === customer.id);
    return account && (account.current_balance > 0 || account.credit_limit > 0);
  });

  const filteredCustomers = customersWithCredit?.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCredit = creditAccounts?.reduce((sum, acc) => sum + acc.current_balance, 0) || 0;
  const totalLimit = creditAccounts?.reduce((sum, acc) => sum + acc.credit_limit, 0) || 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crédit Total Utilisé</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCredit.toFixed(2)} €</div>
            <p className="text-xs text-muted-foreground">dû par les clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Limite Totale</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLimit.toFixed(2)} €</div>
            <p className="text-xs text-muted-foreground">crédit autorisé</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients à Crédit</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customersWithCredit?.length || 0}</div>
            <p className="text-xs text-muted-foreground">comptes actifs</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comptes Crédit</CardTitle>
          <CardDescription>Gestion des paiements différés</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredCustomers && filteredCustomers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Solde Actuel</TableHead>
                  <TableHead>Limite Autorisée</TableHead>
                  <TableHead>Disponible</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => {
                  const account = creditAccounts?.find(acc => acc.customer_id === customer.id);
                  if (!account) return null;
                  
                  const available = account.credit_limit - account.current_balance;
                  const usagePercent = (account.current_balance / account.credit_limit) * 100;
                  
                  return (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell className="font-bold text-orange-600">
                        {account.current_balance.toFixed(2)} €
                      </TableCell>
                      <TableCell>{account.credit_limit.toFixed(2)} €</TableCell>
                      <TableCell className="text-green-600">
                        {available.toFixed(2)} €
                      </TableCell>
                      <TableCell>
                        {usagePercent >= 90 ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Limite atteinte
                          </Badge>
                        ) : usagePercent >= 70 ? (
                          <Badge variant="secondary">Vigilance</Badge>
                        ) : (
                          <Badge variant="outline">Normal</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Aucun compte à crédit
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
