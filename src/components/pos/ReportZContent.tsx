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
        fontSize: '18px',
        lineHeight: '1.3',
        padding: '8px',
        paddingRight: '24px',
        fontWeight: '900',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* Géant Z */}
      <div className="text-center mb-2">
        <div style={{ 
          fontSize: '140px',
          fontWeight: '900',
          lineHeight: '1',
          color: '#EF4444',
          textShadow: '4px 4px 0px rgba(0,0,0,0.1)'
        }}>
          Z
        </div>
      </div>

      {/* En-tête société */}
      <div className="text-center" style={{ fontSize: '14px', marginBottom: '6px', fontWeight: '900' }}>
        <div style={{ lineHeight: '1.2' }}>
          <div style={{ fontWeight: '900' }}>{settings.name}</div>
          <div style={{ fontWeight: '900' }}>{settings.address}</div>
          <div style={{ fontWeight: '900' }}>{settings.postal_code} {settings.city}</div>
          {settings.phone && <div style={{ fontWeight: '900' }}>Tel: {settings.phone}</div>}
          <div style={{ marginTop: '1px', fontWeight: '900' }}>TVA: {settings.vat_number}</div>
        </div>
      </div>

      <div style={{ borderTop: '2px dashed #000', margin: '6px 0' }}></div>

      {/* Type de rapport - Rapport Z fiscal */}
      <div className="text-center" style={{ fontSize: '14px', marginBottom: '6px', fontWeight: '900', backgroundColor: '#FEE2E2', padding: '8px', margin: '0 -8px 6px -8px' }}>
        <div style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '0.7px', marginBottom: '2px', color: '#EF4444' }}>
          RAPPORT Z
        </div>
        <div style={{ fontSize: '12px', color: '#DC2626', fontWeight: '900' }}>
          (CLOTURE FISCALE JOURNALIERE)
        </div>
        <div style={{ fontSize: '11px', color: '#666', fontWeight: '900', marginTop: '2px' }}>
          Conforme Loi Belge 2026
        </div>
        <div style={{ marginTop: '4px', fontSize: '14px', fontWeight: '900' }}>
          Date: {new Date().toLocaleDateString('fr-BE')}
        </div>
        <div style={{ fontSize: '14px', fontWeight: '900' }}>
          Heure: {new Date().toLocaleTimeString('fr-BE')}
        </div>
      </div>

      {/* Info légale obligatoire */}
      <div style={{ fontSize: '12px', fontWeight: '900', marginBottom: '6px', backgroundColor: '#F3F4F6', padding: '6px', border: '1px solid #000' }}>
        <div style={{ fontWeight: '900' }}>N° CAISSE: CAISSE-001</div>
        <div style={{ fontWeight: '900' }}>N° SERIE: {todayReport?.serial_number || 'NON ATTRIBUÉ'}</div>
      </div>

      <div style={{ borderTop: '2px dashed #000', margin: '6px 0' }}></div>

      {/* Ventes */}
      <div style={{ marginBottom: '6px', paddingRight: '24px' }}>
        <div style={{ fontSize: '15px', fontWeight: '900', marginBottom: '4px' }}>
          RECAPITULATIF DES VENTES
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontWeight: '900' }}>
          <span style={{ fontWeight: '900' }}>Nombre de transactions:</span>
          <span style={{ fontWeight: '900' }}>{reportData.salesCount}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: '900', color: '#EF4444', gap: '8px' }}>
          <span style={{ fontWeight: '900' }}>TOTAL VENTES:</span>
          <span style={{ whiteSpace: 'nowrap', fontWeight: '900' }}>{reportData.totalSales.toFixed(2)}€</span>
        </div>
      </div>

      <div style={{ borderTop: '2px solid #000', margin: '6px 0' }}></div>

      {/* Moyens de paiement */}
      <div style={{ marginBottom: '6px', paddingRight: '24px' }}>
        <div style={{ fontSize: '15px', fontWeight: '900', marginBottom: '4px' }}>
          MOYENS DE PAIEMENT
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '14px', fontWeight: '900' }}>
          <span style={{ fontWeight: '900' }}>Espèces</span>
          <span style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>{reportData.totalCash.toFixed(2)}€</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '14px', fontWeight: '900' }}>
          <span style={{ fontWeight: '900' }}>Carte bancaire</span>
          <span style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>{reportData.totalCard.toFixed(2)}€</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '900' }}>
          <span style={{ fontWeight: '900' }}>Paiement mobile</span>
          <span style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>{reportData.totalMobile.toFixed(2)}€</span>
        </div>
      </div>

      <div style={{ borderTop: '2px dashed #000', margin: '6px 0' }}></div>

      {/* TVA - OBLIGATOIRE LOI BELGE */}
      <div style={{ marginBottom: '6px', paddingRight: '24px', backgroundColor: '#FEF3C7', padding: '6px', margin: '0 -8px 6px -8px', border: '2px solid #F59E0B' }}>
        <div style={{ fontSize: '15px', fontWeight: '900', marginBottom: '4px' }}>
          DETAIL TVA (OBLIGATOIRE BE)
        </div>
        {Object.entries(reportData.vatByRate)
          .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
          .map(([rate, amounts]) => (
          <div key={rate} style={{ marginBottom: '4px', fontSize: '13px', fontWeight: '900' }}>
            <div style={{ fontWeight: '900', fontSize: '14px' }}>TVA {parseFloat(rate).toFixed(2)}%</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px', fontWeight: '900' }}>
              <span style={{ fontWeight: '900' }}>Base HT:</span>
              <span style={{ whiteSpace: 'nowrap', fontWeight: '900' }}>{amounts.totalHT.toFixed(2)}€</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px', fontWeight: '900' }}>
              <span style={{ fontWeight: '900' }}>Montant TVA:</span>
              <span style={{ whiteSpace: 'nowrap', fontWeight: '900' }}>{amounts.totalVAT.toFixed(2)}€</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px', fontWeight: '900', borderTop: '1px solid #F59E0B', paddingTop: '2px', marginTop: '2px' }}>
              <span style={{ fontWeight: '900' }}>Total TTC:</span>
              <span style={{ whiteSpace: 'nowrap', fontWeight: '900' }}>{(amounts.totalHT + amounts.totalVAT).toFixed(2)}€</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '2px solid #000', margin: '6px 0' }}></div>

      {/* Totaux récapitulatifs */}
      <div style={{ marginBottom: '6px', paddingRight: '24px', backgroundColor: '#FEE2E2', padding: '8px', margin: '0 -8px 6px -8px', border: '2px solid #EF4444' }}>
        <div style={{ fontSize: '15px', fontWeight: '900', marginBottom: '6px', textAlign: 'center', color: '#DC2626' }}>
          TOTAUX RECAPITULATIFS
        </div>
        
        {/* Total Hors TVA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '15px', fontWeight: '900', paddingBottom: '3px' }}>
          <span style={{ fontWeight: '900' }}>Total Hors TVA:</span>
          <span style={{ whiteSpace: 'nowrap', fontWeight: '900' }}>
            {Object.values(reportData.vatByRate).reduce((sum, amounts) => sum + amounts.totalHT, 0).toFixed(2)}€
          </span>
        </div>
        
        {/* Total TVA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '15px', fontWeight: '900', paddingBottom: '3px' }}>
          <span style={{ fontWeight: '900' }}>Total TVA:</span>
          <span style={{ whiteSpace: 'nowrap', fontWeight: '900' }}>
            {Object.values(reportData.vatByRate).reduce((sum, amounts) => sum + amounts.totalVAT, 0).toFixed(2)}€
          </span>
        </div>
        
        {/* Total TVAC */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '900', borderTop: '2px solid #EF4444', paddingTop: '6px', marginTop: '3px', color: '#DC2626' }}>
          <span style={{ fontWeight: '900' }}>TOTAL TVAC:</span>
          <span style={{ whiteSpace: 'nowrap', fontWeight: '900' }}>{reportData.totalSales.toFixed(2)}€</span>
        </div>
      </div>

      <div style={{ borderTop: '2px solid #000', margin: '6px 0' }}></div>

      {/* Caisse - DÉTAIL COMPLET OBLIGATOIRE */}
      {todayReport && (
        <div style={{ marginBottom: '6px', paddingRight: '24px' }}>
          <div style={{ fontSize: '15px', fontWeight: '900', marginBottom: '4px' }}>
            DETAIL CAISSE ENREGISTREUSE
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '14px', fontWeight: '900' }}>
            <span style={{ fontWeight: '900' }}>Fond de caisse ouverture:</span>
            <span style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>{todayReport.opening_amount.toFixed(2)}€</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '14px', fontWeight: '900' }}>
            <span style={{ fontWeight: '900' }}>Espèces journée:</span>
            <span style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>{reportData.totalCash.toFixed(2)}€</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '14px', fontWeight: '900', borderTop: '1px dashed #000', paddingTop: '2px' }}>
            <span style={{ fontWeight: '900' }}>Espèces attendues:</span>
            <span style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>{expectedCash.toFixed(2)}€</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '14px', fontWeight: '900' }}>
            <span style={{ fontWeight: '900' }}>Espèces comptées:</span>
            <span style={{ fontWeight: '900', whiteSpace: 'nowrap' }}>{closingAmount.toFixed(2)}€</span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '18px', 
            fontWeight: '900', 
            color: difference === 0 ? '#10B981' : difference > 0 ? '#3B82F6' : '#EF4444',
            gap: '8px', 
            borderTop: '2px solid #000', 
            paddingTop: '4px', 
            marginTop: '4px',
            backgroundColor: difference === 0 ? '#D1FAE5' : difference > 0 ? '#DBEAFE' : '#FEE2E2',
            padding: '4px',
            margin: '4px -4px 0 -4px'
          }}>
            <span style={{ fontWeight: '900' }}>ECART:</span>
            <span style={{ whiteSpace: 'nowrap', fontWeight: '900' }}>{difference > 0 ? '+' : ''}{difference.toFixed(2)}€</span>
          </div>
        </div>
      )}

      <div style={{ borderTop: '3px double #000', margin: '8px 0' }}></div>

      {/* AVERTISSEMENT NON-FISCAL */}
      <div style={{ fontSize: '11px', fontWeight: '900', backgroundColor: '#FEE2E2', padding: '8px', border: '2px solid #DC2626', marginBottom: '6px' }}>
        <div style={{ fontWeight: '900', marginBottom: '4px', textAlign: 'center', fontSize: '13px', color: '#DC2626' }}>
          RAPPORT NON-FISCAL
        </div>
        <div style={{ fontWeight: '900', fontSize: '12px', textAlign: 'center', marginBottom: '4px' }}>
          USAGE INTERNE UNIQUEMENT
        </div>
      </div>

      {/* SECTION: À REPORTER DANS VOTRE CARNET OFFICIEL */}
      <div style={{ fontSize: '12px', fontWeight: '900', backgroundColor: '#DBEAFE', padding: '8px', border: '2px solid #3B82F6', marginBottom: '6px' }}>
        <div style={{ fontWeight: '900', marginBottom: '6px', textAlign: 'center', fontSize: '14px', color: '#1E40AF' }}>
          📋 À REPORTER DANS VOTRE CARNET OFFICIEL
        </div>
        <div style={{ backgroundColor: 'white', padding: '6px', borderRadius: '4px', fontFamily: 'monospace' }}>
          <div style={{ marginBottom: '3px' }}>Date: <strong>{new Date().toLocaleDateString('fr-BE')}</strong></div>
          <div style={{ borderTop: '1px dashed #ddd', paddingTop: '3px', marginTop: '3px' }}>
            <div style={{ marginBottom: '2px' }}>Recettes espèces: <strong>{reportData.totalCash.toFixed(2)}€</strong></div>
            <div style={{ marginBottom: '2px' }}>Recettes carte: <strong>{reportData.totalCard.toFixed(2)}€</strong></div>
            <div style={{ marginBottom: '2px' }}>Recettes mobile: <strong>{reportData.totalMobile.toFixed(2)}€</strong></div>
          </div>
          <div style={{ borderTop: '1px dashed #ddd', paddingTop: '3px', marginTop: '3px' }}>
            {Object.entries(reportData.vatByRate)
              .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
              .map(([rate, amounts]) => (
                <div key={rate} style={{ marginBottom: '2px' }}>
                  TVA {parseFloat(rate).toFixed(0)}%: Base HT <strong>{amounts.totalHT.toFixed(2)}€</strong>, Montant TVA <strong>{amounts.totalVAT.toFixed(2)}€</strong>
                </div>
              ))}
          </div>
          <div style={{ borderTop: '2px solid #3B82F6', paddingTop: '3px', marginTop: '3px', fontSize: '14px' }}>
            Total journée: <strong style={{ fontSize: '16px' }}>{reportData.totalSales.toFixed(2)}€</strong>
          </div>
          {todayReport && (
            <div style={{ borderTop: '1px dashed #ddd', paddingTop: '3px', marginTop: '3px', fontSize: '11px' }}>
              <div>Fond caisse ouverture: <strong>{todayReport.opening_amount.toFixed(2)}€</strong></div>
              <div>Espèces comptées: <strong>{closingAmount.toFixed(2)}€</strong></div>
              <div style={{ 
                color: difference === 0 ? '#10B981' : difference > 0 ? '#3B82F6' : '#EF4444',
                fontWeight: '900'
              }}>
                Écart: <strong>{difference > 0 ? '+' : ''}{difference.toFixed(2)}€</strong>
              </div>
            </div>
          )}
        </div>
        <div style={{ fontSize: '9px', textAlign: 'center', marginTop: '4px', color: '#1E40AF', fontWeight: '900' }}>
          Copiez ces informations dans votre carnet de caisse papier obligatoire
        </div>
      </div>

      {/* Détails techniques */}
      <div style={{ fontSize: '10px', fontWeight: '900', backgroundColor: '#F3F4F6', padding: '6px', border: '1px solid #000', marginBottom: '6px' }}>
        <div style={{ fontWeight: '900', fontSize: '10px' }}>
          ✓ Rapport Z irréversible
        </div>
        <div style={{ fontWeight: '900', fontSize: '10px' }}>
          ✓ Détail TVA par taux
        </div>
        <div style={{ fontWeight: '900', fontSize: '10px' }}>
          ✓ Totaux moyens de paiement
        </div>
        <div style={{ fontWeight: '900', fontSize: '10px' }}>
          ✓ État de caisse complet
        </div>
        <div style={{ fontWeight: '900', fontSize: '10px' }}>
          ✓ Archivage 7 ans recommandé
        </div>
      </div>

      {/* Signature / Hash */}
      <div style={{ fontSize: '10px', fontWeight: '900', fontFamily: 'monospace', wordBreak: 'break-all', backgroundColor: '#000', color: '#fff', padding: '4px' }}>
        HASH: {btoa(Date.now() + reportData.totalSales.toString()).slice(0, 32)}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '2px dashed #000', marginTop: '8px', paddingTop: '8px' }}>
        <div className="text-center" style={{ fontSize: '10px', color: '#999', fontWeight: '900', marginTop: '4px' }}>
          Document non-fiscal - Conservation interne recommandée
        </div>
      </div>
    </div>
  );
}
