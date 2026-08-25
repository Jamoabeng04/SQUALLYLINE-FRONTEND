import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ChevronLeft,
  Heart,
  ShoppingBag,
  Star,
  StarHalf,
  Calendar,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  Minus,
  Check,
  Truck,
  Shield,
  RefreshCw,
  Ruler,
  Clock,
  MapPin,
  Info,
  Package,
  CreditCard,
  HelpCircle,
  Store,
  Sparkles,
  Camera,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../providers/ToastProvider';
import { useCart } from '../providers/CartProvider';
import { useAuth } from '../providers/AuthProvider';
import { shop, measurements as measurementsApi } from '../api/endpoints';
import {
  adaptProduct,
  adaptProductDetail,
  errorText,
  formatDate,
  formatPrice,
  placeholderFor,
  GENDER_LABEL,
} from '../api/adapters';

// Store policy, not product data — the same three lines apply to every garment,
// so they live here rather than being invented per row on the backend.
const STORE_POLICY = {
  delivery: 'Same-day delivery in Accra',
  returns: '14-day return policy',
  warranty: 'Quality guaranteed',
  care: [
    'Dry clean or hand wash cold',
    'Do not bleach',
    'Iron on low heat',
    'Store in a garment bag',
  ],
  shipping: {
    free: 'Free delivery on orders over GHS 500',
    express: 'Express delivery available in Accra',
    international: 'International shipping on request',
  },
  payment: ['Mobile Money', 'Card', 'Bank Transfer'],
  brand: 'Squally Line',
};

const inches = (value) => (value == null || value === '' ? '—' : `${Number(value)}"`);

const ProductDetailsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { colors, theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const { showToast } = useToast();
  const { add } = useCart();
  const { isAuthenticated } = useAuth();

  // State
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [myMeasurements, setMyMeasurements] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewImages, setReviewImages] = useState([]);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [similarProducts, setSimilarProducts] = useState([]);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  const [expandedSections, setExpandedSections] = useState({
    details: true,
    measurements: true,
    care: true,
    shipping: false,
  });

  const imageRef = useRef(null);
  const zoomContainerRef = useRef(null);

  // Track window width for responsiveness
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  // Fold the API row into the exact field set this page renders. Anything the
  // backend has no column for comes from STORE_POLICY, not from invention.
  const shapeProduct = useCallback((row) => {
    const d = adaptProductDetail(row);
    const details = [
      d.category && `Category: ${d.category}`,
      `${GENDER_LABEL[d.gender] || 'Unisex'} fit`,
      d.size && `Size ${d.size}`,
      d.stock > 0 ? `${d.stock} in stock` : 'Currently unstocked',
      ...d.tags,
    ].filter(Boolean);

    return {
      ...d,
      images: d.images.length ? d.images : [d.image],
      sizes: d.size ? [d.size] : [],
      colors: [],
      details,
      features: d.tags,
      reviewCount: d.reviews,
      reviews: d.reviewList.map((r) => ({
        ...r,
        avatar: placeholderFor(r.id, r.user),
        date: formatDate(r.createdAt),
      })),
      delivery: STORE_POLICY.delivery,
      returns: STORE_POLICY.returns,
      warranty: STORE_POLICY.warranty,
      careInstructions: STORE_POLICY.care,
      shippingInfo: STORE_POLICY.shipping,
      paymentMethods: STORE_POLICY.payment,
      brand: STORE_POLICY.brand,
      sku: `SL-${String(d.id || '').slice(0, 8).toUpperCase()}`,
    };
  }, []);

  // Load the product. The route param is a slug; the API returns the row with
  // its gallery, tags, first page of reviews and a related strip.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    shop
      .product(productId)
      .then((row) => {
        if (cancelled) return;
        const shaped = shapeProduct(row);
        setProduct(shaped);
        setIsLiked(shaped.isLiked);
        setSelectedSize(shaped.sizes[0] || null);
        setSelectedColor(shaped.colors[0] || null);
        setActiveImageIndex(0);
        setQuantity(1);
        setSimilarProducts((row.related_products || []).map(adaptProduct));
      })
      .catch((err) => {
        if (!cancelled) setError(errorText(err, 'This piece could not be loaded.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productId, reloadKey, shapeProduct]);

  // The customer's own saved measurements, so the fit panel compares against
  // real numbers. Signed-out visitors simply don't get the panel.
  useEffect(() => {
    if (!isAuthenticated) {
      setMyMeasurements(null);
      return undefined;
    }
    let cancelled = false;
    measurementsApi
      .list()
      .then((rows) => {
        if (cancelled) return;
        const list = rows || [];
        setMyMeasurements(list.find((m) => m.is_active) || list[0] || null);
      })
      .catch(() => {
        // No measurements on file is a normal state, not an error worth showing.
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, reloadKey]);

  // Handle zoom
  const handleMouseMove = (e) => {
    if (!isZoomed || !zoomContainerRef.current) return;
    const rect = zoomContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x: Math.min(Math.max(x, 0), 100), y: Math.min(Math.max(y, 0), 100) });
  };

  const toggleZoom = () => setIsZoomed(!isZoomed);
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Handle quantity
  const increaseQuantity = () => setQuantity(q => q + 1);
  const decreaseQuantity = () => setQuantity(q => Math.max(1, q - 1));

  // The server owns the cart, so an anonymous visitor has nowhere to put this.
  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      showToast('Sign in first to add this to your bag.', 'info');
      navigate('/login');
      return;
    }
    setBusy(true);
    try {
      await add({ item_type: 'product', product_id: product.id, quantity });
      showToast(`${product.name} added to your bag.`, 'success');
    } catch (err) {
      showToast(errorText(err, 'That did not go through.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      showToast('Sign in first to save pieces.', 'info');
      navigate('/login');
      return;
    }
    // Flip immediately, roll back if the request fails.
    const next = !isLiked;
    setIsLiked(next);
    try {
      await shop.likeProduct(product.slug);
    } catch (err) {
      setIsLiked(!next);
      showToast(errorText(err, 'Could not update your likes.'), 'error');
    }
  };

  // Consultations are booked on their own screen, which knows the tiers and
  // the open slots; carry the piece through so it lands in the notes.
  const handleBookAppointment = () => {
    navigate('/appointments/book', {
      state: { productName: product?.name, productSlug: product?.slug },
    });
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      showToast('Sign in first to leave a review.', 'info');
      navigate('/login');
      return;
    }
    if (!reviewText.trim() || reviewRating < 1) {
      showToast('Pick a rating and write a line or two.', 'info');
      return;
    }
    setBusy(true);
    try {
      const review = new FormData(); review.append('rating', reviewRating); review.append('comment', reviewText.trim());
      reviewImages.forEach((item) => review.append('images', item.file));
      await shop.reviewProduct(product.slug, review);
      setReviewText('');
      setReviewRating(0);
      reviewImages.forEach((item) => URL.revokeObjectURL(item.preview)); setReviewImages([]);
      // Reviews need approval before they appear, so say so rather than
      // pretending the list will change.
      showToast('Thank you — your review is awaiting approval.', 'success');
      setReloadKey((k) => k + 1);
    } catch (err) {
      showToast(errorText(err, 'Could not submit that review.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  // Render stars
  const renderStars = (rating, size = 16) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} size={size} fill="#D4AF37" color="#D4AF37" />);
    }
    if (hasHalfStar) {
      stars.push(<StarHalf key="half" size={size} fill="#D4AF37" color="#D4AF37" />);
    }
    const remaining = 5 - stars.length;
    for (let i = 0; i < remaining; i++) {
      stars.push(<Star key={`empty-${i}`} size={size} color="rgba(212,175,55,0.22)" />);
    }
    return stars;
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: colors.mainBg, minHeight: '100vh', padding: isMobile ? 12 : 16 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="skeleton" style={{ height: 34, width: 90, borderRadius: 12, marginBottom: 16 }} />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: isMobile ? 20 : 32,
            }}
          >
            <div className="skeleton" style={{ height: isMobile ? 380 : 600, borderRadius: 16 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[28, 44, 20, 30, 80, 60, 52].map((h, i) => (
                <div key={i} className="skeleton" style={{ height: h, borderRadius: 12 }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div
        style={{
          backgroundColor: colors.mainBg,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          padding: 24,
          textAlign: 'center',
        }}
      >
        <AlertCircle size={30} style={{ color: colors.error }} />
        <p style={{ color: colors.secondaryText, fontSize: 14, margin: 0 }}>
          {error || 'This piece is no longer available.'}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => setReloadKey((k) => k + 1)}>
            Try again
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/products')}>
            Browse all pieces
          </button>
        </div>
      </div>
    );
  }

  // Compare the garment's cut against the customer's saved numbers. Only the
  // fields both sides actually have are worth reporting on, and the widest gap
  // decides the verdict — one bad measurement ruins the fit regardless of the rest.
  const myData = myMeasurements?.data || {};
  const fitRows = [
    { key: 'bust', label: 'Bust', mine: myData.bust ?? myData.chest, garment: product.measurements.bust },
    { key: 'waist', label: 'Waist', mine: myData.waist, garment: product.measurements.waist },
    { key: 'hip', label: 'Hips', mine: myData.hips, garment: product.measurements.hip },
    { key: 'shoulder', label: 'Shoulder', mine: myData.shoulder, garment: product.measurements.shoulder },
  ];
  const comparable = fitRows.filter((r) => r.mine != null && r.garment != null);
  const worstGap = comparable.reduce(
    (acc, r) => Math.max(acc, Math.abs(Number(r.garment) - Number(r.mine))),
    0
  );
  const fitVerdict = comparable.length === 0 ? null : worstGap <= 1 ? 'good' : worstGap <= 2.5 ? 'close' : 'off';
  const hasGarmentMeasurements = Object.values(product.measurements).some((v) => v != null);

  // Styles
  const pageStyle = {
    backgroundColor: colors.mainBg,
    minHeight: '100vh',
    paddingBottom: '40px',
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: isMobile ? '12px' : '16px',
  };

  const backButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '12px',
    background: isDark ? 'rgba(26,26,26,0.60)' : 'rgba(255,255,255,0.60)',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.10)' : 'rgba(212, 175, 55,0.15)'}`,
    cursor: 'pointer',
    color: colors.text,
    fontSize: '13px',
    transition: 'all 0.2s ease',
    marginBottom: '16px',
  };

  // Main layout
  const productLayoutStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap: isMobile ? '20px' : '32px',
    marginTop: '16px',
  };

  // Image Section
  const imageSectionStyle = {
    position: 'relative',
  };

  const mainImageContainerStyle = {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '16px',
    backgroundColor: isDark ? '#0A0A0A' : '#F8F6F1',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.08)' : 'rgba(212, 175, 55,0.10)'}`,
    cursor: isZoomed ? 'zoom-out' : 'zoom-in',
    height: isMobile ? '380px' : '600px',
  };

  const mainImageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
    transform: isZoomed ? 'scale(2.5)' : 'scale(1)',
    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
  };

  const imageControlsStyle = {
    position: 'absolute',
    bottom: '16px',
    right: '16px',
    display: 'flex',
    gap: '8px',
  };

  const controlButtonStyle = {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'rgba(10,10,10,0.60)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.10)',
    color: '#F8F6F1',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  };

  const thumbnailContainerStyle = {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
    overflowX: 'auto',
    paddingBottom: '4px',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  };

  const thumbnailStyle = (isActive) => ({
    width: isMobile ? '60px' : '80px',
    height: isMobile ? '60px' : '80px',
    borderRadius: '8px',
    objectFit: 'cover',
    cursor: 'pointer',
    border: isActive ? `2px solid ${colors.primary}` : `1px solid ${isDark ? 'rgba(212, 175, 55,0.10)' : 'rgba(212, 175, 55,0.15)'}`,
    opacity: isActive ? 1 : 0.6,
    transition: 'all 0.2s ease',
    flexShrink: 0,
  });

  // Details Section
  const detailsSectionStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: isMobile ? '14px' : '18px',
  };

  const productCategoryStyle = {
    fontSize: '12px',
    color: colors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const productNameStyle = {
    fontSize: isMobile ? '22px' : '28px',
    fontWeight: 800,
    color: colors.heading,
    margin: 0,
    lineHeight: 1.2,
  };

  const ratingContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  };

  const ratingTextStyle = {
    fontSize: '13px',
    color: colors.secondaryText,
  };

  const priceContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  };

  const priceStyle = {
    fontSize: isMobile ? '24px' : '28px',
    fontWeight: 700,
    color: colors.primary,
  };

  const originalPriceStyle = {
    fontSize: '16px',
    color: colors.secondaryText,
    textDecoration: 'line-through',
  };

  const discountStyle = {
    fontSize: '13px',
    fontWeight: 600,
    color: '#CC0000',
    background: 'rgba(204,0,0,0.10)',
    padding: '2px 10px',
    borderRadius: '6px',
  };

  const descriptionStyle = {
    fontSize: '14px',
    color: colors.secondaryText,
    lineHeight: 1.8,
  };

  // Feature Tags
  const featureTagsStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  };

  const featureTagStyle = {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 500,
    background: isDark ? 'rgba(212, 175, 55,0.08)' : 'rgba(212, 175, 55,0.06)',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.12)' : 'rgba(212, 175, 55,0.15)'}`,
    color: colors.primary,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  // Size Selector
  const sizeSelectorStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const sizeLabelRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const sizeLabelStyle = {
    fontSize: '13px',
    fontWeight: 600,
    color: colors.text,
  };

  const sizeGuideButtonStyle = {
    fontSize: '12px',
    color: colors.primary,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    textDecoration: 'underline',
  };

  const sizeOptionsStyle = {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  };

  const sizeButtonStyle = (isActive) => ({
    padding: '8px 20px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: isActive ? 600 : 400,
    cursor: 'pointer',
    background: isActive ? colors.primary : (isDark ? 'rgba(26,26,26,0.60)' : 'rgba(255,255,255,0.60)'),
    color: isActive ? '#1A1A1A' : colors.text,
    border: `1px solid ${isActive ? colors.primary : (isDark ? 'rgba(212, 175, 55,0.10)' : 'rgba(212, 175, 55,0.15)')}`,
    transition: 'all 0.2s ease',
  });

  // Color Selector
  const colorSelectorStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const colorOptionsStyle = {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  };

  const colorButtonStyle = (color, isActive) => ({
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: color.hex,
    cursor: 'pointer',
    border: isActive ? `2px solid ${colors.primary}` : `2px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(10,10,10,0.10)'}`,
    transition: 'all 0.2s ease',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

  // Quantity
  const quantitySelectorStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  };

  const quantityControlStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: isDark ? 'rgba(26,26,26,0.60)' : 'rgba(255,255,255,0.60)',
    borderRadius: '12px',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.10)' : 'rgba(212, 175, 55,0.15)'}`,
    padding: '4px',
  };

  const quantityButtonStyle = {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    color: colors.text,
    transition: 'all 0.2s ease',
  };

  const quantityTextStyle = {
    fontSize: '16px',
    fontWeight: 600,
    color: colors.text,
    minWidth: '32px',
    textAlign: 'center',
  };

  // Action Buttons - Fixed row on all screens
  const actionButtonsStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr auto auto' : '1fr auto auto',
    gap: '10px',
    alignItems: 'center',
  };

  const addToCartButtonStyle = {
    padding: '14px 24px',
    borderRadius: '12px',
    background: colors.primary,
    color: '#1A1A1A',
    fontSize: isMobile ? '13px' : '15px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
  };

  const actionIconButtonStyle = {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: isDark ? 'rgba(26,26,26,0.60)' : 'rgba(255,255,255,0.60)',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.15)' : 'rgba(212,175,55,0.22)'}`,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  };

  const appointmentButtonStyle = {
    padding: '12px 20px',
    borderRadius: '12px',
    background: isDark ? 'rgba(26,26,26,0.60)' : 'rgba(255,255,255,0.60)',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.15)' : 'rgba(212,175,55,0.22)'}`,
    color: colors.text,
    fontSize: isMobile ? '12px' : '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    width: '100%',
    marginTop: '4px',
  };

  // Info Cards
  const infoGridStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
    gap: '10px',
    padding: '16px 0',
    borderTop: `1px solid ${isDark ? 'rgba(212, 175, 55,0.06)' : 'rgba(212, 175, 55,0.08)'}`,
    borderBottom: `1px solid ${isDark ? 'rgba(212, 175, 55,0.06)' : 'rgba(212, 175, 55,0.08)'}`,
  };

  const infoCardStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    textAlign: 'center',
  };

  const infoIconStyle = {
    color: colors.primary,
  };

  const infoLabelStyle = {
    fontSize: '10px',
    color: colors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  };

  const infoValueStyle = {
    fontSize: '12px',
    fontWeight: 600,
    color: colors.text,
  };

  // User Measurements Section
  const userMeasurementsStyle = {
    padding: '16px',
    borderRadius: '12px',
    background: isDark ? 'rgba(212, 175, 55,0.06)' : 'rgba(212, 175, 55,0.04)',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.10)' : 'rgba(212, 175, 55,0.12)'}`,
  };

  const measurementsGridStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
    gap: '12px',
    marginTop: '8px',
  };

  const measurementItemStyle = {
    textAlign: 'center',
    padding: '8px',
    borderRadius: '8px',
    background: isDark ? 'rgba(26,26,26,0.40)' : 'rgba(255,255,255,0.50)',
  };

  // Section Accordion
  const sectionStyle = {
    borderBottom: `1px solid ${isDark ? 'rgba(212, 175, 55,0.06)' : 'rgba(212, 175, 55,0.08)'}`,
    padding: '4px 0',
  };

  const sectionHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    width: '100%',
    color: colors.text,
  };

  const sectionTitleStyle = {
    fontSize: '14px',
    fontWeight: 600,
    color: colors.text,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const sectionIconStyle = {
    color: colors.primary,
  };

  const sectionContentStyle = {
    paddingBottom: '16px',
    fontSize: '13px',
    color: colors.secondaryText,
    lineHeight: 1.6,
  };

  const listItemStyle = {
    padding: '4px 0',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  };

  // Tabs
  const tabsContainerStyle = {
    marginTop: '40px',
  };

  const tabsStyle = {
    display: 'flex',
    gap: isMobile ? '12px' : '24px',
    borderBottom: `1px solid ${isDark ? 'rgba(212, 175, 55,0.08)' : 'rgba(212, 175, 55,0.10)'}`,
    paddingBottom: '8px',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  };

  const tabStyle = (isActive) => ({
    fontSize: isMobile ? '13px' : '14px',
    fontWeight: isActive ? 600 : 400,
    color: isActive ? colors.primary : colors.secondaryText,
    cursor: 'pointer',
    padding: '4px 0',
    borderBottom: isActive ? `2px solid ${colors.primary}` : 'none',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    background: 'none',
    border: 'none',
  });

  const tabContentStyle = {
    marginTop: '20px',
  };

  // Reviews
  const reviewCardStyle = {
    padding: '16px',
    borderRadius: '12px',
    background: isDark ? 'rgba(20,20,20,0.60)' : 'rgba(255,255,255,0.60)',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.06)' : 'rgba(212, 175, 55,0.08)'}`,
    marginBottom: '12px',
  };

  const reviewHeaderStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '8px',
    flexWrap: 'wrap',
    gap: '8px',
  };

  const reviewUserStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const reviewAvatarStyle = {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    objectFit: 'cover',
  };

  const reviewUserNameStyle = {
    fontSize: '14px',
    fontWeight: 600,
    color: colors.text,
  };

  const reviewDateStyle = {
    fontSize: '11px',
    color: colors.secondaryText,
  };

  const reviewTextStyle = {
    fontSize: '13px',
    color: colors.text,
    lineHeight: 1.6,
  };

  const reviewImagesStyle = {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
    overflowX: 'auto',
    paddingBottom: '4px',
  };

  const reviewImageStyle = {
    width: '80px',
    height: '80px',
    borderRadius: '8px',
    objectFit: 'cover',
    cursor: 'pointer',
    flexShrink: 0,
  };

  // Write Review
  const writeReviewStyle = {
    padding: '16px',
    borderRadius: '12px',
    background: isDark ? 'rgba(20,20,20,0.60)' : 'rgba(255,255,255,0.60)',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.06)' : 'rgba(212, 175, 55,0.08)'}`,
    marginBottom: '20px',
  };

  // Similar Products
  const similarProductsContainerStyle = {
    overflowX: 'auto',
    display: 'flex',
    gap: '12px',
    paddingBottom: '8px',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  };

  const similarProductCardStyle = {
    flexShrink: 0,
    width: isMobile ? '140px' : '180px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
  };

  const similarProductImageStyle = {
    width: '100%',
    height: isMobile ? '160px' : '200px',
    objectFit: 'cover',
    borderRadius: '12px',
  };

  const similarProductNameStyle = {
    fontSize: '12px',
    fontWeight: 500,
    color: colors.text,
    marginTop: '8px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const similarProductPriceStyle = {
    fontSize: '13px',
    fontWeight: 600,
    color: colors.primary,
  };

  const similarProductRatingStyle = {
    fontSize: '11px',
    color: colors.secondaryText,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  // Modal
  const modalOverlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.60)',
    backdropFilter: 'blur(8px)',
    zIndex: 1000,
    display: showSizeGuide ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  };

  const modalStyle = {
    maxWidth: '480px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    background: isDark ? 'rgba(20,20,20,0.95)' : 'rgba(255,255,255,0.95)',
    borderRadius: '20px',
    padding: '32px',
    position: 'relative',
  };

  const modalCloseStyle = {
    position: 'absolute',
    top: '16px',
    right: '16px',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: isDark ? 'rgba(26,26,26,0.60)' : 'rgba(248,246,241,0.60)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.text,
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {/* Back Button */}
        <button
          style={backButtonStyle}
          onClick={() => navigate(-1)}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark ? 'rgba(212, 175, 55,0.10)' : 'rgba(212, 175, 55,0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isDark ? 'rgba(26,26,26,0.60)' : 'rgba(255,255,255,0.60)';
          }}
        >
          <ChevronLeft size={18} />
          Back
        </button>

        {/* Main Product Layout */}
        <div style={productLayoutStyle}>
          {/* Image Section */}
          <div style={imageSectionStyle}>
            <div
              ref={zoomContainerRef}
              style={mainImageContainerStyle}
              onMouseMove={handleMouseMove}
              onClick={toggleZoom}
            >
              <img
                ref={imageRef}
                src={product.images[activeImageIndex]}
                alt={product.name}
                style={mainImageStyle}
                draggable={false}
              />
              <div style={imageControlsStyle}>
                <button
                  style={controlButtonStyle}
                  onClick={(e) => { e.stopPropagation(); toggleZoom(); }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212, 175, 55,0.60)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(10,10,10,0.60)'; }}
                >
                  {isZoomed ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
                </button>
                <button
                  style={controlButtonStyle}
                  onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212, 175, 55,0.60)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(10,10,10,0.60)'; }}
                >
                  <Maximize2 size={16} />
                </button>
              </div>
            </div>

            {/* Thumbnails */}
            <div style={thumbnailContainerStyle}>
              {product.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`View ${idx + 1}`}
                  style={thumbnailStyle(activeImageIndex === idx)}
                  onClick={() => setActiveImageIndex(idx)}
                />
              ))}
            </div>
          </div>

          {/* Details Section */}
          <div style={detailsSectionStyle}>
            {/* Category */}
            <div style={productCategoryStyle}>
              {[product.category, GENDER_LABEL[product.gender]].filter(Boolean).join(' / ')}
            </div>

            {/* Name */}
            <h1 style={productNameStyle}>{product.name}</h1>

            {/* Rating */}
            <div style={ratingContainerStyle}>
              {renderStars(Number(product.rating) || 0)}
              <span style={ratingTextStyle}>
                {product.rating
                  ? `${product.rating} (${product.reviewCount} review${product.reviewCount === 1 ? '' : 's'})`
                  : 'Not yet reviewed'}
              </span>
              <span style={{ color: colors.secondaryText, fontSize: '12px' }}>•</span>
              <span
                style={{
                  fontSize: '12px',
                  color: product.inStock ? colors.primary : colors.error,
                }}
              >
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            {/* Price */}
            <div style={priceContainerStyle}>
              <span style={priceStyle}>{formatPrice(product.price)}</span>
              {product.originalPrice > product.price && (
                <>
                  <span style={originalPriceStyle}>{formatPrice(product.originalPrice)}</span>
                  <span style={discountStyle}>
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <p style={descriptionStyle}>{product.description}</p>

            {/* Feature Tags — the garment's own tags, so nothing shows when it has none */}
            {product.features.length > 0 && (
              <div style={featureTagsStyle}>
                {product.features.map((feature, idx) => (
                  <span key={idx} style={featureTagStyle}>
                    <Sparkles size={12} />
                    {feature}
                  </span>
                ))}
              </div>
            )}

            {/* Size Selector — ready-to-wear rows carry a single cut size */}
            {product.sizes.length > 0 && (
              <div style={sizeSelectorStyle}>
                <div style={sizeLabelRowStyle}>
                  <span style={sizeLabelStyle}>
                    {product.sizes.length === 1 ? 'Size' : 'Select Size'}
                  </span>
                  <button style={sizeGuideButtonStyle} onClick={() => setShowSizeGuide(true)}>
                    Size Guide
                  </button>
                </div>
                <div style={sizeOptionsStyle}>
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      style={sizeButtonStyle(selectedSize === size)}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector — kept for rows that carry colourways; the current
                catalogue has none, so it stays hidden rather than faked */}
            {product.colors.length > 0 && (
              <div style={colorSelectorStyle}>
                <span style={sizeLabelStyle}>Select Color</span>
                <div style={colorOptionsStyle}>
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      style={colorButtonStyle(color, selectedColor?.name === color.name)}
                      onClick={() => setSelectedColor(color)}
                    >
                      {selectedColor?.name === color.name && (
                        <Check size={14} color={color.hex === '#F1EAD9' ? '#1A1A1A' : '#FFFFFF'} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Actions - Fixed row */}
            <div style={quantitySelectorStyle}>
              <span style={sizeLabelStyle}>Quantity</span>
              <div style={quantityControlStyle}>
                <button style={quantityButtonStyle} onClick={decreaseQuantity}>
                  <Minus size={16} />
                </button>
                <span style={quantityTextStyle}>{quantity}</span>
                <button
                  style={quantityButtonStyle}
                  onClick={increaseQuantity}
                  disabled={product.stock > 0 && quantity >= product.stock}
                >
                  <Plus size={16} />
                </button>
              </div>
              {product.stock > 0 && product.stock <= 5 && (
                <span style={{ fontSize: '11px', color: colors.primary, marginLeft: 'auto' }}>
                  Only {product.stock} left
                </span>
              )}
            </div>

            {/* Action Buttons - Always on same row */}
            <div style={actionButtonsStyle}>
              <button
                style={{
                  ...addToCartButtonStyle,
                  opacity: !product.inStock || busy ? 0.55 : 1,
                  cursor: !product.inStock || busy ? 'not-allowed' : 'pointer',
                }}
                onClick={handleAddToCart}
                disabled={!product.inStock || busy}
                onMouseEnter={(e) => {
                  if (product.inStock && !busy) {
                    e.currentTarget.style.background = isDark ? '#F0D888' : '#927619';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = colors.primary;
                }}
              >
                <ShoppingBag size={isMobile ? 16 : 18} />
                {!product.inStock ? 'Sold Out' : isMobile ? 'Add' : 'Add to Cart'}
              </button>
              <button
                style={actionIconButtonStyle}
                onClick={handleToggleLike}
                title={isLiked ? 'Remove from likes' : 'Like this piece'}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark ? 'rgba(212, 175, 55,0.15)' : 'rgba(212, 175, 55,0.10)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDark ? 'rgba(26,26,26,0.60)' : 'rgba(255,255,255,0.60)';
                }}
              >
                <Heart
                  size={18}
                  fill={isLiked ? colors.primary : 'none'}
                  color={isLiked ? colors.primary : colors.text}
                />
              </button>
              <button
                style={actionIconButtonStyle}
                onClick={handleBookAppointment}
                title="Book a consultation"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark ? 'rgba(212, 175, 55,0.15)' : 'rgba(212, 175, 55,0.10)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDark ? 'rgba(26,26,26,0.60)' : 'rgba(255,255,255,0.60)';
                }}
              >
                <Calendar size={18} />
              </button>
            </div>

            {isMobile && (
              <button
                style={appointmentButtonStyle}
                onClick={handleBookAppointment}
              >
                <Calendar size={16} />
                Book a Consultation
              </button>
            )}

            {/* Info Cards */}
            <div style={infoGridStyle}>
              <div style={infoCardStyle}>
                <Truck size={18} style={infoIconStyle} />
                <span style={infoLabelStyle}>Delivery</span>
                <span style={infoValueStyle}>{product.delivery}</span>
              </div>
              <div style={infoCardStyle}>
                <RefreshCw size={18} style={infoIconStyle} />
                <span style={infoLabelStyle}>Returns</span>
                <span style={infoValueStyle}>{product.returns}</span>
              </div>
              <div style={infoCardStyle}>
                <Shield size={18} style={infoIconStyle} />
                <span style={infoLabelStyle}>Warranty</span>
                <span style={infoValueStyle}>{product.warranty}</span>
              </div>
            </div>

            {/* Your Measurements — real saved numbers, or a nudge to add them */}
            <div style={userMeasurementsStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Ruler size={16} color={colors.primary} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: colors.text }}>
                  Your Measurements
                </span>
                {myMeasurements && (
                  <span style={{ fontSize: '11px', color: colors.secondaryText, marginLeft: 'auto' }}>
                    Updated {formatDate(myMeasurements.updated_at || myMeasurements.created_at)}
                  </span>
                )}
              </div>

              {myMeasurements ? (
                <>
                  <div style={measurementsGridStyle}>
                    {fitRows.map((row) => (
                      <div key={row.key} style={measurementItemStyle}>
                        <div style={{ fontSize: '10px', color: colors.secondaryText, textTransform: 'uppercase' }}>
                          {row.label}
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: colors.text }}>
                          {inches(row.mine)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '11px', color: colors.secondaryText, marginTop: '8px', textAlign: 'center' }}>
                    {fitVerdict === 'good' && (
                      <span style={{ color: colors.primary, fontWeight: 600 }}>
                        ✓ This cut matches your measurements
                      </span>
                    )}
                    {fitVerdict === 'close' && (
                      <span>Close to your measurements — within {worstGap.toFixed(1)}"</span>
                    )}
                    {fitVerdict === 'off' && (
                      <span>
                        Off your measurements by up to {worstGap.toFixed(1)}". Book a consultation to have it
                        adjusted.
                      </span>
                    )}
                    {!fitVerdict && <span>This piece has no published measurements to compare against.</span>}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '12px', color: colors.secondaryText, padding: '4px 0' }}>
                  {isAuthenticated
                    ? 'No measurements on file yet.'
                    : 'Sign in and save your measurements to check the fit.'}
                  <button
                    className="btn btn-ghost"
                    style={{ marginTop: 10, display: 'block', fontSize: 12, padding: '6px 14px' }}
                    onClick={() => navigate(isAuthenticated ? '/measure' : '/login')}
                  >
                    {isAuthenticated ? 'Add measurements' : 'Sign in'}
                  </button>
                </div>
              )}
            </div>

            {/* Details Accordion Sections */}
            <div style={{ marginTop: '4px' }}>
              {/* Product Details */}
              <div style={sectionStyle}>
                <button style={sectionHeaderStyle} onClick={() => toggleSection('details')}>
                  <span style={sectionTitleStyle}>
                    <Package size={18} style={sectionIconStyle} />
                    Product Details
                  </span>
                  {expandedSections.details ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {expandedSections.details && (
                  <div style={sectionContentStyle}>
                    {product.details.map((detail, idx) => (
                      <div key={idx} style={listItemStyle}>
                        <Check size={14} color={colors.primary} style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span>{detail}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${isDark ? 'rgba(212, 175, 55,0.06)' : 'rgba(212, 175, 55,0.08)'}` }}>
                      <div style={listItemStyle}>
                        <Store size={14} color={colors.primary} style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span>Brand: {product.brand}</span>
                      </div>
                      <div style={listItemStyle}>
                        <Package size={14} color={colors.primary} style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span>SKU: {product.sku}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Measurements */}
              <div style={sectionStyle}>
                <button style={sectionHeaderStyle} onClick={() => toggleSection('measurements')}>
                  <span style={sectionTitleStyle}>
                    <Ruler size={18} style={sectionIconStyle} />
                    Measurements & Fit
                  </span>
                  {expandedSections.measurements ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {expandedSections.measurements && (
                  <div style={sectionContentStyle}>
                    {hasGarmentMeasurements ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                        {[
                          { label: 'Bust', value: product.measurements.bust },
                          { label: 'Waist', value: product.measurements.waist },
                          { label: 'Hip', value: product.measurements.hip },
                          { label: 'Shoulder', value: product.measurements.shoulder },
                        ].map((m) => (
                          <div
                            key={m.label}
                            style={{
                              padding: '8px',
                              borderRadius: '8px',
                              background: isDark ? 'rgba(26,26,26,0.40)' : 'rgba(248,246,241,0.40)',
                              textAlign: 'center',
                            }}
                          >
                            <div style={{ fontSize: '10px', color: colors.secondaryText }}>{m.label}</div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: colors.text }}>
                              {inches(m.value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '12px', color: colors.secondaryText, margin: '0 0 12px' }}>
                        Measurements for this piece haven't been published. Book a consultation and we'll take
                        yours instead.
                      </p>
                    )}
                    <div style={{ fontSize: '12px', color: colors.secondaryText, padding: '8px', borderRadius: '8px', background: isDark ? 'rgba(212, 175, 55,0.04)' : 'rgba(212, 175, 55,0.03)' }}>
                      <Info size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      Measurements are in inches. Every piece can be adjusted to your own numbers.
                    </div>
                  </div>
                )}
              </div>

              {/* Care Instructions */}
              <div style={sectionStyle}>
                <button style={sectionHeaderStyle} onClick={() => toggleSection('care')}>
                  <span style={sectionTitleStyle}>
                    <HelpCircle size={18} style={sectionIconStyle} />
                    Care Instructions
                  </span>
                  {expandedSections.care ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {expandedSections.care && (
                  <div style={sectionContentStyle}>
                    {product.careInstructions.map((instruction, idx) => (
                      <div key={idx} style={listItemStyle}>
                        <Check size={14} color={colors.primary} style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span>{instruction}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Shipping & Payment */}
              <div style={sectionStyle}>
                <button style={sectionHeaderStyle} onClick={() => toggleSection('shipping')}>
                  <span style={sectionTitleStyle}>
                    <Truck size={18} style={sectionIconStyle} />
                    Shipping & Payment
                  </span>
                  {expandedSections.shipping ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {expandedSections.shipping && (
                  <div style={sectionContentStyle}>
                    <div style={listItemStyle}>
                      <Truck size={14} color={colors.primary} style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span>{product.shippingInfo.free}</span>
                    </div>
                    <div style={listItemStyle}>
                      <Clock size={14} color={colors.primary} style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span>{product.shippingInfo.express}</span>
                    </div>
                    <div style={listItemStyle}>
                      <MapPin size={14} color={colors.primary} style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span>{product.shippingInfo.international}</span>
                    </div>
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${isDark ? 'rgba(212, 175, 55,0.06)' : 'rgba(212, 175, 55,0.08)'}` }}>
                      <div style={listItemStyle}>
                        <CreditCard size={14} color={colors.primary} style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span>{product.paymentMethods.join(' • ')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div style={tabsContainerStyle}>
          <div style={tabsStyle}>
            <button style={tabStyle(true)} type="button">
              Reviews ({product.reviewCount})
            </button>
          </div>

          <div style={tabContentStyle}>
            <div>
              {/* Write Review */}
              <div style={writeReviewStyle}>
                <span style={sizeLabelStyle}>Write a Review</span>
                <div style={{ display: 'flex', gap: '4px', margin: '8px 0' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <Star
                        size={24}
                        fill={star <= reviewRating ? '#D4AF37' : 'none'}
                        color={star <= reviewRating ? '#D4AF37' : 'rgba(212,175,55,0.22)'}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px',
                    borderRadius: '8px',
                    background: isDark ? 'rgba(26,26,26,0.60)' : 'rgba(255,255,255,0.80)',
                    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.10)' : 'rgba(212, 175, 55,0.15)'}`,
                    color: colors.text,
                    fontSize: '13px',
                    resize: 'vertical',
                    minHeight: '80px',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                  placeholder="Share your experience..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                />
                <label className="review-photo-picker"><input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event)=>setReviewImages([...event.target.files].slice(0,5).map(file=>({file,preview:URL.createObjectURL(file)})))}/><Camera size={16}/><span>Add up to 5 customer photos</span></label>
                {!!reviewImages.length&&<div className="review-photo-previews">{reviewImages.map((item,index)=><figure key={item.preview}><img src={item.preview} alt="Review upload preview"/><button type="button" onClick={()=>{URL.revokeObjectURL(item.preview);setReviewImages(current=>current.filter((_,i)=>i!==index))}}><X size={13}/></button></figure>)}</div>}
                <button
                  style={{
                    marginTop: '8px',
                    padding: '8px 20px',
                    borderRadius: '12px',
                    background: colors.primary,
                    color: '#1A1A1A',
                    border: 'none',
                    cursor: busy ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    opacity: busy ? 0.6 : 1,
                  }}
                  onClick={handleSubmitReview}
                  disabled={busy}
                >
                  {busy ? 'Sending…' : 'Submit Review'}
                </button>
              </div>

              {/* Reviews List — only approved reviews come back from the API */}
              {product.reviews.length === 0 ? (
                <p style={{ fontSize: '13px', color: colors.secondaryText, padding: '8px 0' }}>
                  No reviews yet. Be the first to write one.
                </p>
              ) : (
                product.reviews.map((review) => (
                  <div key={review.id} style={reviewCardStyle}>
                    <div style={reviewHeaderStyle}>
                      <div style={reviewUserStyle}>
                        <img src={review.avatar} alt={review.user} style={reviewAvatarStyle} />
                        <div>
                          <div style={reviewUserNameStyle}>{review.user}</div>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            {renderStars(review.rating, 12)}
                          </div>
                        </div>
                      </div>
                      <span style={reviewDateStyle}>{review.date}</span>
                    </div>
                    <p style={reviewTextStyle}>{review.text}</p>
                    {review.images.length > 0 && (
                      <div style={reviewImagesStyle}>
                        {review.images.map((img, idx) => (
                          <img key={idx} src={img} alt={`Review ${idx + 1}`} style={reviewImageStyle} />
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Similar Products — the API's related strip, hidden when it is empty */}
        {similarProducts.length > 0 && (
          <div style={{ marginTop: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: colors.heading, marginBottom: '16px' }}>
              You May Also Like
            </h2>
            <div style={similarProductsContainerStyle}>
              {similarProducts.map((item) => (
                <div
                  key={item.id}
                  style={similarProductCardStyle}
                  onClick={() => navigate(`/product/${item.slug || item.id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <img src={item.image} alt={item.name} style={similarProductImageStyle} />
                  <div style={similarProductNameStyle}>{item.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={similarProductPriceStyle}>{formatPrice(item.price)}</span>
                    {item.rating && (
                      <span style={similarProductRatingStyle}>
                        <Star size={10} fill="#D4AF37" color="#D4AF37" />
                        {item.rating}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Size Guide Modal */}
        <div style={modalOverlayStyle} onClick={() => setShowSizeGuide(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <button style={modalCloseStyle} onClick={() => setShowSizeGuide(false)}>
              <X size={18} />
            </button>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: colors.heading, marginBottom: '16px' }}>
              Size Guide
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: isDark ? 'rgba(212, 175, 55,0.08)' : 'rgba(212, 175, 55,0.05)' }}>
                    <th style={{ padding: '10px', textAlign: 'left', color: colors.text, fontWeight: 600 }}>Size</th>
                    <th style={{ padding: '10px', textAlign: 'left', color: colors.text, fontWeight: 600 }}>Bust</th>
                    <th style={{ padding: '10px', textAlign: 'left', color: colors.text, fontWeight: 600 }}>Waist</th>
                    <th style={{ padding: '10px', textAlign: 'left', color: colors.text, fontWeight: 600 }}>Hip</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { size: 'XS', bust: '30-32"', waist: '24-26"', hip: '32-34"' },
                    { size: 'S', bust: '32-34"', waist: '26-28"', hip: '34-36"' },
                    { size: 'M', bust: '34-36"', waist: '28-30"', hip: '36-38"' },
                    { size: 'L', bust: '36-38"', waist: '30-32"', hip: '38-40"' },
                    { size: 'XL', bust: '38-40"', waist: '32-34"', hip: '40-42"' },
                  ].map((row) => (
                    <tr key={row.size} style={{ borderBottom: `1px solid ${isDark ? 'rgba(212, 175, 55,0.06)' : 'rgba(212, 175, 55,0.08)'}` }}>
                      <td style={{ padding: '10px', color: colors.text, fontWeight: 600 }}>{row.size}</td>
                      <td style={{ padding: '10px', color: colors.secondaryText }}>{row.bust}</td>
                      <td style={{ padding: '10px', color: colors.secondaryText }}>{row.waist}</td>
                      <td style={{ padding: '10px', color: colors.secondaryText }}>{row.hip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: '12px', color: colors.secondaryText, marginTop: '12px' }}>
              <Info size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              Measurements are in inches. If you're between sizes, we recommend sizing up for a comfortable fit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
