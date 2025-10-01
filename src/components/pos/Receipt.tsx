import { COMPANY_INFO } from '@/data/company';
import { Product } from '@/hooks/useProducts';

type DiscountType = 'percentage' | 'amount';

interface CartItem {
  product: Product;
  quantity: number;
  discount?: {
    type: DiscountType;
    value: number;
  };
  subtotal: number;
  vatAmount: number;
  total: number;
}

interface Customer {
  name: string;
  vat_number?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
}

interface Sale {
  id?: string;
  sale_number?: string;
  saleNumber?: string;
  date?: Date;
  items: CartItem[];
  subtotal: number;
  total_vat?: number;
  totalVat?: number;
  total_discount?: number;
  totalDiscount?: number;
  total: number;
  payment_method?: 'cash' | 'card' | 'mobile';
  paymentMethod?: 'cash' | 'card' | 'mobile';
  amount_paid?: number;
  amountPaid?: number;
  change_amount?: number;
  change?: number;
  is_invoice?: boolean;
  customer?: Customer;
}

interface ReceiptProps {
  sale: Sale;
}

export function Receipt({ sale }: ReceiptProps) {
  const isInvoice = sale.is_invoice || false;
  
  return (
    <div className="font-mono text-xs max-w-80 mx-auto bg-card p-6 print:p-0">
      <div className="text-center border-b-2 border-dashed pb-4 mb-4">
        <h1 className="text-xl font-bold">{COMPANY_INFO.name}</h1>
        <p className="text-foreground">{COMPANY_INFO.address}</p>
        <p className="text-foreground">
          {COMPANY_INFO.postalCode} {COMPANY_INFO.city}
        </p>
        <p className="text-foreground mt-2">TVA: {COMPANY_INFO.vat}</p>
        {COMPANY_INFO.phone && <p className="text-foreground">Tél: {COMPANY_INFO.phone}</p>}
        {COMPANY_INFO.email && <p className="text-foreground">{COMPANY_INFO.email}</p>}
      </div>

      {/* Customer info - Only for invoices */}
      {isInvoice && sale.customer && (
        <div className="mb-4 p-3 bg-accent/50 rounded border border-border">
          <h3 className="font-bold text-foreground mb-2">CLIENT</h3>
          <p className="text-foreground font-semibold">{sale.customer.name}</p>
          {sale.customer.vat_number && (
            <p className="text-muted-foreground">TVA: {sale.customer.vat_number}</p>
          )}
          {sale.customer.address && (
            <p className="text-muted-foreground text-[10px]">{sale.customer.address}</p>
          )}
          {(sale.customer.postal_code || sale.customer.city) && (
            <p className="text-muted-foreground text-[10px]">
              {sale.customer.postal_code} {sale.customer.city}
            </p>
          )}
          {sale.customer.email && (
            <p className="text-muted-foreground text-[10px]">{sale.customer.email}</p>
          )}
          {sale.customer.phone && (
            <p className="text-muted-foreground text-[10px]">{sale.customer.phone}</p>
          )}
        </div>
      )}

      <div className="mb-4">
        <div className="flex justify-between text-muted-foreground">
          <span>N° {isInvoice ? 'Facture' : 'Ticket'}:</span>
          <span className="font-bold text-foreground">{sale.saleNumber || sale.sale_number}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Date:</span>
          <span className="text-foreground">{new Date(sale.date || new Date()).toLocaleString('fr-BE')}</span>
        </div>
      </div>

      <div className="border-t-2 border-dashed pt-2 mb-2">
        {sale.items.map((item, index) => (
          <div key={index} className="mb-3">
            <div className="font-bold text-foreground">{item.product.name}</div>
            <div className="flex justify-between text-muted-foreground">
              <span>
                {item.product.price.toFixed(2)}€ × {item.quantity.toFixed(item.product.type === 'weight' ? 3 : 0)}
                {item.product.type === 'weight' && 'kg'}
              </span>
              <span className="text-foreground">{item.subtotal.toFixed(2)}€</span>
            </div>
            {item.discount && (
              <div className="text-xs text-pos-warning">
                Remise: -{item.discount.value}
                {item.discount.type === 'percentage' ? '%' : '€'}
              </div>
            )}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>TVA {item.product.vat_rate}%</span>
              <span className="text-foreground">{item.vatAmount.toFixed(2)}€</span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t-2 border-dashed pt-2 space-y-1">
        <div className="flex justify-between text-muted-foreground">
          <span>Sous-total HT:</span>
          <span className="text-foreground">{sale.subtotal.toFixed(2)}€</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>TVA:</span>
          <span className="text-foreground">{(sale.totalVat || sale.total_vat || 0).toFixed(2)}€</span>
        </div>
        {(sale.totalDiscount || sale.total_discount || 0) > 0 && (
          <div className="flex justify-between text-pos-warning">
            <span>Remise totale:</span>
            <span>-{(sale.totalDiscount || sale.total_discount || 0).toFixed(2)}€</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold border-t pt-2 text-foreground">
          <span>TOTAL TTC:</span>
          <span>{sale.total.toFixed(2)}€</span>
        </div>
      </div>

      <div className="border-t-2 border-dashed pt-2 mt-2 space-y-1 text-muted-foreground">
        <div className="flex justify-between">
          <span>Mode de paiement:</span>
          <span className="text-foreground">
            {(sale.paymentMethod || sale.payment_method) === 'cash' ? 'Espèces' : (sale.paymentMethod || sale.payment_method) === 'card' ? 'Carte' : 'Mobile'}
          </span>
        </div>
        {(sale.paymentMethod || sale.payment_method) === 'cash' && (sale.amountPaid || sale.amount_paid) && (
          <>
            <div className="flex justify-between">
              <span>Reçu:</span>
              <span className="text-foreground">{(sale.amountPaid || sale.amount_paid || 0).toFixed(2)}€</span>
            </div>
            <div className="flex justify-between">
              <span>Rendu:</span>
              <span className="text-foreground">{(sale.change || sale.change_amount || 0).toFixed(2)}€</span>
            </div>
          </>
        )}
      </div>

      <div className="text-center mt-6 pt-4 border-t-2 border-dashed text-muted-foreground">
        {isInvoice ? (
          <>
            <p className="text-[10px] mb-2">
              Facture établie conformément aux dispositions légales
            </p>
            <p className="text-[10px]">
              Cette facture est payable dans les 30 jours
            </p>
          </>
        ) : (
          <>
            <p>Merci de votre visite!</p>
            <p className="mt-2">À bientôt</p>
          </>
        )}
      </div>
    </div>
  );
}
