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
      <div className="bg-white border-b-4 border-primary shadow-lg p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <img src={logo} alt="Logo" className="h-20 object-contain" />
          <div className="text-right">
            <h1 className="text-5xl font-black text-foreground tracking-tight">
              {displayState.isInvoice ? 'FACTURE' : 'TICKET'}
            </h1>
            {displayState.isInvoice && displayState.customer && (
              <p className="text-2xl text-primary font-bold mt-1">{displayState.customer.name}</p>
            )}
          </div>
        </div>
      </div>

      {/* Zone scrollable pour les articles */}
      <div className="flex-1 overflow-y-auto py-8 px-6">
        <div className="max-w-7xl mx-auto space-y-4">
          {displayState.items.map((item, index) => {
            const subtotal = calculateSubtotal(item);
            const vat = calculateVAT(item);
            
            return (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg p-8 border-2 border-primary/20 animate-fade-in hover:shadow-xl transition-all"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="text-4xl font-black text-foreground uppercase tracking-tight mb-3">
                      {item.name}
                    </h3>
                    <div className="flex gap-6 items-center flex-wrap">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-bold text-muted-foreground">
                          {item.quantity.toFixed(item.unit === 'kg' ? 3 : 0)} {item.unit || 'u'}
                        </span>
                        <span className="text-2xl text-muted-foreground">×</span>
                        <span className="text-3xl font-semibold text-muted-foreground">
                          {item.price.toFixed(2)} €
                        </span>
                      </div>
                      {item.hasCustomPrice && (
                        <span className="px-4 py-2 rounded-full text-xl font-bold bg-accent/20 text-accent">
                          Prix modifié
                        </span>
                      )}
                      {item.discount && (
                        <span className="px-4 py-2 rounded-full text-xl font-bold bg-destructive/20 text-destructive">
                          -{item.discount.value}{item.discount.type === 'percentage' ? '%' : '€'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-6xl font-black text-primary">
                      {item.total.toFixed(2)} €
                    </div>
                    <div className="text-xl text-muted-foreground mt-2">
                      HT: {subtotal.toFixed(2)}€ + TVA: {vat.toFixed(2)}€
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer fixe avec total en bas à droite */}
      <div className="bg-gradient-to-r from-primary to-accent shadow-2xl">
        <div className="max-w-7xl mx-auto p-8">
          <div className="flex justify-between items-center">
            {/* Infos TVA à gauche */}
            <div className="space-y-2 text-white">
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
                  <div key={rate} className="text-2xl font-semibold flex items-center gap-3">
                    <span className="opacity-90">TVA {parseFloat(rate).toFixed(2)}%:</span>
                    <span className="font-bold">{amount.toFixed(2)} €</span>
                  </div>
                ));
              })()}
            </div>

            {/* Total TTC à droite - ÉNORME */}
            <div className="text-right">
              <div className="text-3xl font-bold text-white/90 mb-2">TOTAL À PAYER</div>
              <div className="text-9xl font-black text-white tracking-tighter leading-none">
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
