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

interface ThermalReceiptProps {
  sale: Sale;
}

export function ThermalReceipt({ sale }: ThermalReceiptProps) {
  const isInvoice = sale.is_invoice || false;
  
  return (
    <div 
      id="thermal-receipt"
      className="font-mono text-xs bg-white text-black p-4"
      style={{ 
        width: '80mm',
        maxWidth: '302px',
        margin: '0 auto',
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        lineHeight: '1.4'
      }}
    >
      {/* Header - Company Info */}
      <div className="text-center border-b-2 border-dashed border-black pb-3 mb-3">
        <div className="text-base font-bold uppercase mb-1">{COMPANY_INFO.name}</div>
        <div className="text-xs">{COMPANY_INFO.address}</div>
        <div className="text-xs">{COMPANY_INFO.postalCode} {COMPANY_INFO.city}</div>
        <div className="text-xs mt-2">TVA: {COMPANY_INFO.vat}</div>
        {COMPANY_INFO.phone && <div className="text-xs">Tel: {COMPANY_INFO.phone}</div>}
        {COMPANY_INFO.email && <div className="text-xs">{COMPANY_INFO.email}</div>}
      </div>

      {/* Customer info - Only for invoices */}
      {isInvoice && sale.customer && (
        <div className="mb-3 pb-2 border-b border-dashed border-black">
          <div className="font-bold mb-1">CLIENT:</div>
          <div className="font-bold">{sale.customer.name}</div>
          {sale.customer.vat_number && (
            <div className="text-[10px]">TVA: {sale.customer.vat_number}</div>
          )}
          {sale.customer.address && (
            <div className="text-[10px]">{sale.customer.address}</div>
          )}
          {(sale.customer.postal_code || sale.customer.city) && (
            <div className="text-[10px]">
              {sale.customer.postal_code} {sale.customer.city}
            </div>
          )}
        </div>
      )}

      {/* Sale info */}
      <div className="mb-3 pb-2 border-b border-dashed border-black">
        <div className="flex justify-between">
          <span>{isInvoice ? 'FACTURE' : 'TICKET'}:</span>
          <span className="font-bold">{sale.saleNumber || sale.sale_number}</span>
        </div>
        <div className="flex justify-between">
          <span>DATE:</span>
          <span>{new Date(sale.date || new Date()).toLocaleString('fr-BE', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
        </div>
      </div>

      {/* Items */}
      <div className="mb-3 pb-2 border-b-2 border-dashed border-black">
        {sale.items.map((item, index) => (
          <div key={index} className="mb-2">
            <div className="font-bold">{item.product.name}</div>
            <div className="flex justify-between">
              <span>
                {item.product.price.toFixed(2)} x {item.quantity.toFixed(item.product.type === 'weight' ? 3 : 0)}
                {item.product.type === 'weight' && 'kg'}
              </span>
              <span>{item.subtotal.toFixed(2)}</span>
            </div>
            {item.discount && (
              <div className="text-[10px]">
                Remise: -{item.discount.value}
                {item.discount.type === 'percentage' ? '%' : 'EUR'}
              </div>
            )}
            <div className="flex justify-between text-[10px]">
              <span>TVA {item.product.vat_rate}%</span>
              <span>{item.vatAmount.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="mb-3 pb-2 border-b-2 border-dashed border-black">
        <div className="flex justify-between">
          <span>SOUS-TOTAL HT:</span>
          <span>{sale.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>TVA:</span>
          <span>{(sale.totalVat || sale.total_vat || 0).toFixed(2)}</span>
        </div>
        {(sale.totalDiscount || sale.total_discount || 0) > 0 && (
          <div className="flex justify-between">
            <span>REMISE:</span>
            <span>-{(sale.totalDiscount || sale.total_discount || 0).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-black">
          <span>TOTAL TTC:</span>
          <span>{sale.total.toFixed(2)} EUR</span>
        </div>
      </div>

      {/* Payment info */}
      <div className="mb-3 pb-2 border-b border-dashed border-black">
        <div className="flex justify-between">
          <span>PAIEMENT:</span>
          <span className="font-bold">
            {(sale.paymentMethod || sale.payment_method) === 'cash' 
              ? 'ESPECES' 
              : (sale.paymentMethod || sale.payment_method) === 'card' 
              ? 'CARTE' 
              : 'MOBILE'}
          </span>
        </div>
        {(sale.paymentMethod || sale.payment_method) === 'cash' && (sale.amountPaid || sale.amount_paid) && (
          <>
            <div className="flex justify-between">
              <span>RECU:</span>
              <span>{(sale.amountPaid || sale.amount_paid || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>RENDU:</span>
              <span>{(sale.change || sale.change_amount || 0).toFixed(2)}</span>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center mt-4 pt-3 border-t-2 border-dashed border-black">
        {isInvoice ? (
          <>
            <div className="text-[10px] mb-2">
              Facture conforme aux dispositions legales
            </div>
            <div className="text-[10px]">
              Payable sous 30 jours
            </div>
          </>
        ) : (
          <>
            <div className="font-bold mb-1">MERCI DE VOTRE VISITE!</div>
            <div className="mt-1">A BIENTOT</div>
          </>
        )}
      </div>
    </div>
  );
}

export function printThermalReceipt() {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Veuillez autoriser les popups pour imprimer');
    return;
  }

  const receiptContent = document.getElementById('thermal-receipt');
  if (!receiptContent) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Ticket de caisse</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          
          @media print {
            body {
              width: 80mm;
              margin: 0;
              padding: 0;
            }
          }
          
          body {
            font-family: 'Courier New', monospace;
            font-size: 11px;
            line-height: 1.4;
            margin: 0;
            padding: 0;
            width: 80mm;
          }
        </style>
      </head>
      <body>
        ${receiptContent.innerHTML}
      </body>
    </html>
  `);
  
  printWindow.document.close();
  
  // Attendre que le contenu soit chargé avant d'imprimer
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }, 250);
}
