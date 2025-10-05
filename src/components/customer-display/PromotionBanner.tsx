import { useActivePromotions, type Promotion, type PromotionConditions } from '@/hooks/usePromotions';
import { Gift, TrendingUp, Tag } from 'lucide-react';
import { useEffect, useState } from 'react';

export const PromotionBanner = () => {
  const { data: promotions = [] } = useActivePromotions();
  const [currentIndex, setCurrentIndex] = useState(0);

  const displayPromotions = promotions.filter(p => p.show_on_display);

  useEffect(() => {
    if (displayPromotions.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayPromotions.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [displayPromotions.length]);

  if (displayPromotions.length === 0) return null;

  const currentPromo = displayPromotions[currentIndex];

  const getPromoMessage = (promo: Promotion) => {
    const conditions = promo.conditions as PromotionConditions;
    
    switch (promo.type) {
      case 'buy_x_get_y':
        return `Achetez ${conditions.buy_quantity}, Obtenez ${conditions.get_quantity} OFFERT !`;
      
      case 'spend_amount_get_discount':
        if (conditions.discount_type === 'percentage') {
          return `Dépensez ${conditions.min_amount}€, Économisez ${conditions.discount_value}% !`;
        }
        return `Dépensez ${conditions.min_amount}€, Économisez ${conditions.discount_value}€ !`;
      
      case 'cart_percentage':
        if (conditions.min_amount) {
          return `${conditions.discount_value}% de réduction dès ${conditions.min_amount}€ d'achat !`;
        }
        return `${conditions.discount_value}% de réduction sur tout le panier !`;
      
      case 'cart_fixed':
        if (conditions.min_amount) {
          return `${conditions.discount_value}€ de réduction dès ${conditions.min_amount}€ d'achat !`;
        }
        return `${conditions.discount_value}€ de réduction sur tout le panier !`;
      
      case 'product_discount':
        if (conditions.discount_type === 'percentage') {
          return `${conditions.discount_value}% de réduction sur le produit sélectionné !`;
        }
        return `${conditions.discount_value}€ de réduction sur le produit sélectionné !`;
      
      default:
        return promo.description || promo.name;
    }
  };

  return (
    <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white py-6 px-8 rounded-lg shadow-2xl animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
            <Gift className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Tag className="w-4 h-4" />
              <p className="text-sm font-medium uppercase tracking-wider opacity-90">Promotion en cours</p>
            </div>
            <h3 className="text-2xl font-bold mb-1">{currentPromo.name}</h3>
            <p className="text-lg opacity-95">{getPromoMessage(currentPromo)}</p>
          </div>
        </div>
        
        <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
          <TrendingUp className="w-10 h-10" />
        </div>
      </div>

      {displayPromotions.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {displayPromotions.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
