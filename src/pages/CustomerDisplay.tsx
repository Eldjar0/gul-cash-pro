import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ShoppingBag, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DisplayItem {
  name: string;
  quantity: number;
  price: number;
  originalPrice: number;
  vatRate: number;
  total: number;
  discount?: {
    type: 'percentage' | 'amount';
    value: number;
  };
  hasCustomPrice?: boolean;
}

interface DisplayState {
  items: DisplayItem[];
  status: 'idle' | 'shopping' | 'completed';
  timestamp: number;
  globalDiscount?: {
    type: 'percentage' | 'amount';
    value: number;
  };
  promoCode?: {
    code: string;
    type: 'percentage' | 'amount';
    value: number;
  };
  totals?: {
    subtotal: number;
    totalVat: number;
    totalDiscount: number;
    total: number;
  };
  isInvoice?: boolean;
  customer?: {
    name: string;
  };
}

interface DisplaySettings {
  welcome_text: string;
  thank_you_text: string;
  primary_color: string;
  secondary_color: string;
  text_color: string;
}

const CustomerDisplay = () => {
  const [displayState, setDisplayState] = useState<DisplayState>({
    items: [],
    status: 'idle',
    timestamp: Date.now(),
  });

  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
    welcome_text: 'Bienvenue',
    thank_you_text: 'Merci de votre visite !',
    primary_color: '#3B82F6',
    secondary_color: '#10B981',
    text_color: '#1F2937',
  });

  useEffect(() => {
    // Canal de communication
    const channel = new BroadcastChannel('customer_display');

    channel.onmessage = (event) => {
      console.log('[CustomerDisplay] Message received:', event.data);
      // Message de mise à jour des paramètres
      if (event.data?.type === 'settings' && event.data?.value) {
        setDisplaySettings(event.data.value);
        try {
          localStorage.setItem('display_settings_cache', JSON.stringify(event.data.value));
        } catch {}
        return;
      }
      // Message d'état d'achat
      if (event.data?.items) {
        setDisplayState(event.data);
      }
    };

    // Charger paramètres depuis le cache
    try {
      const cached = localStorage.getItem('display_settings_cache');
      if (cached) {
        setDisplaySettings(JSON.parse(cached));
      }
    } catch (e) {
      console.error('Error parsing cached settings:', e);
    }

    // Charger paramètres depuis Supabase
    (async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'display_settings')
        .maybeSingle();
      if (data?.value) {
        const val = data.value as any;
        setDisplaySettings({
          welcome_text: val.welcome_text ?? 'Bienvenue',
          thank_you_text: val.thank_you_text ?? 'Merci de votre visite !',
          primary_color: val.primary_color ?? '#3B82F6',
          secondary_color: val.secondary_color ?? '#10B981',
          text_color: val.text_color ?? '#1F2937',
        });
        try { localStorage.setItem('display_settings_cache', JSON.stringify(val)); } catch {}
      }
    })();

    // Charger l'état initial depuis localStorage
    const stored = localStorage.getItem('customer_display_state');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log('[CustomerDisplay] Initial state loaded:', parsed);
        setDisplayState(parsed);
      } catch (e) {
        console.error('Error parsing stored state:', e);
      }
    }

    // Vérifier périodiquement localStorage pour synchronisation
    const interval = setInterval(() => {
      const stored = localStorage.getItem('customer_display_state');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setDisplayState(prev => {
            if (parsed.timestamp > prev.timestamp) {
              console.log('[CustomerDisplay] State updated from localStorage:', parsed);
              return parsed;
            }
            return prev;
          });
        } catch (e) {
          console.error('Error parsing stored state:', e);
        }
      }
    }, 500);

    return () => {
      channel.close();
      clearInterval(interval);
    };
  }, []);

  const calculateSubtotal = (item: DisplayItem) => {
    return (item.price * item.quantity) / (1 + item.vatRate / 100);
  };

  const calculateVAT = (item: DisplayItem) => {
    const subtotal = calculateSubtotal(item);
    return subtotal * (item.vatRate / 100);
  };

  const getTotalHT = () => {
    return displayState.items.reduce((sum, item) => sum + calculateSubtotal(item), 0);
  };

  const getTotalVAT = () => {
    return displayState.items.reduce((sum, item) => sum + calculateVAT(item), 0);
  };

  const getTotalTTC = () => {
    return displayState.items.reduce((sum, item) => sum + item.total, 0);
  };

  if (displayState.status === 'idle') {
    return (
      <div 
        className="min-h-screen bg-gradient-to-br flex items-center justify-center p-8"
        style={{
          background: `linear-gradient(135deg, ${displaySettings.primary_color}10, transparent, ${displaySettings.secondary_color}10)`,
        }}
      >
        <div className="text-center space-y-8 animate-fade-in">
          <ShoppingBag className="w-32 h-32 mx-auto animate-pulse" style={{ color: displaySettings.primary_color + '40' }} />
          <div className="space-y-4">
            <h1 className="text-6xl font-bold animate-scale-in" style={{ color: displaySettings.text_color }}>
              {displaySettings.welcome_text}
            </h1>
            <p className="text-3xl animate-fade-in" style={{ animationDelay: '0.2s', color: displaySettings.text_color + 'aa' }}>
              Veuillez patienter
            </p>
            <p className="text-2xl animate-fade-in" style={{ animationDelay: '0.4s', color: displaySettings.text_color + '88' }}>
              Un collaborateur arrive
            </p>
          </div>
          <div className="flex justify-center gap-2 mt-8">
            <div className="w-3 h-3 rounded-full animate-bounce" style={{ animationDelay: '0s', backgroundColor: displaySettings.primary_color }}></div>
            <div className="w-3 h-3 rounded-full animate-bounce" style={{ animationDelay: '0.2s', backgroundColor: displaySettings.primary_color }}></div>
            <div className="w-3 h-3 rounded-full animate-bounce" style={{ animationDelay: '0.4s', backgroundColor: displaySettings.primary_color }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (displayState.status === 'completed') {
    return (
      <div 
        className="min-h-screen bg-gradient-to-br flex items-center justify-center p-8"
        style={{
          background: `linear-gradient(135deg, ${displaySettings.secondary_color}20, transparent, ${displaySettings.primary_color}10)`,
        }}
      >
        <div className="text-center space-y-8 animate-scale-in">
          <CheckCircle2 className="w-32 h-32 mx-auto animate-scale-in" style={{ color: displaySettings.secondary_color }} />
          <div className="space-y-4">
            <h1 className="text-6xl font-bold animate-fade-in" style={{ color: displaySettings.text_color }}>
              {displaySettings.thank_you_text}
            </h1>
            <p className="text-3xl animate-fade-in" style={{ animationDelay: '0.2s', color: displaySettings.text_color + 'aa' }}>
              À bientôt !
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-4 md:p-8"
      style={{
        background: `linear-gradient(135deg, ${displaySettings.primary_color}08, transparent, ${displaySettings.secondary_color}08)`,
      }}
    >
      <div className="max-w-6xl mx-auto space-y-4">
        {/* En-tête avec client/facture */}
        <div className="text-center space-y-2 animate-fade-in">
          <div className="flex items-center justify-center gap-4">
            <h1 className="text-4xl md:text-5xl font-bold" style={{ color: displaySettings.text_color }}>
              Votre {displayState.isInvoice ? 'Facture' : 'Ticket'}
            </h1>
            {displayState.isInvoice && displayState.customer && (
              <div className="px-4 py-2 rounded-lg" style={{ 
                backgroundColor: displaySettings.primary_color + '20',
                color: displaySettings.text_color,
              }}>
                <p className="text-lg font-semibold">{displayState.customer.name}</p>
              </div>
            )}
          </div>
          <p className="text-xl md:text-2xl" style={{ color: displaySettings.text_color + 'aa' }}>
            Vérifiez vos articles
          </p>
        </div>

        {/* Articles */}
        <Card className="p-4 md:p-6 shadow-lg animate-scale-in" key={displayState.timestamp}>
          <div className="space-y-4">
            {/* Liste des articles */}
            <div className="space-y-2">
              {displayState.items.map((item, index) => {
                const subtotal = calculateSubtotal(item);
                const vat = calculateVAT(item);
                
                return (
                  <div
                    key={index}
                    className="border rounded-lg p-3 animate-fade-in"
                    style={{ 
                      animationDelay: `${index * 0.1}s`,
                      borderColor: displaySettings.primary_color + '30',
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="text-xl font-bold" style={{ color: displaySettings.text_color }}>
                          {item.name}
                        </p>
                        <div className="flex gap-2 items-center mt-1">
                          <span className="text-lg" style={{ color: displaySettings.text_color + 'aa' }}>
                            Qté: {item.quantity}
                          </span>
                          {item.hasCustomPrice && (
                            <span className="px-2 py-0.5 rounded text-sm font-semibold" style={{
                              backgroundColor: displaySettings.secondary_color + '20',
                              color: displaySettings.secondary_color,
                            }}>
                              Prix modifié
                            </span>
                          )}
                          {item.discount && (
                            <span className="px-2 py-0.5 rounded text-sm font-semibold" style={{
                              backgroundColor: displaySettings.secondary_color + '20',
                              color: displaySettings.secondary_color,
                            }}>
                              Remise: {item.discount.type === 'percentage' ? `${item.discount.value}%` : `${item.discount.value}€`}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold" style={{ color: displaySettings.primary_color }}>
                          {item.total.toFixed(2)} €
                        </div>
                        <div className="text-sm" style={{ color: displaySettings.text_color + '88' }}>
                          HT: {subtotal.toFixed(2)}€ + TVA: {vat.toFixed(2)}€
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Remises et promos */}
            {(displayState.globalDiscount || displayState.promoCode) && (
              <div className="space-y-2 py-4 border-t-2" style={{ borderColor: displaySettings.primary_color + '30' }}>
                {displayState.globalDiscount && (
                  <div className="flex justify-between items-center px-3 py-2 rounded-lg" style={{
                    backgroundColor: displaySettings.secondary_color + '15',
                  }}>
                    <span className="text-lg font-semibold" style={{ color: displaySettings.text_color }}>
                      Remise globale
                    </span>
                    <span className="text-xl font-bold" style={{ color: displaySettings.secondary_color }}>
                      -{displayState.globalDiscount.type === 'percentage' 
                        ? `${displayState.globalDiscount.value}%` 
                        : `${displayState.globalDiscount.value}€`}
                    </span>
                  </div>
                )}
                {displayState.promoCode && (
                  <div className="flex justify-between items-center px-3 py-2 rounded-lg" style={{
                    backgroundColor: displaySettings.primary_color + '15',
                  }}>
                    <div>
                      <span className="text-lg font-semibold" style={{ color: displaySettings.text_color }}>
                        Code promo: {displayState.promoCode.code}
                      </span>
                    </div>
                    <span className="text-xl font-bold" style={{ color: displaySettings.primary_color }}>
                      -{displayState.promoCode.type === 'percentage' 
                        ? `${displayState.promoCode.value}%` 
                        : `${displayState.promoCode.value}€`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Totaux */}
            {displayState.totals && (
              <div className="space-y-2 pt-4 border-t-2" style={{ borderColor: displaySettings.primary_color + '40' }}>
                <div className="flex justify-between text-xl" style={{ color: displaySettings.text_color + 'aa' }}>
                  <span>Sous-total HT</span>
                  <span className="font-semibold">{displayState.totals.subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-xl" style={{ color: displaySettings.text_color + 'aa' }}>
                  <span>TVA</span>
                  <span className="font-semibold">{displayState.totals.totalVat.toFixed(2)} €</span>
                </div>
                {displayState.totals.totalDiscount > 0 && (
                  <div className="flex justify-between text-xl" style={{ color: displaySettings.secondary_color }}>
                    <span className="font-semibold">Remise totale</span>
                    <span className="font-bold">-{displayState.totals.totalDiscount.toFixed(2)} €</span>
                  </div>
                )}
                <div className="flex justify-between text-3xl md:text-4xl font-bold pt-3 border-t" style={{ 
                  color: displaySettings.text_color,
                  borderColor: displaySettings.primary_color + '40',
                }}>
                  <span>Total TTC</span>
                  <span style={{ color: displaySettings.primary_color }}>{displayState.totals.total.toFixed(2)} €</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Animation de panier */}
        <div className="flex justify-center animate-pulse">
          <ShoppingBag className="w-12 h-12 md:w-16 md:h-16" style={{ color: displaySettings.primary_color + '30' }} />
        </div>
      </div>
    </div>
  );
};

export default CustomerDisplay;
