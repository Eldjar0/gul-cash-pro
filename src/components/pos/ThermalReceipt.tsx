import { Product } from '@/hooks/useProducts';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import logoMarket from '@/assets/logo-market.png';


type DiscountType = 'percentage' | 'amount';

interface CartItem {
  product: Product;
  quantity: number;
  custom_price?: number;
  discount?: {
    type: DiscountType;
    value: number;
  };
  subtotal: number;
  vatAmount: number;
  total: number;
  is_gift?: boolean;
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
  fiscal_number?: string;
  date?: Date;
  items: CartItem[];
  subtotal: number;
  total_vat?: number;
  totalVat?: number;
  total_discount?: number;
  totalDiscount?: number;
  total: number;
  payment_method?: 'cash' | 'card' | 'mobile' | 'customer_credit';
  paymentMethod?: 'cash' | 'card' | 'mobile' | 'customer_credit';
  payment_split?: Record<string, number>;
  amount_paid?: number;
  amountPaid?: number;
  change_amount?: number;
  change?: number;
  is_invoice?: boolean;
  is_cancelled?: boolean;
  customer?: Customer;
}

interface ThermalReceiptProps {
  sale: Sale;
}

export function ThermalReceipt({ sale }: ThermalReceiptProps) {
  const isInvoice = sale.is_invoice || false;
  const saleDate = new Date(sale.date || new Date());
  const { settings } = useCompanySettings();
  
  // Calculer le total des réductions
  const totalReductions = sale.items.reduce((acc, item) => {
    if (!item.product || item.is_gift) return acc;
    
    let reduction = 0;
    const basePrice = item.custom_price || item.product.price;
    
    // Réduction par prix spécial
    if (item.custom_price && item.custom_price < item.product.price) {
      reduction += (item.product.price - item.custom_price) * item.quantity;
    }
    
    // Réduction par discount
    if (item.discount) {
      if (item.discount.type === 'percentage') {
        reduction += (basePrice * item.quantity * item.discount.value) / 100;
      } else {
        reduction += item.discount.value;
      }
    }
    
    return acc + reduction;
  }, 0);
  
  // Calculer TVA par taux (comme Lidl)
  const vatByRate = sale.items.reduce((acc, item) => {
    // Vérifier que le produit existe
    if (!item.product) return acc;
    
    const rate = item.product.vat_rate;
    if (!acc[rate]) {
      acc[rate] = { totalHT: 0, totalVAT: 0 };
    }
    const priceHT = item.product.price / (1 + rate / 100);
    const itemHT = priceHT * item.quantity;
    const itemVAT = itemHT * (rate / 100);
    acc[rate].totalHT += itemHT;
    acc[rate].totalVAT += itemVAT;
    return acc;
  }, {} as Record<number, { totalHT: number; totalVAT: number }>);
  
  // Fonction pour formater et aligner les lignes
  const formatLine = (left: string, right: string, width = 40) => {
    const spaces = width - left.length - right.length;
    return left + ' '.repeat(Math.max(1, spaces)) + right;
  };
  
  return (
    <div 
      id="thermal-receipt"
      className="font-mono bg-white text-black relative"
      style={{ 
        width: '80mm',
        maxWidth: '302px',
        margin: '0 auto',
        fontFamily: "'Barlow Semi Condensed', 'Arial Narrow', Arial, sans-serif",
        fontSize: '16.4px',
        lineHeight: '1.3',
        padding: '8px',
        paddingRight: '24px',
        fontWeight: '900',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* Logo - centré en haut */}
      <div className="text-center mb-2">
        <img 
          src={logoMarket} 
          alt="Logo" 
          style={{ 
            width: '120px', 
            height: 'auto', 
            margin: '0 auto',
            display: 'block'
          }} 
        />
      </div>

      {/* Company Info - Conformité légale belge */}
      <div className="text-center mb-2" style={{ fontWeight: '900', fontSize: '11px', lineHeight: '1.4' }}>
        <div style={{ fontSize: '14px', fontWeight: '900', marginBottom: '2px' }}>{settings.name}</div>
        <div style={{ fontSize: '10px' }}>{settings.address}</div>
        <div style={{ fontSize: '10px' }}>{settings.postal_code} {settings.city}</div>
        <div style={{ fontSize: '11px', fontWeight: '900', marginTop: '2px' }}>
          TVA: BE {settings.vat_number?.replace(/^BE\s*/, '').replace(/(\d{4})(\d{3})(\d{3})/, '$1.$2.$3')}
        </div>
      </div>

      {/* ANNULÉ - Affichage visible */}
      {sale.is_cancelled && (
        <div style={{ 
          textAlign: 'center',
          marginBottom: '8px',
          padding: '8px',
          backgroundColor: '#FEE2E2',
          border: '4px solid #DC2626',
          fontWeight: '900'
        }}>
          <div style={{ fontSize: '24px', color: '#DC2626', letterSpacing: '2px' }}>
            ❌ ANNULÉ ❌
          </div>
          <div style={{ fontSize: '10px', color: '#991B1B', marginTop: '4px' }}>
            Document comptabilisé à 0€
          </div>
        </div>
      )}

      {/* Numéro fiscal - Obligatoire pour conformité */}
      {sale.fiscal_number && (
        <div className="text-center" style={{ 
          fontSize: '12px', 
          fontWeight: '900',
          backgroundColor: '#f0f0f0',
          padding: '4px',
          margin: '4px 0',
          border: '1px solid #000'
        }}>
          N° FISCAL: {sale.fiscal_number}
        </div>
      )}

      <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>

      {/* Customer info - Show on all tickets if customer selected */}
      {sale.customer && (
        <>
          <div style={{ 
            fontSize: '14px', 
            marginBottom: '6px', 
            fontWeight: '900', 
            paddingRight: '24px',
            backgroundColor: '#f3f4f6',
            padding: '6px',
            border: '2px solid #000',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '16px', fontWeight: '900', marginBottom: '3px', letterSpacing: '0.5px' }}>
              CLIENT: {sale.customer.name}
            </div>
            {sale.customer.vat_number && <div style={{ fontSize: '11px', wordWrap: 'break-word' }}>TVA: {sale.customer.vat_number}</div>}
            {sale.customer.address && <div style={{ fontSize: '11px', wordWrap: 'break-word' }}>{sale.customer.address}</div>}
            {(sale.customer.postal_code || sale.customer.city) && (
              <div style={{ fontSize: '11px' }}>{sale.customer.postal_code} {sale.customer.city}</div>
            )}
            {sale.customer.email && <div style={{ fontSize: '11px' }}>{sale.customer.email}</div>}
            {sale.customer.phone && <div style={{ fontSize: '11px' }}>{sale.customer.phone}</div>}
          </div>
          <div style={{ borderTop: '1.4px dashed #000', margin: '6px 0' }}></div>
        </>
      )}

      {/* Sale info - compact */}
      <div style={{ fontSize: '11px', marginBottom: '4px', fontWeight: '900', paddingRight: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{sale.saleNumber || sale.sale_number}</span>
          <span>{saleDate.toLocaleString('fr-BE', { 
            day: '2-digit', 
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
        </div>
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }}></div>

      {/* Items - Style Lidl */}
      <div style={{ marginBottom: '6px', paddingRight: '24px' }}>
        {sale.items.map((item, index) => {
          // Vérifier que le produit existe
          if (!item.product) return null;
          
          const unitDisplay = item.product.type === 'weight' ? 'kg' : 'pc';
          const qtyDisplay = item.quantity.toFixed(item.product.type === 'weight' ? 3 : 0);
          
          // Prix de base (peut être custom_price si défini)
          const basePrice = item.product.price;
          const effectivePrice = item.custom_price || basePrice;
          const hasSpecialPrice = item.custom_price && item.custom_price !== basePrice;
          
          return (
            <div key={index} style={{ marginBottom: '3px' }}>
              {/* Nom du produit ET infos sur la MÊME ligne */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: '900',
                gap: '6px',
                marginBottom: '1px'
              }}>
                <span style={{ 
                  fontWeight: '900', 
                  textTransform: 'uppercase',
                  fontSize: '16px',
                  letterSpacing: '0.3px',
                  flex: '1',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '180px'
                }}>
                  {item.product.name}
                  {item.is_gift && <span style={{ marginLeft: '4px' }}>🎁</span>}
                </span>
                <span style={{ 
                  fontWeight: '900', 
                  whiteSpace: 'nowrap',
                  fontSize: '13px',
                  color: item.is_gift ? '#ec4899' : '#000'
                }}>
                  {item.is_gift ? 'OFFERT' : `${item.total.toFixed(2)}€`}
                </span>
              </div>
              
              {/* Ligne avec quantité, prix unitaire - REMISE */}
              <div style={{ 
                fontSize: '11px',
                fontWeight: '800'
              }}>
                {qtyDisplay} {unitDisplay} x {hasSpecialPrice && (
                  <span style={{ textDecoration: 'line-through', marginRight: '4px' }}>
                    {basePrice.toFixed(2)}€
                  </span>
                )}
                <span style={hasSpecialPrice ? { fontWeight: '900', color: '#d97706' } : {}}>
                  {effectivePrice.toFixed(2)}€
                </span>
                {item.discount && !item.is_gift && (
                  <span style={{ fontStyle: 'italic', marginLeft: '5px' }}>
                    REM -{item.discount.value}{item.discount.type === 'percentage' ? '%' : '€'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: '1px solid #000', margin: '4px 0' }}></div>

      {/* Total des réductions si présentes */}
      {totalReductions > 0 && (
        <div style={{ padding: '4px 0', marginBottom: '4px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '14px', 
            fontWeight: '900', 
            gap: '8px', 
            paddingRight: '24px',
            color: '#16a34a'
          }}>
            <span>TOTAL RÉDUCTIONS</span>
            <span style={{ whiteSpace: 'nowrap' }}>-{totalReductions.toFixed(2)}€</span>
          </div>
        </div>
      )}

      {/* Total principal - simplifié */}
      <div style={{ padding: '4px 0', margin: '4px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: '900', gap: '8px', paddingRight: '24px' }}>
          <span>TOTAL</span>
          <span style={{ whiteSpace: 'nowrap' }}>{sale.total.toFixed(2)}€</span>
        </div>
      </div>
      
      <div style={{ borderTop: '1px solid #000', margin: '4px 0' }}></div>

      {/* Payment */}
      <div style={{ fontSize: '13.7px', marginTop: '6px', marginBottom: '6px', fontWeight: '900', paddingRight: '24px' }}>
        {sale.payment_split && Object.keys(sale.payment_split).length > 1 ? (
          // Paiement mixte
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', marginBottom: '3px', gap: '3px' }}>
              <span>PAIEMENT MIXTE</span>
              <span style={{ whiteSpace: 'nowrap' }}>{sale.total.toFixed(2)}€</span>
            </div>
            {Object.entries(sale.payment_split).map(([method, amount]) => (
              <div key={method} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.3px', paddingLeft: '8px', gap: '3px' }}>
                <span>
                  {method === 'cash' ? 'Espèces' : 
                   method === 'card' ? 'Carte' : 
                   method === 'customer_credit' ? 'Crédit' :
                   method === 'mobile' ? 'Mobile' :
                   method === 'check' ? 'Chèque' : method}
                </span>
                <span style={{ whiteSpace: 'nowrap' }}>{amount.toFixed(2)}€</span>
              </div>
            ))}
          </>
        ) : (
          // Paiement simple
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', marginBottom: '2px', gap: '3px' }}>
            <span style={{ flex: '1', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {(sale.paymentMethod || sale.payment_method) === 'cash' ? 'ESPECES' : 
               (sale.paymentMethod || sale.payment_method) === 'card' ? 'CARTE' : 
               (sale.paymentMethod || sale.payment_method) === 'customer_credit' ? 'CRÉDIT' :
               'PAIEMENT'}
            </span>
            <span style={{ whiteSpace: 'nowrap' }}>{sale.total.toFixed(2)}€</span>
          </div>
        )}
        {(sale.paymentMethod || sale.payment_method) === 'cash' && (sale.amountPaid || sale.amount_paid) && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.3px', gap: '3px' }}>
              <span>Reçu</span>
              <span style={{ whiteSpace: 'nowrap' }}>{(sale.amountPaid || sale.amount_paid || 0).toFixed(2)}€</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.3px', fontWeight: '900', gap: '3px' }}>
              <span>Rendu</span>
              <span style={{ whiteSpace: 'nowrap' }}>{(sale.change || sale.change_amount || 0).toFixed(2)}€</span>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center" style={{ marginTop: '8px', fontWeight: '900' }}>
        <div style={{ fontSize: '14px', marginBottom: '4px' }}>
          MERCI DE VOTRE VISITE
        </div>
        <div style={{ fontSize: '8px', fontWeight: '600', marginTop: '6px', borderTop: '1px solid #ddd', paddingTop: '4px' }}>
          Document de vente - Conservation 10 ans (Art. 315bis CIR92)
        </div>
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

  // Commande ESC/POS pour ouvrir le tiroir-caisse: ESC p 0 25 250
  const cashDrawerCommand = String.fromCharCode(27, 112, 0, 25, 250);

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Ticket de caisse</title>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          @page {
            size: 80mm auto;
            margin: 0;
          }
          
          body {
            font-family: 'Courier New', monospace;
            font-size: 11px;
            line-height: 1.5;
            margin: 0;
            padding: 0;
            width: 80mm;
            max-width: 302px;
            background: white;
            color: black;
          }
          
          #thermal-receipt {
            width: 100%;
            padding: 8px;
            background: white;
            color: black;
          }
          
          .border-dashed {
            border-style: dashed !important;
          }
          
          .border-double {
            border-style: double !important;
          }
          
          .border-black {
            border-color: black !important;
          }
          
          .font-black {
            font-weight: 900 !important;
          }
          
          .font-bold {
            font-weight: 700 !important;
          }
          
          .font-semibold {
            font-weight: 600 !important;
          }
          
          .uppercase {
            text-transform: uppercase !important;
          }
          
          .tracking-wider {
            letter-spacing: 0.05em !important;
          }
          
          .tracking-wide {
            letter-spacing: 0.025em !important;
          }
          
          .text-center {
            text-align: center !important;
          }
          
          .mb-2 {
            margin-bottom: 0.5rem !important;
          }
          
          @media print {
            body {
              width: 80mm;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            #thermal-receipt {
              page-break-inside: avoid;
            }
            
            .text-center {
              text-align: center !important;
            }
          }
        </style>
      </head>
      <body>
        <pre style="font-family:monospace;font-size:1px;margin:0;padding:0;position:absolute;opacity:0;">${cashDrawerCommand}</pre>
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
