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
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white border-4 border-black p-8 shadow-2xl">
        {/* Header avec nom entreprise */}
        <div className="text-center mb-6 pb-6 border-b-2 border-black">
          <h1 className="text-4xl font-black uppercase mb-4 tracking-wide">
            {displayState.customer?.name || 'MAGASIN'}
          </h1>
        </div>

        {/* Tableau des articles */}
        <div className="mb-6">
          {/* En-têtes du tableau */}
          <div className="grid grid-cols-12 gap-2 mb-3 pb-2 border-b-2 border-black text-lg font-bold">
            <div className="col-span-2 text-left">QTE</div>
            <div className="col-span-5 text-left">DESIGNATION</div>
            <div className="col-span-2 text-right">UNITAIRE</div>
            <div className="col-span-3 text-right">TOTAL</div>
          </div>

          {/* Articles */}
          <div className="space-y-3">
            {displayState.items.map((item, index) => (
              <div 
                key={index} 
                className="grid grid-cols-12 gap-2 text-xl animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="col-span-2 text-left font-semibold">
                  {item.quantity.toFixed(item.unit === 'kg' ? 3 : 0)}
                </div>
                <div className="col-span-5 text-left font-bold uppercase">
                  {item.name}
                </div>
                <div className="col-span-2 text-right">
                  {item.price.toFixed(2)}
                </div>
                <div className="col-span-3 text-right font-bold">
                  {item.total.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Séparateur */}
        <div className="border-t-2 border-dashed border-black my-6"></div>

        {/* Total TTC */}
        <div className="mb-4">
          <div className="flex justify-between items-center text-3xl font-black mb-3">
            <span>TOTAL TTC</span>
            <span>{getTotalTTC().toFixed(2)} €</span>
          </div>

          {/* TVA détaillée par taux */}
          <div className="space-y-1 text-lg text-right">
            {(() => {
              // Grouper par taux de TVA
              const vatByRate = displayState.items.reduce((acc, item) => {
                const vat = calculateVAT(item);
                if (!acc[item.vatRate]) {
                  acc[item.vatRate] = 0;
                }
                acc[item.vatRate] += vat;
                return acc;
              }, {} as Record<number, number>);

              return Object.entries(vatByRate).map(([rate, amount]) => (
                <div key={rate} className="flex justify-end gap-4">
                  <span>DONT TVA {parseFloat(rate).toFixed(2)} %</span>
                  <span className="font-semibold w-24">{amount.toFixed(2)} €</span>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Séparateur */}
        <div className="border-t-2 border-dashed border-black my-6"></div>

        {/* Mode de paiement */}
        <div className="flex justify-between items-center text-2xl font-bold mb-6">
          <span>Paiement en cours...</span>
          <span></span>
        </div>

        {/* Ligne de séparation */}
        <div className="border-t-2 border-black my-6"></div>

        {/* Footer - animation d'attente */}
        <div className="text-center">
          <div className="flex justify-center gap-2">
            <div className="w-3 h-3 bg-black rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-3 h-3 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDisplay;
