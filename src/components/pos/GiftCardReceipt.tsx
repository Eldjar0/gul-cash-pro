import React from 'react';
import { COMPANY_INFO } from '@/data/company';

interface GiftCard {
  id: string;
  card_number: string;
  current_balance: number;
  initial_balance: number;
  issued_date: string;
}

export const printGiftCardReceipt = (
  card: GiftCard,
  senderName?: string,
  message?: string,
  onAfterPrint?: () => void
) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Impossible d\'ouvrir la fenêtre d\'impression');
    return;
  }

  const currentDate = new Date(card.issued_date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Carte Cadeau - ${card.card_number}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@400;600;700;800;900&display=swap');
        
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
          font-family: 'Barlow Semi Condensed', 'Arial Narrow', Arial, sans-serif;
          width: 80mm;
          max-width: 302px;
          margin: 0 auto;
          padding: 8px;
          padding-right: 24px;
          background: white;
          font-size: 16.4px;
          line-height: 1.3;
          font-weight: 900;
          overflow: hidden;
        }

        .header {
          text-align: center;
          margin-bottom: 6px;
        }

        .gift-icon {
          font-size: 48px;
          margin-bottom: 4px;
        }

        .company-name {
          font-size: 12.3px;
          font-weight: 900;
          line-height: 1.2;
          margin-bottom: 2px;
        }

        .title {
          font-size: 16.4px;
          font-weight: 900;
          margin: 6px 0;
        }

        .divider {
          border-top: 1.4px dashed #000;
          margin: 6px 0;
        }

        .amount-section {
          text-align: center;
          background: #f5f5f5;
          padding: 12px 8px;
          margin: 6px 0;
        }

        .amount-label {
          font-size: 12.3px;
          font-weight: 900;
          margin-bottom: 4px;
        }

        .amount {
          font-size: 24px;
          font-weight: 900;
        }

        .card-info {
          font-size: 12.3px;
          font-weight: 900;
          margin: 6px 0;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
        }

        .card-number {
          text-align: center;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          font-weight: 900;
          background: #f5f5f5;
          padding: 8px;
          margin: 6px 0;
          letter-spacing: 2px;
        }

        .sender-section {
          background: #f9f9f9;
          padding: 8px;
          margin: 6px 0;
          font-size: 12.3px;
        }

        .sender-label {
          font-size: 10.9px;
          font-weight: 900;
          margin-bottom: 4px;
        }

        .sender-name {
          font-size: 14px;
          font-weight: 900;
          margin-bottom: 6px;
        }

        .message {
          font-size: 12.3px;
          font-weight: 600;
          line-height: 1.3;
          font-style: italic;
        }

        .footer {
          text-align: center;
          margin-top: 8px;
          padding-top: 6px;
          border-top: 1.4px dashed #000;
        }

        .footer-text {
          font-size: 10.9px;
          font-weight: 900;
          line-height: 1.3;
        }

        @media print {
          body {
            padding: 8px;
            padding-right: 24px;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="gift-icon">🎁</div>
        <div class="company-name">${COMPANY_INFO.name}</div>
        <div class="title">CARTE CADEAU</div>
      </div>

      <div class="divider"></div>

      <div class="amount-section">
        <div class="amount-label">SOLDE ACTUEL</div>
        <div class="amount">${card.current_balance.toFixed(2)} €</div>
      </div>

      <div class="card-number">
        ${card.card_number}
      </div>

      <div class="card-info">
        <div class="info-row">
          <span>DATE EMISSION:</span>
          <span>${currentDate}</span>
        </div>
        <div class="divider"></div>
        <div class="info-row">
          <span>VALEUR INITIALE:</span>
          <span>${card.initial_balance.toFixed(2)} €</span>
        </div>
      </div>

      ${senderName || message ? `
        <div class="divider"></div>
        <div class="sender-section">
          ${senderName ? `
            <div class="sender-label">OFFERT PAR</div>
            <div class="sender-name">${senderName}</div>
          ` : ''}
          ${message ? `
            <div class="message">"${message}"</div>
          ` : ''}
        </div>
      ` : ''}

      <div class="footer">
        <div class="footer-text">
          CONSERVEZ CETTE CARTE<br>
          VALABLE JUSQU'A EPUISEMENT<br>
          <br>
          ${COMPANY_INFO.address}<br>
          ${COMPANY_INFO.postalCode} ${COMPANY_INFO.city}
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            ${onAfterPrint ? `
            setTimeout(function() {
              window.opener.postMessage('giftcard_printed', '*');
              window.close();
            }, 1000);
            ` : ''}
          }, 500);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  
  // Écouter le message de confirmation d'impression
  if (onAfterPrint) {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'giftcard_printed') {
        window.removeEventListener('message', handleMessage);
        onAfterPrint();
      }
    };
    window.addEventListener('message', handleMessage);
  }
};
