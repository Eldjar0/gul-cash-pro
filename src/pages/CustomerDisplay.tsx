import { useState, useEffect } from 'react';
import { ShoppingBag, CheckCircle2, Calendar, Clock, Sparkles, TrendingUp } from 'lucide-react';
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
                Bienvenue
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
          <div className="space-y-4">
            <h1 className="text-9xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-accent via-accent/80 to-primary bg-clip-text text-transparent">
                Merci !
              </span>
            </h1>
            <p className="text-5xl font-semibold text-foreground">
              À très bientôt
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

  // État shopping - design moderne et épuré
  return (
    <div className="h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex flex-col overflow-hidden">
      {/* Header fixe - ultra moderne */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 blur-xl"></div>
        <div className="relative bg-card/80 backdrop-blur-xl border-b border-border/50 shadow-lg">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <div className="flex items-center justify-between">
              {/* Logo et info */}
              <div className="flex items-center gap-6">
                <img src={logoMarket} alt="Logo" className="w-16 h-16 object-contain drop-shadow-lg" />
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-foreground">Vente en cours</h2>
                    {displayState.saleNumber && (
                      <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-full">
                        #{displayState.saleNumber}
                      </span>
                    )}
                  </div>
                  {displayState.cashierName && (
                    <p className="text-sm text-muted-foreground">
                      Caissier: <span className="font-semibold text-foreground">{displayState.cashierName}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Heure */}
              <div className="text-right">
                <p className="text-4xl font-black font-mono tabular-nums text-foreground">
                  {currentTime.toLocaleTimeString('fr-BE', { 
                    hour: '2-digit', 
                    minute: '2-digit'
                  })}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentTime.toLocaleDateString('fr-BE', { 
                    day: 'numeric', 
                    month: 'long'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zone des articles - scrollable */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-7xl mx-auto space-y-4">
          {displayState.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                <ShoppingBag className="relative w-32 h-32 text-primary/30 mb-6" />
              </div>
              <p className="text-3xl font-semibold text-muted-foreground">
                Panier vide
              </p>
            </div>
          ) : (
            displayState.items.map((item, index) => (
              <div
                key={index}
                className="group relative animate-scale-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-card/80 backdrop-blur-xl rounded-2xl p-6 border border-border/50 shadow-lg hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between gap-6">
                    {/* Info produit */}
                    <div className="flex-1 space-y-2">
                      <h3 className="text-2xl font-bold text-foreground leading-tight">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="font-medium">
                          Quantité: <span className="text-foreground font-bold">{item.quantity}</span>
                          {item.unit && ` ${item.unit}`}
                        </span>
                        <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                        <span className="font-medium">
                          Prix unitaire: <span className="text-foreground font-bold">{item.price.toFixed(2)}€</span>
                        </span>
                        {item.discount && (
                          <>
                            <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                            <span className="text-destructive font-semibold">
                              -{item.discount.type === 'percentage' 
                                ? `${item.discount.value}%` 
                                : `${item.discount.value.toFixed(2)}€`}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Prix total */}
                    <div className="text-right">
                      <div className="text-5xl font-black text-foreground">
                        {item.total.toFixed(2)}€
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        TVA {item.vatRate}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer fixe - Total */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/20 via-primary/20 to-accent/20 blur-2xl"></div>
        <div className="relative bg-card/90 backdrop-blur-xl border-t border-border/50 shadow-2xl">
          <div className="max-w-7xl mx-auto px-8 py-8">
            {/* Détails TVA */}
            {displayState.items.length > 0 && (
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-background/50 rounded-xl border border-border/30">
                  <p className="text-sm text-muted-foreground mb-1">Total HT</p>
                  <p className="text-2xl font-bold text-foreground">{getTotalHT().toFixed(2)}€</p>
                </div>
                <div className="text-center p-4 bg-background/50 rounded-xl border border-border/30">
                  <p className="text-sm text-muted-foreground mb-1">TVA</p>
                  <p className="text-2xl font-bold text-foreground">{getTotalVAT().toFixed(2)}€</p>
                </div>
                <div className="text-center p-4 bg-background/50 rounded-xl border border-border/30">
                  <p className="text-sm text-muted-foreground mb-1">Articles</p>
                  <p className="text-2xl font-bold text-foreground">
                    {displayState.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </p>
                </div>
              </div>
            )}

            {/* Total à payer */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative flex items-center justify-between px-12 py-8 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl border-2 border-primary/30">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/20 rounded-xl">
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                  <span className="text-3xl font-bold text-foreground">Total à payer</span>
                </div>
                <div className="text-7xl font-black">
                  <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    {getTotalTTC().toFixed(2)}€
                  </span>
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
