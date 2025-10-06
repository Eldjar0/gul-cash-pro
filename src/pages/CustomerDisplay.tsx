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
      <div className="h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="w-full max-w-6xl space-y-8 relative z-10">
          {/* Logo centré */}
          <div className="text-center animate-fade-in">
            <div className="relative inline-block">
              <img src={logoMarket} alt="Logo" className="relative w-72 h-72 mx-auto object-contain animate-scale-in drop-shadow-2xl brightness-110" />
            </div>
            
            <div className="mt-8 relative">
              <h1 className="relative text-[10rem] font-black tracking-tight animate-scale-in drop-shadow-2xl bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-gradient-slide text-transparent bg-clip-text" style={{ animationDelay: '0.1s', lineHeight: '1' }}>
                Bienvenue
              </h1>
            </div>
          </div>

          {/* Textes centrés entre logo et infos */}
          <div className="text-center space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <p className="text-6xl font-black text-primary drop-shadow-lg">
              Veuillez patienter
            </p>
            <p className="text-4xl font-bold bg-gradient-to-r from-accent to-primary text-transparent bg-clip-text">
              Un collaborateur va prendre votre commande
            </p>
          </div>

          {/* Promotion Banner */}
          <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <PromotionBanner />
          </div>

          {/* Section infos (date, heure, température) - carrousel infini */}
          <div className="relative overflow-hidden animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex gap-4 animate-scroll-left">
              {/* Premier set de cartes */}
              {/* Date */}
              <div className="flex-shrink-0 w-80 bg-card/70 backdrop-blur-md rounded-2xl p-4 border-2 border-primary/20 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm font-bold text-primary uppercase tracking-wide">Date</p>
                </div>
                <p className="text-base font-bold text-foreground leading-tight">
                  {currentTime.toLocaleDateString('fr-BE', { 
                    weekday: 'long', 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>

              {/* Heure */}
              <div className="flex-shrink-0 w-80 bg-card/70 backdrop-blur-md rounded-2xl p-4 border-2 border-accent/20 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Clock className="h-5 w-5 text-accent" />
                  </div>
                  <p className="text-sm font-bold text-accent uppercase tracking-wide">Heure</p>
                </div>
                <p className="text-3xl font-black text-foreground font-mono tabular-nums">
                  {currentTime.toLocaleTimeString('fr-BE', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </p>
              </div>

              {/* Température */}
              <div className="flex-shrink-0 w-80 bg-card/70 backdrop-blur-md rounded-2xl p-4 border-2 border-category-orange/20 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-category-orange/10 rounded-lg">
                    <Thermometer className="h-5 w-5 text-category-orange" />
                  </div>
                  <p className="text-sm font-bold text-category-orange uppercase tracking-wide">Jumet</p>
                </div>
                <p className="text-3xl font-black text-foreground tabular-nums">
                  {temperature !== null ? `${temperature.toFixed(1)}°C` : 'N/A'}
                </p>
              </div>

              {/* Deuxième set de cartes (copie pour effet infini) */}
              {/* Date */}
              <div className="flex-shrink-0 w-80 bg-card/70 backdrop-blur-md rounded-2xl p-4 border-2 border-primary/20 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm font-bold text-primary uppercase tracking-wide">Date</p>
                </div>
                <p className="text-base font-bold text-foreground leading-tight">
                  {currentTime.toLocaleDateString('fr-BE', { 
                    weekday: 'long', 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>

              {/* Heure */}
              <div className="flex-shrink-0 w-80 bg-card/70 backdrop-blur-md rounded-2xl p-4 border-2 border-accent/20 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Clock className="h-5 w-5 text-accent" />
                  </div>
                  <p className="text-sm font-bold text-accent uppercase tracking-wide">Heure</p>
                </div>
                <p className="text-3xl font-black text-foreground font-mono tabular-nums">
                  {currentTime.toLocaleTimeString('fr-BE', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </p>
              </div>

              {/* Température */}
              <div className="flex-shrink-0 w-80 bg-card/70 backdrop-blur-md rounded-2xl p-4 border-2 border-category-orange/20 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-category-orange/10 rounded-lg">
                    <Thermometer className="h-5 w-5 text-category-orange" />
                  </div>
                  <p className="text-sm font-bold text-category-orange uppercase tracking-wide">Jumet</p>
                </div>
                <p className="text-3xl font-black text-foreground tabular-nums">
                  {temperature !== null ? `${temperature.toFixed(1)}°C` : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="px-8 py-3 bg-card/80 backdrop-blur-sm rounded-full border border-border/50 shadow-lg">
              <p className="text-base text-muted-foreground font-medium">
                Système de caisse développé par <span className="text-primary font-bold">Jlprod.be</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (displayState.status === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/10 via-background to-primary/10 flex items-center justify-center p-8">
        <div className="text-center space-y-12 animate-bounce-in">
          <div className="relative">
            <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full animate-pulse-soft"></div>
            <img src={logoMarket} alt="Logo" className="relative w-80 h-80 mx-auto object-contain drop-shadow-2xl" />
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full"></div>
            <CheckCircle2 className="relative w-48 h-48 mx-auto text-accent animate-bounce-in drop-shadow-2xl" style={{ animationDelay: '0.2s' }} />
          </div>
          <div className="space-y-8">
            <h1 className="text-9xl font-black animate-fade-in gradient-text tracking-tight" style={{ animationDelay: '0.3s' }}>
              Merci !
            </h1>
            <p className="text-6xl animate-fade-in text-foreground font-bold" style={{ animationDelay: '0.5s' }}>
              À bientôt !
            </p>
            <div className="inline-block px-8 py-4 bg-card rounded-full border-2 border-accent shadow-glow-lg animate-fade-in" style={{ animationDelay: '0.7s' }}>
              <p className="text-2xl text-accent font-bold">Passez une excellente journée !</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background flex flex-col overflow-hidden">
      {/* Header fixe avec logo */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-primary/95 via-accent/95 to-primary/95 backdrop-blur-md border-b-4 border-primary shadow-2xl p-6 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 blur-xl rounded-full"></div>
            <img src={logoMarket} alt="Logo" className="relative h-24 object-contain drop-shadow-2xl brightness-110" />
          </div>
          <div className="text-center flex-1">
            <div className="inline-block px-8 py-3 bg-white/20 rounded-full border-2 border-white/40 mb-2 backdrop-blur-sm">
              <h1 className="text-6xl font-black text-white tracking-tight drop-shadow-lg">
                {displayState.isInvoice ? 'FACTURE' : 'TICKET'} {displayState.saleNumber || 'EN COURS'}
              </h1>
            </div>
            {displayState.isInvoice && displayState.customer && (
              <p className="text-3xl text-white font-bold mt-2 drop-shadow-md">{displayState.customer.name}</p>
            )}
            <div className="text-xl text-white/90 mt-2 font-bold drop-shadow-md">
              {currentTime.toLocaleDateString('fr-BE', { 
                weekday: 'long', 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
              })}
              {' • '}
              {currentTime.toLocaleTimeString('fr-BE', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>
          </div>
          <div className="text-right bg-white/20 rounded-2xl px-8 py-4 border-2 border-white/40 backdrop-blur-sm">
            <p className="text-base text-white/90 uppercase tracking-wide font-bold">Caisse</p>
            <p className="text-4xl font-black text-white drop-shadow-lg">{displayState.cashierName || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Zone scrollable pour les articles - avec padding top et bottom pour header/footer fixes */}
      <div className="flex-1 overflow-y-auto pt-40 pb-40 px-4">
        <div className="max-w-7xl mx-auto space-y-2">
          {displayState.items.map((item, index) => {
            const subtotal = calculateSubtotal(item);
            const vat = calculateVAT(item);
            const unitDisplay = item.unit === 'kg' ? 'kg' : item.unit === 'l' ? 'l' : 'pc';
            
            return (
              <div
                key={`${item.name}-${index}`}
                className="bg-card rounded-2xl shadow-lg p-4 border-2 border-primary/30 hover:shadow-glow hover:border-primary/60 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-foreground uppercase tracking-tight mb-2 flex items-center gap-2">
                      <div className="w-2 h-6 bg-gradient-to-b from-primary to-accent rounded-full shadow-lg"></div>
                      {item.name}
                    </h3>
                    <div className="flex gap-2 items-center flex-wrap">
                      <div className="flex items-center gap-2 bg-primary/10 rounded-xl px-3 py-2 border border-primary/20">
                        <span className="text-xl font-black text-foreground">
                          {item.quantity.toFixed(item.unit === 'kg' ? 3 : 0)} {unitDisplay}
                        </span>
                        <span className="text-lg text-muted-foreground font-bold">×</span>
                        <span className="text-xl font-black text-primary">
                          {item.price.toFixed(2)} €
                        </span>
                      </div>
                      {item.hasCustomPrice && (
                        <span className="px-3 py-2 rounded-xl text-sm font-black bg-accent/20 text-accent border border-accent/50 shadow">
                          Prix modifié
                        </span>
                      )}
                      {item.discount && (
                        <span className="px-3 py-2 rounded-xl text-sm font-black bg-destructive/20 text-destructive border border-destructive/50 shadow">
                          -{item.discount.value}{item.discount.type === 'percentage' ? '%' : '€'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-gradient-to-br from-primary/15 to-accent/15 rounded-2xl px-4 py-3 border-2 border-primary/40 shadow-lg">
                      <div className="text-3xl font-black text-primary mb-1 tabular-nums drop-shadow-lg">
                        {item.total.toFixed(2)} €
                      </div>
                      <div className="text-xs text-muted-foreground font-bold">
                        TVA {item.vatRate}%: <span className="text-foreground font-black text-sm">{vat.toFixed(2)}€</span>
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
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-primary via-accent to-primary shadow-2xl z-10 border-t-4 border-white/20">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex justify-center items-center">
            {/* Total TTC centré */}
            <div className="text-center">
              <div className="bg-white/20 backdrop-blur-md rounded-2xl px-6 py-4 border-2 border-white/50 shadow-glow-lg">
                <div className="text-xl font-black text-white mb-2 uppercase tracking-widest drop-shadow-lg">TOTAL À PAYER</div>
                <div className="text-5xl font-black text-white tracking-tighter leading-none tabular-nums drop-shadow-2xl animate-pulse-soft">
                  {getTotalTTC().toFixed(2)} €
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDisplay;
