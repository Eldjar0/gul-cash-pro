import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { TrendingUp, TrendingDown, Award } from 'lucide-react';
import { format } from 'date-fns';

// Mock data for demonstration
const mockTransactions = [
  {
    id: '1',
    customer_name: 'Jean Dupont',
    transaction_type: 'earn',
    points: 50,
    balance_after: 850,
    description: 'Achat #2025-0123',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    customer_name: 'Marie Martin',
    transaction_type: 'redeem',
    points: -100,
    balance_after: 400,
    description: 'Remise fidélité',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export function LoyaltyTransactionsHistory() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransactions = mockTransactions.filter(tx =>
    tx.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des Transactions</CardTitle>
        <CardDescription>Points gagnés et utilisés</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Rechercher un client ou une transaction..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredTransactions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Solde Après</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">{tx.customer_name}</TableCell>
                  <TableCell>
                    <Badge variant={tx.transaction_type === 'earn' ? 'default' : 'secondary'}>
                      {tx.transaction_type === 'earn' ? (
                        <>
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Gagné
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-3 w-3 mr-1" />
                          Utilisé
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className={tx.points > 0 ? 'text-green-600 font-bold' : 'text-orange-600 font-bold'}>
                    {tx.points > 0 ? '+' : ''}{tx.points}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4 text-yellow-500" />
                      {tx.balance_after}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{tx.description}</TableCell>
                  <TableCell>{format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            {searchTerm ? 'Aucune transaction trouvée' : 'Aucune transaction pour le moment'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
