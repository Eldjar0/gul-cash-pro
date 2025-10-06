import { useState, useEffect } from 'react';
import { ShoppingBag, CheckCircle2, Thermometer, Calendar, Clock, CreditCard, Banknote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import logoMarket from '@/assets/logo-market.png';
import { PromotionBanner } from '@/components/customer-display/PromotionBanner';
import { createSafeBroadcastChannel } from '@/lib/safeBroadcast';

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
  const [temperature, setTemperature] = useState<number | null>(null);

  // Mise à jour de l'heure toutes les secondes
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Récupération de la température pour Jumet
  useEffect(() => {
    const fetchTemperature = async () => {
      try {
        const response = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=50.4497&longitude=4.4344&current=temperature_2m&timezone=Europe/Brussels'
        );
        const data = await response.json();
        if (data?.current?.temperature_2m !== undefined) {
          setTemperature(data.current.temperature_2m);
        }
      } catch (error) {
        console.error('Error fetching temperature:', error);
      }
    };

    // Récupérer immédiatement
    fetchTemperature();

    // Mettre à jour toutes les 10 minutes
    const interval = setInterval(fetchTemperature, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Canal de communication
    const channel = createSafeBroadcastChannel('customer_display');

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

    // Vérifier périodiquement localStorage pour synchronisation (optimisé)
    const interval = setInterval(() => {
      const stored = localStorage.getItem('customer_display_state');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Ne déclencher setDisplayState que si le timestamp est vraiment différent
          setDisplayState(prev => {
            if (parsed.timestamp !== prev.timestamp) {
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
      <div className="h-screen bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-6xl space-y-12">
          {/* Logo centré */}
          <div className="text-center">
            <img src={logoMarket} alt="Logo" className="w-64 h-64 mx-auto object-contain" />
            
            <h1 className="mt-8 text-8xl font-bold tracking-tight text-foreground">
              Bienvenue
            </h1>
          </div>

          {/* Textes centrés entre logo et infos */}
          <div className="text-center space-y-4">
            <p className="text-5xl font-bold text-foreground">
              Veuillez patienter
            </p>
            <p className="text-3xl text-muted-foreground">
              Un collaborateur va prendre votre commande
            </p>
          </div>

          {/* Promotion Banner */}
          <div>
            <PromotionBanner />
          </div>

          {/* Section infos (date, heure, température) */}
          <div className="grid grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Date */}
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="h-6 w-6 text-primary" />
                <p className="text-sm font-semibold text-primary uppercase">Date</p>
              </div>
              <p className="text-lg font-semibold text-foreground">
                {currentTime.toLocaleDateString('fr-BE', { 
                  weekday: 'long', 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>

            {/* Heure */}
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-6 w-6 text-primary" />
                <p className="text-sm font-semibold text-primary uppercase">Heure</p>
              </div>
              <p className="text-3xl font-bold text-foreground font-mono">
                {currentTime.toLocaleTimeString('fr-BE', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </p>
            </div>

            {/* Température */}
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <Thermometer className="h-6 w-6 text-primary" />
                <p className="text-sm font-semibold text-primary uppercase">Jumet</p>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {temperature !== null ? `${temperature.toFixed(1)}°C` : 'N/A'}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-center">
            <div className="px-6 py-2 bg-card rounded-full border border-border">
              <p className="text-sm text-muted-foreground">
                Système de caisse développé par <span className="text-primary font-semibold">Jlprod.be</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (displayState.status === 'completed') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center space-y-12">
          <img src={logoMarket} alt="Logo" className="w-64 h-64 mx-auto object-contain" />
          <CheckCircle2 className="w-32 h-32 mx-auto text-primary" />
          <div className="space-y-6">
            <h1 className="text-8xl font-bold text-foreground">
              Merci !
            </h1>
            <p className="text-5xl text-foreground font-semibold">
              À bientôt !
            </p>
            <div className="inline-block px-6 py-3 bg-card rounded-full border border-border">
              <p className="text-xl text-foreground">Passez une excellente journée !</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background flex flex-col overflow-hidden">
      {/* Header fixe avec logo */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-primary/95 via-accent/95 to-primary/95 backdrop-blur-md border-b-2 border-primary shadow-xl p-3 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="relative">
            <img src={logoMarket} alt="Logo" className="h-14 object-contain drop-shadow-lg" />
          </div>
          <div className="text-center flex-1">
            <div className="inline-block px-4 py-1.5 bg-white/20 rounded-full border border-white/40 backdrop-blur-sm">
              <h1 className="text-2xl font-black text-white tracking-tight">
                {displayState.isInvoice ? 'FACTURE' : 'TICKET'} {displayState.saleNumber || 'EN COURS'}
              </h1>
            </div>
            {displayState.isInvoice && displayState.customer && (
              <p className="text-lg text-white font-bold mt-1">{displayState.customer.name}</p>
            )}
          </div>
          <div className="text-right bg-white/20 rounded-lg px-3 py-2 border border-white/40 backdrop-blur-sm">
            <p className="text-xs text-white/90 uppercase tracking-wide font-bold">Caisse</p>
            <p className="text-lg font-black text-white">{displayState.cashierName || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Zone scrollable pour les articles - avec padding top et bottom pour header/footer fixes */}
      <div className="flex-1 overflow-y-auto pt-24 pb-32 px-6">
        <div className="max-w-7xl mx-auto space-y-4">
          {displayState.items.map((item, index) => {
            const subtotal = calculateSubtotal(item);
            const vat = calculateVAT(item);
            const unitDisplay = item.unit === 'kg' ? 'kg' : item.unit === 'l' ? 'l' : 'pc';
            
            return (
              <div
                key={`${item.name}-${index}`}
                className="bg-card rounded-3xl shadow-2xl p-8 border-4 border-primary/30 hover:shadow-glow-lg hover:border-primary/60 transition-all duration-300 hover:scale-[1.01] animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex justify-between items-start gap-8">
                  <div className="flex-1">
                    <h3 className="text-4xl font-black text-foreground uppercase tracking-tight mb-4 flex items-center gap-4">
                      <div className="w-3 h-10 bg-gradient-to-b from-primary to-accent rounded-full shadow-lg"></div>
                      {item.name}
                    </h3>
                    <div className="flex gap-4 items-center flex-wrap">
                      <div className="flex items-center gap-4 bg-primary/10 rounded-2xl px-6 py-3 border-2 border-primary/20">
                        <span className="text-3xl font-black text-foreground">
                          {item.quantity.toFixed(item.unit === 'kg' ? 3 : 0)} {unitDisplay}
                        </span>
                        <span className="text-2xl text-muted-foreground font-bold">×</span>
                        <span className="text-3xl font-black text-primary">
                          {item.price.toFixed(2)} €
                        </span>
                      </div>
                      {item.hasCustomPrice && (
                        <span className="px-6 py-3 rounded-2xl text-lg font-black bg-accent/20 text-accent border-2 border-accent/50 shadow-lg">
                          Prix modifié
                        </span>
                      )}
                      {item.discount && (
                        <span className="px-6 py-3 rounded-2xl text-lg font-black bg-destructive/20 text-destructive border-2 border-destructive/50 shadow-lg">
                          -{item.discount.value}{item.discount.type === 'percentage' ? '%' : '€'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-gradient-to-br from-primary/15 to-accent/15 rounded-3xl px-8 py-6 border-4 border-primary/40 shadow-glow-lg">
                      <div className="text-6xl font-black text-primary mb-2 tabular-nums drop-shadow-lg">
                        {item.total.toFixed(2)} €
                      </div>
                      <div className="text-base text-muted-foreground font-bold">
                        TVA {item.vatRate}%: <span className="text-foreground font-black text-lg">{vat.toFixed(2)}€</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer fixe avec total en bas */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-primary via-accent to-primary shadow-xl z-10 border-t-2 border-white/20">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex justify-center items-center">
            {/* Total TTC centré */}
            <div className="bg-white/20 backdrop-blur-md rounded-2xl px-8 py-4 border-2 border-white/40 shadow-lg">
              <div className="text-xl font-black text-white mb-2 uppercase tracking-wide">TOTAL À PAYER</div>
              <div className="text-5xl font-black text-white tracking-tight leading-none tabular-nums">
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
