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
  message?: string
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
          padding: 10mm 5mm;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .card-container {
          background: white;
          border-radius: 15px;
          padding: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          position: relative;
          overflow: hidden;
        }

        .card-container::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%);
          pointer-events: none;
        }

        .header {
          text-align: center;
          margin-bottom: 20px;
          position: relative;
        }

        .gift-icon {
          font-size: 60px;
          margin-bottom: 10px;
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .company-name {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 700;
          color: #667eea;
          margin-bottom: 5px;
        }

        .title {
          font-family: 'Dancing Script', cursive;
          font-size: 32px;
          color: #764ba2;
          margin: 15px 0;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        }

        .divider {
          height: 2px;
          background: linear-gradient(to right, transparent, #667eea, transparent);
          margin: 15px 0;
        }

        .amount-section {
          text-align: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          border-radius: 10px;
          margin: 20px 0;
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        .amount-label {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 5px;
        }

        .amount {
          font-family: 'Playfair Display', serif;
          font-size: 48px;
          font-weight: 700;
          color: white;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
        }

        .card-info {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
          border-left: 4px solid #667eea;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
          font-size: 12px;
          color: #333;
        }

        .info-label {
          font-weight: 600;
          color: #667eea;
        }

        .card-number {
          text-align: center;
          font-family: 'Courier New', monospace;
          font-size: 16px;
          font-weight: 700;
          color: #333;
          background: #fff3cd;
          padding: 12px;
          border-radius: 8px;
          margin: 15px 0;
          border: 2px dashed #764ba2;
          letter-spacing: 2px;
        }

        .sender-section {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
          border: 1px solid rgba(102, 126, 234, 0.2);
        }

        .sender-label {
          font-size: 11px;
          color: #667eea;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 5px;
          font-weight: 600;
        }

        .sender-name {
          font-family: 'Dancing Script', cursive;
          font-size: 20px;
          color: #764ba2;
          margin-bottom: 10px;
        }

        .message {
          font-family: 'Lato', sans-serif;
          font-size: 13px;
          color: #333;
          line-height: 1.6;
          font-style: italic;
          padding: 10px;
          background: white;
          border-radius: 5px;
          margin-top: 10px;
        }

        .footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 2px dashed rgba(102, 126, 234, 0.3);
        }

        .footer-text {
          font-size: 11px;
          color: #666;
          line-height: 1.5;
        }

        .decorative-element {
          text-align: center;
          font-size: 24px;
          color: rgba(102, 126, 234, 0.3);
          margin: 10px 0;
        }

        @media print {
          body {
            padding: 5mm;
          }
          
          .card-container {
            page-break-inside: avoid;
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
          <div class="amount-label">Valeur</div>
          <div class="amount">${card.current_balance.toFixed(2)}€</div>
        </div>

        <div class="card-number">
          ${card.card_number}
        </div>

        <div class="card-info">
          <div class="info-row">
            <span class="info-label">Date d'émission:</span>
            <span>${currentDate}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Valeur initiale:</span>
            <span>${card.initial_balance.toFixed(2)}€</span>
          </div>
          <div class="info-row">
            <span class="info-label">Solde actuel:</span>
            <span>${card.current_balance.toFixed(2)}€</span>
          </div>
        </div>

        ${senderName || message ? `
          <div class="sender-section">
            ${senderName ? `
              <div class="sender-label">De la part de</div>
              <div class="sender-name">${senderName}</div>
            ` : ''}
            ${message ? `
              <div class="message">${message}</div>
            ` : ''}
          </div>
        ` : ''}

        <div class="decorative-element">✦ ✦ ✦</div>

        <div class="footer">
          <div class="footer-text">
            <strong>Valable dans notre magasin</strong><br>
            ${COMPANY_INFO.address}<br>
            ${COMPANY_INFO.postalCode} ${COMPANY_INFO.city}<br>
            ${COMPANY_INFO.phone || ''}<br>
            <br>
            Cette carte peut être réimprimée à tout moment<br>
            Le solde restant sera toujours indiqué
          </div>
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
