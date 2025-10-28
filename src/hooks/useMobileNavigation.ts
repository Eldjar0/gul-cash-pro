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

  const goToProducts = useCallback(() => {
    navigate('/mobile/products');
  }, [navigate]);

  const goToCategories = useCallback(() => {
    navigate('/mobile/categories');
  }, [navigate]);

  const goToHome = useCallback(() => {
    navigate('/mobile');
  }, [navigate]);

  const goBack = useCallback(() => {
    const path = location.pathname;
    
    // Pages principales → Menu principal
    if (path === '/mobile/products' || 
        path === '/mobile/categories' ||
        path === '/mobile/scan-rapid' ||
        path === '/mobile/customers') {
      navigate('/mobile/management');
      return;
    }
    
    // Pages de détail → Liste correspondante
    if (path.startsWith('/mobile/product/')) {
      navigate('/mobile/products');
      return;
    }
    
    if (path.startsWith('/mobile/category/')) {
      navigate('/mobile/categories');
      return;
    }

    if (path.startsWith('/mobile/customer/')) {
      navigate('/mobile/customers');
      return;
    }
    
    // Par défaut → Menu principal
    navigate('/mobile/management');
  }, [navigate, location]);

  const getBreadcrumb = useCallback(() => {
    const path = location.pathname;
    
    if (path === '/mobile') return 'Accueil';
    if (path.startsWith('/mobile/products')) return 'Produits';
    if (path.startsWith('/mobile/product/')) return 'Détail Produit';
    if (path.startsWith('/mobile/categories')) return 'Catégories';
    if (path.startsWith('/mobile/category/')) return 'Détail Catégorie';
    
    return 'Mobile';
  }, [location]);

  return {
    goToProduct,
    goToProductCreate,
    goToCategory,
    goToProducts,
    goToCategories,
    goToHome,
    goBack,
    getBreadcrumb,
    currentPath: location.pathname,
  };
};
