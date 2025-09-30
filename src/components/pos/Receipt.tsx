import { Sale } from '@/types/pos';
import { COMPANY_INFO } from '@/data/company';

interface ReceiptProps {
  sale: Sale;
}

export function Receipt({ sale }: ReceiptProps) {
  return (
    <div className="font-mono text-xs max-w-80 mx-auto bg-card p-6 print:p-0">
      <div className="text-center border-b-2 border-dashed pb-4 mb-4">
        <h1 className="text-xl font-bold">{COMPANY_INFO.name}</h1>
        <p className="text-foreground">{COMPANY_INFO.address}</p>
        <p className="text-foreground">
          {COMPANY_INFO.postalCode} {COMPANY_INFO.city}
        </p>
        <p className="text-foreground mt-2">TVA: {COMPANY_INFO.vat}</p>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-muted-foreground">
          <span>N° Ticket:</span>
          <span className="font-bold text-foreground">{sale.saleNumber}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Date:</span>
          <span className="text-foreground">{new Date(sale.date).toLocaleString('fr-BE')}</span>
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
              <span>TVA {item.product.vat}%</span>
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
          <span className="text-foreground">{sale.totalVat.toFixed(2)}€</span>
        </div>
        {sale.totalDiscount > 0 && (
          <div className="flex justify-between text-pos-warning">
            <span>Remise totale:</span>
            <span>-{sale.totalDiscount.toFixed(2)}€</span>
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
            {sale.paymentMethod === 'cash' ? 'Espèces' : sale.paymentMethod === 'card' ? 'Carte' : 'Mobile'}
          </span>
        </div>
        {sale.paymentMethod === 'cash' && sale.amountPaid && (
          <>
            <div className="flex justify-between">
              <span>Reçu:</span>
              <span className="text-foreground">{sale.amountPaid.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between">
              <span>Rendu:</span>
              <span className="text-foreground">{(sale.change || 0).toFixed(2)}€</span>
            </div>
          </>
        )}
      </div>

      <div className="text-center mt-6 pt-4 border-t-2 border-dashed text-muted-foreground">
        <p>Merci de votre visite!</p>
        <p className="mt-2">À bientôt</p>
      </div>
    </div>
  );
}
