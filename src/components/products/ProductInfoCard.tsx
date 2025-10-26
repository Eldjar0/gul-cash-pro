import { Product } from '@/hooks/useProducts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Package, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface ProductInfoCardProps {
  product: Product;
  variant?: 'compact' | 'full' | 'minimal';
  showImage?: boolean;
}

export function ProductInfoCard({ product, variant = 'full', showImage = true }: ProductInfoCardProps) {
  // Calcul de la marge
  const margin = product.cost_price 
    ? ((product.price - product.cost_price) / product.price) * 100 
    : null;
  
  const marginColor = margin !== null
    ? margin > 20 ? 'text-green-500' : margin > 10 ? 'text-orange-500' : 'text-red-500'
    : 'text-muted-foreground';

  // Calcul du stock
  const stockPercentage = product.min_stock && product.min_stock > 0
    ? Math.min((product.stock || 0) / product.min_stock * 100, 100)
    : 100;
  
  const stockStatus = product.min_stock && product.stock !== undefined
    ? product.stock < product.min_stock 
      ? 'critical' 
      : product.stock <= product.min_stock * 1.5 
        ? 'warning' 
        : 'ok'
    : 'unknown';

  const stockColor = stockStatus === 'critical' 
    ? 'bg-red-500' 
    : stockStatus === 'warning' 
      ? 'bg-orange-500' 
      : 'bg-green-500';

  if (variant === 'minimal') {
    return (
      <Card className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold truncate flex-1">{product.name}</h3>
          <Badge variant="secondary" className="text-base font-bold">
            {product.price.toFixed(2)}€
          </Badge>
        </div>
        {product.stock !== undefined && (
          <div className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span>{product.stock} {product.unit || 'unité'}</span>
          </div>
        )}
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className="p-4 space-y-3">
        <div className="flex gap-3">
          {showImage && product.image && (
            <img 
              src={product.image}
              alt={product.name}
              className="w-16 h-16 rounded-lg object-cover border"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base truncate">{product.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-base font-bold">
                {product.price.toFixed(2)}€
              </Badge>
              {margin !== null && (
                <Badge variant="outline" className={marginColor}>
                  {margin > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {margin.toFixed(1)}%
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {product.stock !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Stock</span>
              <span className="font-semibold">{product.stock} {product.unit || 'unité'}</span>
            </div>
            {product.min_stock && (
              <Progress value={stockPercentage} className={`h-2 ${stockColor}`} />
            )}
          </div>
        )}
      </Card>
    );
  }

  // Variant 'full'
  return (
    <Card className="relative overflow-hidden">
      {/* Image de fond avec overlay */}
      {showImage && product.image && (
        <div className="absolute inset-0 opacity-10">
          <img 
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover blur-sm"
          />
        </div>
      )}
      
      <div className="relative p-6 space-y-4">
        {/* En-tête avec image et info principale */}
        <div className="flex items-start gap-4">
          {showImage && (
            <img 
              src={product.image || '/placeholder.svg'}
              alt={product.name}
              className="w-24 h-24 rounded-lg object-cover border-2 border-primary/20 shadow-lg"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
          )}
          <div className="flex-1 min-w-0 space-y-2">
            <h3 className="text-xl font-bold">{product.name}</h3>
            {product.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {product.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-lg font-bold px-3 py-1">
                {product.price.toFixed(2)}€
              </Badge>
              <Badge variant="outline">
                {product.type === 'weight' ? 'Au kilo' : 'À l\'unité'}
              </Badge>
              {product.vat_rate && (
                <Badge variant="outline">TVA {product.vat_rate}%</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Marge bénéficiaire */}
        {margin !== null && (
          <div className="flex items-center gap-2 p-3 bg-accent/50 rounded-lg">
            {margin > 0 ? (
              <TrendingUp className={`h-5 w-5 ${marginColor}`} />
            ) : (
              <TrendingDown className={`h-5 w-5 ${marginColor}`} />
            )}
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Marge bénéficiaire</p>
              <p className={`text-lg font-bold ${marginColor}`}>
                {margin.toFixed(1)}%
              </p>
            </div>
            {product.cost_price && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Prix d'achat</p>
                <p className="text-sm font-semibold">
                  {product.cost_price.toFixed(2)}€
                </p>
              </div>
            )}
          </div>
        )}

        {/* Stock avec barre de progression */}
        {product.stock !== undefined && (
          <div className="space-y-2 p-3 bg-accent/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Stock actuel</span>
              </div>
              <span className="text-xl font-bold">
                {product.stock} {product.unit || 'unité'}
              </span>
            </div>
            
            {product.min_stock && product.min_stock > 0 && (
              <>
                <Progress 
                  value={stockPercentage} 
                  className={`h-3 ${stockColor}`}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Stock minimum: {product.min_stock}</span>
                  {stockStatus === 'critical' && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Critique
                    </Badge>
                  )}
                  {stockStatus === 'warning' && (
                    <Badge variant="outline" className="gap-1 text-orange-500">
                      <AlertTriangle className="h-3 w-3" />
                      Bas
                    </Badge>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Informations techniques */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
          {product.barcode && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Code-barres</p>
              <Badge variant="secondary" className="font-mono text-xs">
                {product.barcode}
              </Badge>
            </div>
          )}
          {product.category_id && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Catégorie</p>
              <Badge variant="outline" className="text-xs">
                {product.category_id}
              </Badge>
            </div>
          )}
        </div>

      </div>
    </Card>
  );
}
