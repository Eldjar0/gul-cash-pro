import { useState, useEffect } from 'react';
import { ShoppingBag, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.jpg';

interface DisplayItem {
  name: string;
  quantity: number;
  price: number;
  originalPrice: number;
  vatRate: number;
  total: number;
  unit?: string;
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
  cashierName?: string;
  saleNumber?: string;
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

  const [currentTime, setCurrentTime] = useState(new Date());

  // Mise à jour de l'heure toutes les secondes
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="text-center space-y-8 animate-fade-in">
          <img src={logo} alt="Logo" className="w-64 h-64 mx-auto object-contain animate-scale-in" />
          <div className="space-y-4">
            <h1 className="text-7xl font-black animate-scale-in text-foreground tracking-tight">
              Bienvenue
            </h1>
            <p className="text-4xl animate-fade-in text-muted-foreground" style={{ animationDelay: '0.2s' }}>
              Veuillez patienter
            </p>
            <p className="text-3xl animate-fade-in text-muted-foreground/70" style={{ animationDelay: '0.4s' }}>
              Un collaborateur arrive
            </p>
          </div>
          <div className="flex justify-center gap-3 mt-8">
            <div className="w-4 h-4 rounded-full animate-bounce bg-primary" style={{ animationDelay: '0s' }}></div>
            <div className="w-4 h-4 rounded-full animate-bounce bg-primary" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-4 h-4 rounded-full animate-bounce bg-primary" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <p className="text-xl text-muted-foreground/60 mt-6">
            Système de caisse développé par Jlprod.be
          </p>
        </div>
      </div>
    );
  }

  if (displayState.status === 'completed') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="text-center space-y-8 animate-scale-in">
          <img src={logo} alt="Logo" className="w-64 h-64 mx-auto object-contain animate-scale-in" />
          <CheckCircle2 className="w-40 h-40 mx-auto animate-scale-in text-accent" />
          <div className="space-y-6">
            <h1 className="text-8xl font-black animate-fade-in text-foreground tracking-tight">
              Merci !
            </h1>
            <p className="text-5xl animate-fade-in text-muted-foreground" style={{ animationDelay: '0.2s' }}>
              À bientôt !
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-hidden">
      {/* Header fixe avec logo */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b-4 border-primary shadow-lg p-4 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <img src={logo} alt="Logo" className="h-16 object-contain" />
          <div className="text-center flex-1">
            <h1 className="text-4xl font-black text-foreground tracking-tight">
              {displayState.isInvoice ? 'FACTURE' : 'TICKET'} {displayState.saleNumber || 'EN COURS'}
            </h1>
            {displayState.isInvoice && displayState.customer && (
              <p className="text-xl text-primary font-bold mt-1">{displayState.customer.name}</p>
            )}
            <div className="text-sm text-muted-foreground mt-1">
              {currentTime.toLocaleDateString('fr-BE', { 
                weekday: 'long', 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
              })}
              {' - '}
              {currentTime.toLocaleTimeString('fr-BE', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg text-muted-foreground">Caisse:</p>
            <p className="text-2xl font-bold text-primary">{displayState.cashierName || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Zone scrollable pour les articles - avec padding top et bottom pour header/footer fixes */}
      <div className="flex-1 overflow-y-auto pt-24 pb-48 px-4">
        <div className="max-w-7xl mx-auto space-y-2 flex flex-col-reverse">
          {displayState.items.map((item, index) => {
            const subtotal = calculateSubtotal(item);
            const vat = calculateVAT(item);
            const unitDisplay = item.unit === 'kg' ? 'kg' : item.unit === 'l' ? 'l' : 'pc';
            
            return (
              <div
                key={`${item.name}-${index}`}
                className="bg-white rounded-xl shadow-md p-4 border border-primary/20 hover:shadow-lg transition-all"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-foreground uppercase tracking-tight mb-2">
                      {item.name}
                    </h3>
                    <div className="flex gap-3 items-center flex-wrap mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-muted-foreground">
                          {item.quantity.toFixed(item.unit === 'kg' ? 3 : 0)} {unitDisplay}
                        </span>
                        <span className="text-lg text-muted-foreground">×</span>
                        <span className="text-xl font-semibold text-muted-foreground">
                          {item.price.toFixed(2)} €
                        </span>
                      </div>
                      {item.hasCustomPrice && (
                        <span className="px-2 py-1 rounded-full text-sm font-bold bg-accent/20 text-accent">
                          Prix modifié
                        </span>
                      )}
                      {item.discount && (
                        <span className="px-2 py-1 rounded-full text-sm font-bold bg-destructive/20 text-destructive">
                          -{item.discount.value}{item.discount.type === 'percentage' ? '%' : '€'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-black text-primary mb-1">
                      {item.total.toFixed(2)} €
                    </div>
                    <div className="text-base text-muted-foreground">
                      <div>TVA {item.vatRate}%: <span className="font-bold">{vat.toFixed(2)}€</span></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer fixe avec total en bas à droite */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-primary to-accent shadow-2xl z-10">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex justify-between items-center">
            {/* Infos TVA à gauche */}
            <div className="space-y-1 text-white">
              {(() => {
                const vatByRate = displayState.items.reduce((acc, item) => {
                  const vat = calculateVAT(item);
                  if (!acc[item.vatRate]) {
                    acc[item.vatRate] = 0;
                  }
                  acc[item.vatRate] += vat;
                  return acc;
                }, {} as Record<number, number>);

                return Object.entries(vatByRate).map(([rate, amount]) => (
                  <div key={rate} className="text-base font-semibold flex items-center gap-2">
                    <span className="opacity-90">TVA {parseFloat(rate).toFixed(0)}%:</span>
                    <span className="font-bold">{amount.toFixed(2)} €</span>
                  </div>
                ));
              })()}
            </div>

            {/* Total TTC à droite - ÉNORME */}
            <div className="text-right">
              <div className="text-2xl font-bold text-white/90 mb-1">TOTAL À PAYER</div>
              <div className="text-6xl font-black text-white tracking-tighter leading-none">
                {getTotalTTC().toFixed(2)} €
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDisplay;
