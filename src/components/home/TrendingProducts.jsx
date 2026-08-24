import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Flame, Sparkles } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../providers/ToastProvider';
import { useCart } from '../../providers/CartProvider';
import { useAuth } from '../../providers/AuthProvider';
import ProductCard from '../ProductCard';
import { shop } from '../../api/endpoints';
import { adaptProduct, errorText } from '../../api/adapters';

const TrendingProducts = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { add } = useCart();
  const { isAuthenticated } = useAuth();

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  // Most-viewed ready-to-wear, capped at two rows on the widest layout.
  useEffect(() => {
    let cancelled = false;
    shop
      .products({ ordering: '-views' })
      .then((data) => {
        if (cancelled) return;
        setProducts((data?.results || []).slice(0, 8).map(adaptProduct));
      })
      .catch(() => {
        // Decorative rail — stay quiet and let the rest of the page load.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleProductPress = (productId) => {
    const item = products.find((p) => p.id === productId);
    navigate(`/product/${item?.slug || productId}`);
  };

  const handleProductAction = async (action, payload) => {
    const id = typeof payload === 'object' ? payload.id : payload;
    const item = products.find((p) => p.id === id);
    if (!item) return;

    if (!isAuthenticated && (action === 'like' || action === 'addToCart')) {
      showToast('Sign in first to save or buy.', 'info');
      navigate('/login');
      return;
    }

    try {
      if (action === 'like') {
        await shop.likeProduct(item.slug);
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isLiked: !p.isLiked } : p)));
      } else if (action === 'addToCart' || action === 'updateCart') {
        await add({
          item_type: 'product',
          product_id: item.id,
          quantity: typeof payload === 'object' ? payload.quantity : 1,
        });
        showToast(`${item.name} added to your bag.`, 'success');
      }
    } catch (err) {
      showToast(errorText(err, 'That did not go through.'), 'error');
    }
  };

  // Styles
  const sectionStyle = {
    margin: isMobile ? '20px 0' : '32px 0',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isMobile ? '14px' : '18px',
  };

  const titleContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const titleStyle = {
    fontSize: isMobile ? '20px' : '26px',
    fontWeight: 700,
    color: colors.heading,
    margin: 0,
  };

  const titleIconStyle = {
    color: colors.primary,
  };

  const viewAllStyle = {
    fontSize: isMobile ? '12px' : '14px',
    color: colors.primary,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    fontFamily: 'inherit',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile
      ? 'repeat(2, 1fr)'
      : isTablet
        ? 'repeat(3, 1fr)'
        : 'repeat(4, 1fr)',
    gap: isMobile ? '12px' : '16px',
  };

  // Nothing in the catalogue yet — drop the section entirely.
  if (!loading && products.length === 0) return null;

  return (
    <div style={sectionStyle}>
      <div style={headerStyle}>
        <div style={titleContainerStyle}>
          <Flame size={isMobile ? 20 : 24} color="#EF4444" />
          <h2 style={titleStyle}>Trending Products</h2>
          <Sparkles size={isMobile ? 14 : 18} style={titleIconStyle} />
        </div>
        <button style={viewAllStyle} onClick={() => navigate('/products')}>
          View All <ChevronRight size={16} />
        </button>
      </div>

      <div style={gridStyle}>
        {loading
          ? Array.from({ length: isMobile ? 4 : 8 }).map((_, i) => (
              <div
                key={`product-skeleton-${i}`}
                className="skeleton"
                style={{ height: isMobile ? '250px' : '340px', borderRadius: '12px' }}
              />
            ))
          : products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={handleProductPress}
                onAction={handleProductAction}
              />
            ))}
      </div>
    </div>
  );
};

export default TrendingProducts;
