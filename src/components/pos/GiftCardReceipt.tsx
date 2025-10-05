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
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Playfair+Display:wght@400;700&family=Lato:wght@300;400;700&display=swap');
        
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
          font-family: 'Lato', sans-serif;
          width: 80mm;
          margin: 0 auto;
          padding: 8mm 4mm;
          background: white;
        }

        .card-container {
          background: white;
          padding: 0;
        }

        .header {
          text-align: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px dashed #333;
        }

        .gift-icon {
          font-size: 48px;
          margin-bottom: 5px;
        }

        .company-name {
          font-family: 'Playfair Display', serif;
          font-size: 16px;
          font-weight: 700;
          color: #333;
          margin-bottom: 3px;
        }

        .title {
          font-family: 'Dancing Script', cursive;
          font-size: 24px;
          color: #000;
          margin: 8px 0;
        }

        .amount-section {
          text-align: center;
          background: #f5f5f5;
          padding: 15px;
          border-radius: 8px;
          margin: 12px 0;
        }

        .amount-label {
          font-size: 11px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 5px;
        }

        .amount {
          font-family: 'Playfair Display', serif;
          font-size: 36px;
          font-weight: 700;
          color: #000;
        }

        .card-info {
          background: #f9f9f9;
          padding: 12px;
          border-radius: 6px;
          margin: 12px 0;
          border-left: 3px solid #333;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 6px 0;
          font-size: 10pt;
          color: #333;
        }

        .info-label {
          font-weight: 600;
          color: #666;
        }

        .card-number {
          text-align: center;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          font-weight: 700;
          color: #000;
          background: #fff;
          padding: 10px;
          border-radius: 6px;
          margin: 12px 0;
          border: 2px dashed #333;
          letter-spacing: 2px;
        }

        .sender-section {
          background: #f9f9f9;
          padding: 12px;
          border-radius: 6px;
          margin: 12px 0;
          border-left: 3px solid #000;
        }

        .sender-label {
          font-size: 9px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 5px;
          font-weight: 600;
        }

        .sender-name {
          font-family: 'Dancing Script', cursive;
          font-size: 18px;
          color: #000;
          margin-bottom: 8px;
        }

        .message {
          font-family: 'Lato', sans-serif;
          font-size: 10pt;
          color: #333;
          line-height: 1.4;
          font-style: italic;
        }

        .footer {
          text-align: center;
          margin-top: 15px;
          padding-top: 12px;
          border-top: 2px dashed #333;
        }

        .footer-text {
          font-size: 9px;
          color: #666;
          line-height: 1.4;
        }

        .divider {
          border-top: 1px dashed #ccc;
          margin: 8px 0;
        }

        @media print {
          body {
            padding: 4mm;
          }
        }
      </style>
    </head>
    <body>
      <div class="card-container">
        <div class="header">
          <div class="gift-icon">🎁</div>
          <div class="company-name">${COMPANY_INFO.name}</div>
          <div class="title">Carte Cadeau</div>
        </div>

        <div class="divider"></div>

        <div class="amount-section">
          <div class="amount-label">Solde Actuel</div>
          <div class="amount">${card.current_balance.toFixed(2)}€</div>
        </div>

        <div class="card-number">
          ${card.card_number}
        </div>

        <div class="card-info">
          <div class="info-row">
            <span class="info-label">Date émission:</span>
            <span>${currentDate}</span>
          </div>
          <div class="divider"></div>
          <div class="info-row">
            <span class="info-label">Valeur initiale:</span>
            <span>${card.initial_balance.toFixed(2)}€</span>
          </div>
        </div>

        ${senderName || message ? `
          <div class="sender-section">
            ${senderName ? `
              <div class="sender-label">Offert par</div>
              <div class="sender-name">${senderName}</div>
            ` : ''}
            ${message ? `
              <div class="message">"${message}"</div>
            ` : ''}
          </div>
        ` : ''}

        <div class="footer">
          <div class="footer-text">
            <strong>Conservez cette carte</strong><br>
            Valable jusqu'à épuisement du solde<br>
            <br>
            ${COMPANY_INFO.name}<br>
            ${COMPANY_INFO.address}<br>
            ${COMPANY_INFO.postalCode} ${COMPANY_INFO.city}
          </div>
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
