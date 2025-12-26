import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useHeldTickets, useResumeTicket, useDeleteHeldTicket } from '@/hooks/useHeldTickets';
import { Ticket, Trash2, Play, Clock, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface HeldTicketsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResumeTicket: (cartItems: any[]) => void;
  hasCurrentCart: boolean;
}

export const HeldTicketsSheet = ({ 
  open, 
  onOpenChange, 
  onResumeTicket,
  hasCurrentCart 
}: HeldTicketsSheetProps) => {
  const { data: heldTickets, isLoading } = useHeldTickets();
  const resumeTicket = useResumeTicket();
  const deleteTicket = useDeleteHeldTicket();

  const handleResume = async (ticketId: string) => {
    if (hasCurrentCart) {
      const confirm = window.confirm('Vous avez un panier en cours. Voulez-vous le remplacer par ce ticket ?');
      if (!confirm) return;
    }
    
    try {
      const cartItems = await resumeTicket.mutateAsync(ticketId);
      onResumeTicket(cartItems);
      onOpenChange(false);
    } catch (error) {
      console.error('Error resuming ticket:', error);
    }
  };

  const handleDelete = (ticketId: string) => {
    if (window.confirm('Supprimer ce ticket en attente ?')) {
      deleteTicket.mutate(ticketId);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'HH:mm', { locale: fr });
    } catch {
      return '--:--';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[350px] sm:w-[400px] p-0">
        <SheetHeader className="p-4 border-b bg-gradient-to-r from-amber-500/10 to-orange-500/10">
          <SheetTitle className="flex items-center gap-2 text-amber-700">
            <Ticket className="h-5 w-5" />
            Tickets en attente
            {heldTickets && heldTickets.length > 0 && (
              <Badge variant="secondary" className="bg-amber-500 text-white">
                {heldTickets.length}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-4 space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement...
              </div>
            ) : !heldTickets || heldTickets.length === 0 ? (
              <div className="text-center py-12">
                <Ticket className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground text-sm">
                  Aucun ticket en attente
                </p>
                <p className="text-muted-foreground/70 text-xs mt-1">
                  Utilisez le bouton "Attente" pour mettre un ticket de côté
                </p>
              </div>
            ) : (
              heldTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center">
                        <Ticket className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-amber-900">
                          {ticket.ticket_number}
                        </h4>
                        <div className="flex items-center gap-1 text-xs text-amber-700">
                          <Clock className="h-3 w-3" />
                          {formatTime(ticket.created_at)}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-100"
                      onClick={() => handleDelete(ticket.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1 text-xs text-amber-700">
                      <ShoppingBag className="h-3 w-3" />
                      {ticket.item_count} article{ticket.item_count > 1 ? 's' : ''}
                    </div>
                    <div className="text-lg font-bold text-amber-900">
                      {ticket.total_amount.toFixed(2)}€
                    </div>
                  </div>

                  {/* Preview of items */}
                  <div className="mb-3 space-y-1">
                    {ticket.items.slice(0, 3).map((item: any, idx: number) => (
                      <div key={idx} className="text-xs text-amber-800 flex justify-between">
                        <span className="truncate flex-1">
                          {item.quantity}x {item.product_name}
                        </span>
                        <span className="ml-2 font-medium">
                          {item.total_price?.toFixed(2)}€
                        </span>
                      </div>
                    ))}
                    {ticket.items.length > 3 && (
                      <div className="text-xs text-amber-600 italic">
                        +{ticket.items.length - 3} autres articles...
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => handleResume(ticket.id)}
                    disabled={resumeTicket.isPending}
                    className="w-full h-9 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-md"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Reprendre
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
