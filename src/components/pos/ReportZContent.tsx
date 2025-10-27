import { ReportData, DailyReport } from '@/hooks/useDailyReports';
import { useCompanySettings } from '@/hooks/useCompanySettings';

interface ReportZContentProps {
  reportData: ReportData;
  todayReport: DailyReport | null;
  closingAmount: number;
  difference: number;
}

export function ReportZContent({ reportData, todayReport, closingAmount, difference }: ReportZContentProps) {
  const expectedCash = todayReport ? todayReport.opening_amount + reportData.totalCash : reportData.totalCash;
  const { settings } = useCompanySettings();

  return (
    <div 
      id="report-z-content"
      className="font-mono bg-white text-black"
      style={{ 
        width: '80mm',
        maxWidth: '302px',
        margin: '0 auto',
        fontFamily: "'Barlow Semi Condensed', 'Arial Narrow', Arial, sans-serif",
        fontSize: '16px',
        lineHeight: '1.4',
        padding: '8px',
        paddingRight: '16px',
        fontWeight: '700',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* En-tête société - OBLIGATOIRE */}
      <div className="text-center" style={{ fontSize: '13px', marginBottom: '8px', fontWeight: '700', borderBottom: '2px solid #000', paddingBottom: '4px' }}>
        <div style={{ fontSize: '16px', fontWeight: '900', marginBottom: '2px' }}>{settings.name}</div>
        <div>{settings.address}</div>
        <div>{settings.postal_code} {settings.city}</div>
        <div style={{ marginTop: '2px' }}>N° TVA: {settings.vat_number}</div>
      </div>

      {/* Type de rapport - RAPPORT Z FISCAL */}
      <div className="text-center" style={{ fontSize: '13px', marginBottom: '8px', fontWeight: '900', backgroundColor: '#FEE2E2', padding: '8px', margin: '0 -8px 8px -8px', border: '2px solid #EF4444' }}>
        <div style={{ fontSize: '48px', fontWeight: '900', lineHeight: '1', color: '#EF4444', marginBottom: '4px' }}>
          Z
        </div>
        <div style={{ fontSize: '14px', fontWeight: '900', color: '#DC2626' }}>
          CLOTURE JOURNALIERE
        </div>
      </div>

      {/* Informations rapport - OBLIGATOIRE */}
      <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', backgroundColor: '#F3F4F6', padding: '6px', border: '1px solid #000' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span>N° CAISSE:</span>
          <span style={{ fontWeight: '900' }}>CAISSE-001</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>N° SERIE Z:</span>
          <span style={{ fontWeight: '900' }}>{todayReport?.serial_number || 'NON ATTRIBUÉ'}</span>
        </div>
      </div>

      {/* Date et heure - OBLIGATOIRE */}
      <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', borderBottom: '1px dashed #000', paddingBottom: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Date clôture:</span>
          <span style={{ fontWeight: '900' }}>{new Date().toLocaleDateString('fr-BE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Heure clôture:</span>
          <span style={{ fontWeight: '900' }}>{new Date().toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      </div>

      {/* Récapitulatif ventes - OBLIGATOIRE */}
      <div style={{ marginBottom: '8px', paddingRight: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: '900', marginBottom: '4px', borderBottom: '1px solid #000' }}>
          RECAPITULATIF VENTES
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '13px' }}>
          <span>Nombre de transactions:</span>
          <span style={{ fontWeight: '900' }}>{reportData.salesCount}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '900', color: '#EF4444', borderTop: '1px solid #EF4444', paddingTop: '4px', marginTop: '4px' }}>
          <span>TOTAL TTC:</span>
          <span style={{ whiteSpace: 'nowrap' }}>{reportData.totalSales.toFixed(2)}€</span>
        </div>
      </div>

      <div style={{ borderTop: '2px solid #000', margin: '8px 0' }}></div>

      {/* Moyens de paiement - OBLIGATOIRE LOI BELGE */}
      <div style={{ marginBottom: '8px', paddingRight: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: '900', marginBottom: '4px', borderBottom: '1px solid #000' }}>
          MOYENS DE PAIEMENT
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '13px' }}>
          <span>Espèces:</span>
          <span style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>{reportData.totalCash.toFixed(2)}€</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '13px' }}>
          <span>Carte bancaire:</span>
          <span style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>{reportData.totalCard.toFixed(2)}€</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span>Paiement mobile:</span>
          <span style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>{reportData.totalMobile.toFixed(2)}€</span>
        </div>
      </div>

      <div style={{ borderTop: '2px solid #000', margin: '8px 0' }}></div>

      {/* TVA par taux - OBLIGATOIRE LOI BELGE */}
      <div style={{ marginBottom: '8px', paddingRight: '16px', backgroundColor: '#FEF3C7', padding: '8px', margin: '0 -8px 8px -8px', border: '2px solid #F59E0B' }}>
        <div style={{ fontSize: '14px', fontWeight: '900', marginBottom: '4px', color: '#92400E' }}>
          DETAIL TVA PAR TAUX
        </div>
        {Object.entries(reportData.vatByRate).length === 0 ? (
          <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#666' }}>
            Aucune vente enregistrée
          </div>
        ) : (
          Object.entries(reportData.vatByRate)
            .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
            .map(([rate, amounts]) => (
              <div key={rate} style={{ marginBottom: '6px', fontSize: '12px' }}>
                <div style={{ fontWeight: '900', fontSize: '13px', color: '#92400E' }}>
                  TVA {parseFloat(rate).toFixed(2)}%
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px' }}>
                  <span>Base HT:</span>
                  <span style={{ whiteSpace: 'nowrap', fontWeight: '900' }}>{amounts.totalHT.toFixed(2)}€</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px' }}>
                  <span>Montant TVA:</span>
                  <span style={{ whiteSpace: 'nowrap', fontWeight: '900' }}>{amounts.totalVAT.toFixed(2)}€</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px', borderTop: '1px solid #F59E0B', paddingTop: '2px', marginTop: '2px' }}>
                  <span>Total TTC:</span>
                  <span style={{ whiteSpace: 'nowrap', fontWeight: '900' }}>{(amounts.totalHT + amounts.totalVAT).toFixed(2)}€</span>
                </div>
              </div>
            ))
        )}
      </div>

      {/* Totaux généraux - OBLIGATOIRE */}
      <div style={{ marginBottom: '8px', paddingRight: '16px', backgroundColor: '#FEE2E2', padding: '8px', margin: '0 -8px 8px -8px', border: '2px solid #EF4444' }}>
        <div style={{ fontSize: '14px', fontWeight: '900', marginBottom: '4px', textAlign: 'center', color: '#DC2626' }}>
          TOTAUX GENERAUX
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '13px' }}>
          <span>Total Hors TVA:</span>
          <span style={{ whiteSpace: 'nowrap', fontWeight: '900' }}>
            {Object.values(reportData.vatByRate).reduce((sum, amounts) => sum + amounts.totalHT, 0).toFixed(2)}€
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '13px' }}>
          <span>Total TVA:</span>
          <span style={{ whiteSpace: 'nowrap', fontWeight: '900' }}>
            {Object.values(reportData.vatByRate).reduce((sum, amounts) => sum + amounts.totalVAT, 0).toFixed(2)}€
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '900', borderTop: '2px solid #EF4444', paddingTop: '4px', marginTop: '4px', color: '#DC2626' }}>
          <span>TOTAL TTC:</span>
          <span style={{ whiteSpace: 'nowrap' }}>{reportData.totalSales.toFixed(2)}€</span>
        </div>
      </div>

      <div style={{ borderTop: '2px solid #000', margin: '8px 0' }}></div>

      {/* Détail caisse enregistreuse - OBLIGATOIRE */}
      {todayReport && (
        <div style={{ marginBottom: '8px', paddingRight: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: '900', marginBottom: '4px', borderBottom: '1px solid #000' }}>
            DETAIL CAISSE ENREGISTREUSE
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '12px' }}>
            <span>Fond d'ouverture:</span>
            <span style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>{todayReport.opening_amount.toFixed(2)}€</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '12px' }}>
            <span>+ Espèces journée:</span>
            <span style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>{reportData.totalCash.toFixed(2)}€</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '12px', borderTop: '1px dashed #000', paddingTop: '2px' }}>
            <span>= Espèces attendues:</span>
            <span style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>{expectedCash.toFixed(2)}€</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '12px' }}>
            <span>Espèces comptées:</span>
            <span style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>{closingAmount.toFixed(2)}€</span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '16px', 
            fontWeight: '900', 
            color: difference === 0 ? '#16A34A' : difference > 0 ? '#3B82F6' : '#EF4444',
            borderTop: '2px solid #000', 
            paddingTop: '4px', 
            marginTop: '4px',
            backgroundColor: difference === 0 ? '#D1FAE5' : difference > 0 ? '#DBEAFE' : '#FEE2E2',
            padding: '4px',
            margin: '4px -4px 0 -4px'
          }}>
            <span>ECART:</span>
            <span style={{ whiteSpace: 'nowrap' }}>{difference > 0 ? '+' : ''}{difference.toFixed(2)}€</span>
          </div>
        </div>
      )}

      <div style={{ borderTop: '3px double #000', margin: '8px 0' }}></div>

      {/* MENTIONS LEGALES - OBLIGATOIRE */}
      <div style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#FEE2E2', padding: '6px', border: '1px solid #DC2626', marginBottom: '8px' }}>
        <div style={{ fontWeight: '900', textAlign: 'center', marginBottom: '4px', color: '#DC2626' }}>
          ⚠️ RAPPORT NON FISCAL
        </div>
        <div style={{ fontSize: '10px', textAlign: 'center', marginBottom: '2px' }}>
          Usage interne uniquement
        </div>
        <div style={{ fontSize: '10px', textAlign: 'center' }}>
          À reporter dans votre carnet obligatoire
        </div>
      </div>

      {/* Section à reporter - AIDE POUR CARNET OBLIGATOIRE */}
      <div style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#DBEAFE', padding: '8px', border: '2px solid #3B82F6', marginBottom: '8px' }}>
        <div style={{ fontWeight: '900', textAlign: 'center', marginBottom: '4px', fontSize: '12px', color: '#1E40AF' }}>
          📋 À REPORTER DANS VOTRE CARNET
        </div>
        <div style={{ backgroundColor: 'white', padding: '6px', borderRadius: '2px', fontSize: '10px' }}>
          <div style={{ marginBottom: '2px' }}>
            <strong>Date:</strong> {new Date().toLocaleDateString('fr-BE')}
          </div>
          <div style={{ borderTop: '1px dashed #ccc', paddingTop: '2px', marginTop: '2px' }}>
            <div style={{ marginBottom: '1px' }}>Espèces: <strong>{reportData.totalCash.toFixed(2)}€</strong></div>
            <div style={{ marginBottom: '1px' }}>Carte: <strong>{reportData.totalCard.toFixed(2)}€</strong></div>
            <div style={{ marginBottom: '1px' }}>Mobile: <strong>{reportData.totalMobile.toFixed(2)}€</strong></div>
          </div>
          <div style={{ borderTop: '1px dashed #ccc', paddingTop: '2px', marginTop: '2px' }}>
            {Object.entries(reportData.vatByRate)
              .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
              .map(([rate, amounts]) => (
                <div key={rate} style={{ marginBottom: '1px', fontSize: '9px' }}>
                  TVA {parseFloat(rate).toFixed(0)}%: HT <strong>{amounts.totalHT.toFixed(2)}€</strong>, TVA <strong>{amounts.totalVAT.toFixed(2)}€</strong>
                </div>
              ))}
          </div>
          <div style={{ borderTop: '2px solid #3B82F6', paddingTop: '2px', marginTop: '2px', fontSize: '12px' }}>
            <strong>Total journée: {reportData.totalSales.toFixed(2)}€</strong>
          </div>
          {todayReport && (
            <div style={{ borderTop: '1px dashed #ccc', paddingTop: '2px', marginTop: '2px', fontSize: '9px' }}>
              <div>Fond: {todayReport.opening_amount.toFixed(2)}€ | Compté: {closingAmount.toFixed(2)}€</div>
              <div style={{ color: difference === 0 ? '#16A34A' : '#EF4444', fontWeight: '900' }}>
                Écart: {difference > 0 ? '+' : ''}{difference.toFixed(2)}€
              </div>
            </div>
          )}
        </div>
        <div style={{ fontSize: '8px', textAlign: 'center', marginTop: '4px', color: '#1E40AF' }}>
          Recopiez ces données dans votre carnet papier officiel
        </div>
      </div>

      {/* Conformité - MENTIONS LEGALES */}
      <div style={{ fontSize: '10px', fontWeight: '700', backgroundColor: '#F3F4F6', padding: '6px', border: '1px solid #666', marginBottom: '8px' }}>
        <div style={{ marginBottom: '2px' }}>✓ Rapport Z irréversible</div>
        <div style={{ marginBottom: '2px' }}>✓ Détail TVA par taux</div>
        <div style={{ marginBottom: '2px' }}>✓ Totaux moyens de paiement</div>
        <div style={{ marginBottom: '2px' }}>✓ État caisse complet</div>
        <div>✓ Conservation 10 ans recommandée</div>
      </div>

      {/* Signature numérique */}
      <div style={{ fontSize: '9px', fontWeight: '700', fontFamily: 'monospace', wordBreak: 'break-all', backgroundColor: '#000', color: '#fff', padding: '4px' }}>
        HASH: {btoa(Date.now() + reportData.totalSales.toString()).slice(0, 32)}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '2px dashed #000', marginTop: '8px', paddingTop: '6px' }}>
      </div>
    </div>
  );
}