import { useState, useEffect, useRef } from 'react';
import { ShoppingBag, CheckCircle2, Calendar, Clock, Sparkles, CreditCard, Banknote, Tag, Percent } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import logoMarket from '@/assets/logo-market.png';

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
  status: 'idle' | 'shopping' | 'completed' | 'payment';
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
  payment?: {
    method: 'cash' | 'card' | 'mobile';
    amountPaid?: number;
    change?: number;
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
  const itemsContainerRef = useRef<HTMLDivElement>(null);

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
        setDisplayState(prev => {
          const newState = event.data;
          // Auto-scroll si un nouvel item est ajouté
          if (newState.items.length > prev.items.length && newState.status === 'shopping') {
            setTimeout(() => {
              if (itemsContainerRef.current) {
                itemsContainerRef.current.scrollTo({
                  top: itemsContainerRef.current.scrollHeight,
                  behavior: 'smooth'
                });
              }
            }, 100);
          }
          return newState;
        });
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

  // État d'attente - ultra épuré
  if (displayState.status === 'idle') {
    return (
      <div className="h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-8 relative overflow-hidden">
        {/* Effets de fond minimalistes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-soft"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative z-10 text-center space-y-12 max-w-4xl mx-auto">
          {/* Logo avec effet de glow */}
          <div className="animate-scale-in">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150"></div>
              <img 
                src={logoMarket} 
                alt="Logo" 
                className="relative w-48 h-48 mx-auto object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Titre principal */}
          <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h1 className="text-8xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
                {displaySettings.welcome_text}
              </span>
            </h1>
            <p className="text-4xl font-medium text-muted-foreground">
              Nous sommes là pour vous servir
            </p>
          </div>

          {/* Infos en temps réel - design moderne */}
          <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {/* Date & Heure */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-card/80 backdrop-blur-xl rounded-2xl p-6 border border-border/50 shadow-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-primary uppercase tracking-wider">Date</span>
                </div>
                <p className="text-lg font-bold text-foreground">
                  {currentTime.toLocaleDateString('fr-BE', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long'
                  })}
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-primary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-card/80 backdrop-blur-xl rounded-2xl p-6 border border-border/50 shadow-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Clock className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-sm font-semibold text-accent uppercase tracking-wider">Heure</span>
                </div>
                <p className="text-3xl font-black text-foreground font-mono tabular-nums">
                  {currentTime.toLocaleTimeString('fr-BE', { 
                    hour: '2-digit', 
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Footer minimaliste */}
          <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <p className="text-sm text-muted-foreground">
              Système de caisse • <span className="text-primary font-semibold">Jlprod.be</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // État de remerciement - élégant
  if (displayState.status === 'completed') {
    return (
      <div className="h-screen bg-gradient-to-br from-accent/10 via-background to-primary/10 flex items-center justify-center p-8 relative overflow-hidden">
        {/* Effet de fond */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/20 rounded-full blur-3xl animate-pulse-soft"></div>
        </div>

        <div className="relative z-10 text-center space-y-12 animate-bounce-in">
          {/* Icône de succès */}
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-accent/30 blur-3xl rounded-full scale-150"></div>
            <CheckCircle2 className="relative w-40 h-40 mx-auto text-accent drop-shadow-2xl" />
          </div>

          {/* Messages */}
          <div className="space-y-6">
            <h1 className="text-9xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-accent via-accent/80 to-primary bg-clip-text text-transparent">
                Merci !
              </span>
            </h1>
            <p className="text-5xl font-semibold text-foreground">
              {displaySettings.thank_you_text}
            </p>
            <p className="text-6xl font-bold text-primary">
              À bientôt !
            </p>
          </div>

          {/* Badge décoratif */}
          <div className="inline-flex items-center gap-2 px-8 py-4 bg-card/80 backdrop-blur-xl rounded-full border border-accent/30 shadow-glow-lg">
            <Sparkles className="w-6 h-6 text-accent" />
            <span className="text-xl font-semibold text-accent">Excellente journée !</span>
          </div>
        </div>
      </div>
    );
  }

  // État paiement - selon le mode
  if (displayState.status === 'payment' && displayState.payment) {
    const { method, amountPaid, change } = displayState.payment;
    const total = displayState.totals?.total || getTotalTTC();

    if (method === 'card' || method === 'mobile') {
      return (
        <div className="h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-8 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/10 rounded-full blur-3xl animate-pulse-soft"></div>
          </div>

          <div className="relative z-10 text-center space-y-12 max-w-4xl mx-auto animate-scale-in">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-white/30 blur-3xl rounded-full scale-150 animate-pulse"></div>
              <CreditCard className="relative w-48 h-48 mx-auto text-white drop-shadow-2xl" />
            </div>

            <div className="space-y-6">
              <h1 className="text-9xl font-black text-white drop-shadow-2xl">
                {total.toFixed(2)} €
              </h1>
              <p className="text-4xl font-bold text-white/90">
                {method === 'card' ? 'Veuillez insérer votre carte dans le Bancontact' : 'Approchez votre téléphone du terminal'}
              </p>
            </div>

            <div className="inline-flex items-center gap-3 px-8 py-4 bg-white/20 backdrop-blur-xl rounded-full border border-white/30">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span className="text-xl font-semibold text-white">En attente du paiement...</span>
            </div>
          </div>
        </div>
      );
    }

    // Mode espèces
    return (
      <div className="h-screen bg-gradient-to-br from-green-600 via-emerald-700 to-teal-800 flex items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/10 rounded-full blur-3xl animate-pulse-soft"></div>
        </div>

        <div className="relative z-10 w-full max-w-5xl mx-auto space-y-8 animate-scale-in">
          <div className="text-center mb-12">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-white/30 blur-3xl rounded-full scale-150"></div>
              <Banknote className="relative w-32 h-32 mx-auto text-white drop-shadow-2xl" />
            </div>
            <h1 className="text-6xl font-black text-white drop-shadow-xl">PAIEMENT EN ESPÈCES</h1>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-10 border-4 border-white/30">
              <p className="text-white/90 text-3xl font-bold mb-4">MONTANT À PAYER</p>
              <div className="text-white text-8xl font-black drop-shadow-lg">
                {total.toFixed(2)} €
              </div>
            </div>

            {amountPaid !== undefined && (
              <div className="bg-white/30 backdrop-blur-xl rounded-3xl p-10 border-4 border-white/50 animate-scale-in">
                <p className="text-white/90 text-3xl font-bold mb-4">MONTANT REÇU</p>
                <div className="text-white text-8xl font-black drop-shadow-lg">
                  {amountPaid.toFixed(2)} €
                </div>
              </div>
            )}
          </div>

          {change !== undefined && change > 0 && (
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-12 border-4 border-white shadow-2xl animate-scale-in">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-4xl font-bold mb-2">MONNAIE À RENDRE</p>
                  <p className="text-white/90 text-xl">Au client</p>
                </div>
                <div className="text-white text-9xl font-black drop-shadow-2xl animate-pulse">
                  {change.toFixed(2)} €
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // État shopping - design moderne et épuré
  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 flex flex-col overflow-hidden">
      {/* Header fixe - design épuré et pro */}
      <div className="relative border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo et info */}
            <div className="flex items-center gap-4">
              <img src={logoMarket} alt="Logo" className="w-12 h-12 object-contain" />
              <div className="space-y-0.5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">TICKET EN COURS</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {currentTime.toLocaleDateString('fr-BE', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long',
                    year: 'numeric'
                  })} - {currentTime.toLocaleTimeString('fr-BE', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </p>
              </div>
            </div>

            {/* Info caisse */}
            <div className="text-right">
              <p className="text-sm text-slate-500 dark:text-slate-400">Caisse:</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {displayState.cashierName || 'Caisse'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Promos banner */}
      {(displayState.globalDiscount || displayState.promoCode) && (
        <div className="bg-gradient-to-r from-orange-500 to-pink-600 px-6 py-4 animate-fade-in">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
            <Tag className="w-8 h-8 text-white" />
            <div className="text-center">
              {displayState.promoCode && (
                <p className="text-white text-2xl font-black">
                  CODE PROMO: {displayState.promoCode.code} • 
                  {displayState.promoCode.type === 'percentage' 
                    ? ` -${displayState.promoCode.value}%` 
                    : ` -${displayState.promoCode.value.toFixed(2)}€`}
                </p>
              )}
              {displayState.globalDiscount && !displayState.promoCode && (
                <p className="text-white text-2xl font-black">
                  REMISE: 
                  {displayState.globalDiscount.type === 'percentage' 
                    ? ` -${displayState.globalDiscount.value}%` 
                    : ` -${displayState.globalDiscount.value.toFixed(2)}€`}
                </p>
              )}
            </div>
            <Percent className="w-8 h-8 text-white" />
          </div>
        </div>
      )}

      {/* Zone des articles - scrollable */}
      <div ref={itemsContainerRef} className="flex-1 overflow-y-auto px-6 py-4 scroll-smooth">
        <div className="max-w-7xl mx-auto space-y-3">
          {displayState.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <ShoppingBag className="w-24 h-24 text-slate-300 dark:text-slate-700 mb-4" />
              <p className="text-2xl font-semibold text-slate-400 dark:text-slate-600">
                Panier vide
              </p>
            </div>
          ) : (
            displayState.items.map((item, index) => (
              <div
                key={index}
                className="bg-white dark:bg-slate-800 rounded-lg p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all animate-scale-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start justify-between gap-6">
                  {/* Info produit */}
                  <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <span>
                        <span className="font-semibold text-slate-900 dark:text-white">{item.quantity}</span>
                        {item.unit && ` ${item.unit}`} × {item.price.toFixed(2)} €
                      </span>
                      {item.discount && (
                        <>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="text-red-600 dark:text-red-400 font-semibold">
                            -{item.discount.type === 'percentage' 
                              ? `${item.discount.value}%` 
                              : `${item.discount.value.toFixed(2)}€`}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      TVA {item.vatRate}%: {calculateVAT(item).toFixed(2)} €
                    </p>
                  </div>

                  {/* Prix total */}
                  <div className="text-right">
                    <div className="text-4xl font-black text-blue-600 dark:text-blue-400">
                      {item.total.toFixed(2)} €
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer fixe - Total avec dégradé moderne */}
      <div className="relative mt-auto">
        {/* Dégradé de fond */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500"></div>
        
        <div className="relative">
          <div className="max-w-7xl mx-auto px-6 py-6">
            {/* Ligne TVA */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/90 text-base font-medium">
                TVA {displayState.items.length > 0 && displayState.items[0]?.vatRate ? displayState.items[0].vatRate : 6}%:
              </span>
              <span className="text-white text-lg font-bold">
                {getTotalVAT().toFixed(2)} €
              </span>
            </div>

            {/* Total à payer */}
            <div className="flex items-center justify-between">
              <span className="text-white text-2xl font-bold uppercase tracking-wide">
                TOTAL À PAYER
              </span>
              <div className="text-6xl font-black text-white drop-shadow-lg">
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
