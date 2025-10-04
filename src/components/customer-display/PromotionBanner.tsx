import { useEffect, useState } from 'react';
import { Tag, TrendingDown } from 'lucide-react';
import { useActivePromotions } from '@/hooks/usePromotions';

export function PromotionBanner() {
  const { data: promotions = [] } = useActivePromotions();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (promotions.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promotions.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [promotions.length]);

  if (promotions.length === 0) return null;

  const currentPromo = promotions[currentIndex];

  return (
    <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white py-3 px-6 rounded-xl shadow-lg mb-4 animate-pulse">
      <div className="flex items-center justify-center gap-3">
        <Tag className="h-6 w-6" />
        <div className="text-center">
          <p className="text-2xl font-black tracking-tight">
            {currentPromo.name}
          </p>
          <p className="text-lg font-semibold flex items-center justify-center gap-2">
            {currentPromo.type === 'percentage' && (
              <>
                <TrendingDown className="h-5 w-5" />
                {currentPromo.value}% de réduction
              </>
            )}
            {currentPromo.type === 'fixed' && (
              <>
                <TrendingDown className="h-5 w-5" />
                {currentPromo.value}€ de réduction
              </>
            )}
            {currentPromo.min_purchase && (
              <span className="text-sm">
                • Dès {currentPromo.min_purchase}€ d'achat
              </span>
            )}
          </p>
        </div>
        {promotions.length > 1 && (
          <div className="flex gap-1">
            {promotions.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
