import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback } from 'react';

export const useMobileNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const goToProduct = useCallback((productId: string) => {
    navigate(`/mobile/product/${productId}`);
  }, [navigate]);

  const goToProductCreate = useCallback((barcode?: string) => {
    const url = barcode ? `/mobile/product/new?barcode=${barcode}` : '/mobile/product/new';
    navigate(url);
  }, [navigate]);

  const goToCategory = useCallback((categoryId: string) => {
    navigate(`/mobile/category/${categoryId}`);
  }, [navigate]);

  const goToOrder = useCallback((orderId: string) => {
    navigate(`/mobile/order/${orderId}`);
  }, [navigate]);

  const goToProducts = useCallback(() => {
    navigate('/mobile/products');
  }, [navigate]);

  const goToCategories = useCallback(() => {
    navigate('/mobile/categories');
  }, [navigate]);

  const goToOrders = useCallback(() => {
    navigate('/mobile/orders');
  }, [navigate]);

  const goToHome = useCallback(() => {
    navigate('/mobile');
  }, [navigate]);

  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/mobile');
    }
  }, [navigate]);

  const getBreadcrumb = useCallback(() => {
    const path = location.pathname;
    
    if (path === '/mobile') return 'Accueil';
    if (path.startsWith('/mobile/products')) return 'Produits';
    if (path.startsWith('/mobile/product/')) return 'Détail Produit';
    if (path.startsWith('/mobile/categories')) return 'Catégories';
    if (path.startsWith('/mobile/category/')) return 'Détail Catégorie';
    if (path.startsWith('/mobile/orders')) return 'Commandes';
    if (path.startsWith('/mobile/order/')) return 'Détail Commande';
    
    return 'Mobile';
  }, [location]);

  return {
    goToProduct,
    goToProductCreate,
    goToCategory,
    goToOrder,
    goToProducts,
    goToCategories,
    goToOrders,
    goToHome,
    goBack,
    getBreadcrumb,
    currentPath: location.pathname,
  };
};
