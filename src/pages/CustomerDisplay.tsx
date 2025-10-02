import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ShoppingBag, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DisplayItem {
  name: string;
  quantity: number;
  price: number;
  vatRate: number;
  total: number;
}

interface DisplayState {
  items: DisplayItem[];
  status: 'idle' | 'shopping' | 'completed';
  timestamp: number;
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
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-8">
        <div className="text-center space-y-8 animate-fade-in">
          <ShoppingBag className="w-32 h-32 mx-auto text-primary/20 animate-pulse" />
          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-foreground animate-scale-in">
              Bonjour
            </h1>
            <p className="text-3xl text-muted-foreground animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Veuillez patienter
            </p>
            <p className="text-2xl text-muted-foreground animate-fade-in" style={{ animationDelay: '0.4s' }}>
              Un collaborateur arrive
            </p>
          </div>
          <div className="flex justify-center gap-2 mt-8">
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (displayState.status === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500/10 via-background to-primary/5 flex items-center justify-center p-8">
        <div className="text-center space-y-8 animate-scale-in">
          <CheckCircle2 className="w-32 h-32 mx-auto text-green-500 animate-scale-in" />
          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-foreground animate-fade-in">
              Merci pour votre achat
            </h1>
            <p className="text-3xl text-muted-foreground animate-fade-in" style={{ animationDelay: '0.2s' }}>
              À bientôt !
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-5xl font-bold text-foreground">Votre Commande</h1>
          <p className="text-2xl text-muted-foreground">Vérifiez vos articles</p>
        </div>

        {/* Articles */}
        <Card className="p-6 shadow-lg animate-scale-in" key={displayState.timestamp}>
          <div className="space-y-4">
            {/* En-tête du tableau */}
            <div className="grid grid-cols-12 gap-4 pb-4 border-b-2 border-border text-lg font-semibold text-muted-foreground">
              <div className="col-span-5">Article</div>
              <div className="col-span-1 text-center">Qté</div>
              <div className="col-span-2 text-right">Prix HT</div>
              <div className="col-span-2 text-right">TVA</div>
              <div className="col-span-2 text-right">Total TTC</div>
            </div>

            {/* Liste des articles */}
            <div className="space-y-3">
              {displayState.items.map((item, index) => {
                const subtotal = calculateSubtotal(item);
                const vat = calculateVAT(item);
                
                return (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-4 py-3 border-b border-border/50 text-xl hover:bg-accent/10 transition-colors rounded-lg px-2 animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="col-span-5 font-medium text-foreground truncate">
                      {item.name}
                    </div>
                    <div className="col-span-1 text-center text-foreground font-semibold">
                      {item.quantity}
                    </div>
                    <div className="col-span-2 text-right text-muted-foreground">
                      {subtotal.toFixed(2)} €
                    </div>
                    <div className="col-span-2 text-right text-muted-foreground">
                      {vat.toFixed(2)} € <span className="text-sm">({item.vatRate}%)</span>
                    </div>
                    <div className="col-span-2 text-right font-bold text-foreground">
                      {item.total.toFixed(2)} €
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totaux */}
            <div className="space-y-3 pt-6 border-t-2 border-border">
              <div className="flex justify-between text-2xl text-muted-foreground">
                <span>Total HT</span>
                <span className="font-semibold">{getTotalHT().toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-2xl text-muted-foreground">
                <span>Total TVA</span>
                <span className="font-semibold">{getTotalVAT().toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-4xl font-bold text-foreground pt-3 border-t border-border">
                <span>Total TTC</span>
                <span className="text-primary">{getTotalTTC().toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Animation de panier */}
        <div className="flex justify-center animate-pulse">
          <ShoppingBag className="w-16 h-16 text-primary/30" />
        </div>
      </div>
    </div>
  );
};

export default CustomerDisplay;
