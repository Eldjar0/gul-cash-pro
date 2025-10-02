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
    <div className="font-mono text-[11px] leading-tight max-w-[320px] mx-auto bg-white text-black p-4 print:p-0">
      {/* En-tête magasin */}
      <div className="text-center mb-3">
        <h1 className="text-base font-bold tracking-wide mb-1">{COMPANY_INFO.name}</h1>
        <p className="text-[10px]">{COMPANY_INFO.address}</p>
        <p className="text-[10px]">{COMPANY_INFO.postalCode} {COMPANY_INFO.city}</p>
        {COMPANY_INFO.phone && <p className="text-[10px]">Tel: {COMPANY_INFO.phone}</p>}
        <p className="text-[10px] mt-1">TVA: {COMPANY_INFO.vat}</p>
      </div>

      {/* Ligne de séparation */}
      <div className="border-t border-dashed border-black my-2"></div>

      {/* Info ticket/facture */}
      <div className="text-[10px] mb-2">
        <div className="flex justify-between">
          <span>{isInvoice ? 'FACTURE' : 'TICKET'}</span>
          <span className="font-bold">{sale.saleNumber || sale.sale_number}</span>
        </div>
        <div className="flex justify-between">
          <span>DATE</span>
          <span>{new Date(sale.date || new Date()).toLocaleString('fr-BE', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
        </div>
      </div>

      {/* Customer info - Only for invoices */}
      {isInvoice && sale.customer && (
        <>
          <div className="border-t border-dashed border-black my-2"></div>
          <div className="text-[10px] mb-2">
            <p className="font-bold">CLIENT</p>
            <p className="font-semibold">{sale.customer.name}</p>
            {sale.customer.vat_number && <p>TVA: {sale.customer.vat_number}</p>}
            {sale.customer.address && <p>{sale.customer.address}</p>}
            {(sale.customer.postal_code || sale.customer.city) && (
              <p>{sale.customer.postal_code} {sale.customer.city}</p>
            )}
            {sale.customer.email && <p>{sale.customer.email}</p>}
            {sale.customer.phone && <p>{sale.customer.phone}</p>}
          </div>
        </>
      )}

      {/* Ligne de séparation */}
      <div className="border-t border-dashed border-black my-2"></div>

      {/* Articles */}
      <div className="mb-2">
        {sale.items.map((item, index) => (
          <div key={index} className="mb-1">
            <div className="flex justify-between leading-tight">
              <span className="flex-1 uppercase text-[10px]">{item.product.name}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>
                {item.quantity.toFixed(item.product.type === 'weight' ? 3 : 0)}
                {item.product.type === 'weight' ? 'kg' : 'x'}
                {item.product.type === 'weight' ? '' : ` ${item.product.price.toFixed(2)}€`}
              </span>
              <span className="font-bold">{item.subtotal.toFixed(2)}</span>
            </div>
            {item.discount && (
              <div className="text-[9px] italic">
                REMISE -{item.discount.value}{item.discount.type === 'percentage' ? '%' : '€'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Ligne de séparation */}
      <div className="border-t border-dashed border-black my-2"></div>

      {/* Totaux */}
      <div className="text-[10px] space-y-0.5">
        <div className="flex justify-between">
          <span>SOUS-TOTAL HT</span>
          <span>{sale.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>TVA</span>
          <span>{(sale.totalVat || sale.total_vat || 0).toFixed(2)}</span>
        </div>
        {(sale.totalDiscount || sale.total_discount || 0) > 0 && (
          <div className="flex justify-between">
            <span>REMISE TOTALE</span>
            <span>-{(sale.totalDiscount || sale.total_discount || 0).toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Total principal */}
      <div className="border-t-2 border-black mt-1 pt-1">
        <div className="flex justify-between text-sm font-bold">
          <span>TOTAL EUR</span>
          <span>{sale.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Paiement */}
      <div className="border-t border-dashed border-black mt-2 pt-2">
        <div className="text-[10px] space-y-0.5">
          <div className="flex justify-between font-bold">
            <span>
              {(sale.paymentMethod || sale.payment_method) === 'cash' ? 'ESPECES' : 
               (sale.paymentMethod || sale.payment_method) === 'card' ? 'CARTE BANCAIRE' : 'PAIEMENT MOBILE'}
            </span>
            <span>{sale.total.toFixed(2)}</span>
          </div>
          {(sale.paymentMethod || sale.payment_method) === 'cash' && (sale.amountPaid || sale.amount_paid) && (
            <>
              <div className="flex justify-between">
                <span>RECU</span>
                <span>{(sale.amountPaid || sale.amount_paid || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>RENDU MONNAIE</span>
                <span>{(sale.change || sale.change_amount || 0).toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-4 pt-3 border-t border-dashed border-black">
        {isInvoice ? (
          <div className="text-[9px] space-y-1">
            <p>FACTURE</p>
            <p>Payable sous 30 jours</p>
          </div>
        ) : (
          <div className="text-[10px] space-y-1">
            <p className="font-bold">MERCI DE VOTRE VISITE</p>
            <p>A BIENTOT</p>
          </div>
        )}
      </div>
    </div>
  );
}
