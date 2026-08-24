import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    Search,
    Filter,
    Grid,
    List,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    X,
    AlertCircle,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../providers/ToastProvider';
import { useCart } from '../providers/CartProvider';
import { useAuth } from '../providers/AuthProvider';
import ProductCard from '../components/ProductCard';
import { shop } from '../api/endpoints';
import { adaptProduct, adaptCategory, errorText, GENDER_LABEL } from '../api/adapters';

const SORT_OPTIONS = [
    { value: '-created_at', label: 'Newest' },
    { value: 'price', label: 'Price: Low to High' },
    { value: '-price', label: 'Price: High to Low' },
    { value: '-views', label: 'Most Popular' },
    { value: 'name', label: 'Name A–Z' },
];

const CategoryDetailsPage = () => {
    const navigate = useNavigate();
    const { categoryId, subcategoryId } = useParams();
    const { colors, theme } = useTheme();
    const isDark = theme.mode === 'dark';
    const { showToast } = useToast();
    const { add } = useCart();
    const { isAuthenticated } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    const [tree, setTree] = useState([]);
    const [category, setCategory] = useState(null);
    const [subcategories, setSubcategories] = useState([]);
    const [categoryError, setCategoryError] = useState('');
    const [categoryLoading, setCategoryLoading] = useState(true);

    const [products, setProducts] = useState([]);
    const [count, setCount] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [viewMode, setViewMode] = useState('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [windowWidth, setWindowWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : 1024
    );

    // Query state lives in the URL so a filtered category view is shareable.
    const page = Number(searchParams.get('page') || 1);
    const search = searchParams.get('search') || '';
    const ordering = searchParams.get('ordering') || '-created_at';
    const gender = searchParams.get('gender') || '';
    const onSale = searchParams.get('on_sale') === 'true';
    const inStock = searchParams.get('in_stock') === 'true';
    const [searchDraft, setSearchDraft] = useState(search);

    // The narrowest slug wins: a chosen subcategory filters to itself, otherwise
    // the parent rolls its whole subtree up.
    const activeSlug = subcategoryId || categoryId;

    const setParam = useCallback(
        (patch) => {
            const next = new URLSearchParams(searchParams);
            Object.entries(patch).forEach(([k, v]) => {
                if (v === '' || v === null || v === undefined || v === false) next.delete(k);
                else next.set(k, String(v));
            });
            if (!('page' in patch)) next.delete('page');
            setSearchParams(next, { replace: true });
        },
        [searchParams, setSearchParams]
    );

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        let cancelled = false;
        shop
            .categoryTree()
            .then((rows) => {
                if (!cancelled) setTree((rows || []).map(adaptCategory));
            })
            .catch(() => {
                // The switcher is a convenience; its absence shouldn't block the grid.
            });
        return () => {
            cancelled = true;
        };
    }, []);

    // Header and subcategory strip always describe the parent, even when a
    // child is selected, so the user keeps their bearings.
    useEffect(() => {
        let cancelled = false;
        setCategoryLoading(true);
        shop
            .category(categoryId)
            .then((row) => {
                if (cancelled) return;
                setCategory(adaptCategory(row));
                setSubcategories((row?.subcategories || []).map(adaptCategory));
                setCategoryError('');
            })
            .catch((err) => {
                if (!cancelled) setCategoryError(errorText(err, 'Category not found.'));
            })
            .finally(() => {
                if (!cancelled) setCategoryLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [categoryId]);

    useEffect(() => {
        setSearchDraft(search);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categoryId, subcategoryId]);

    useEffect(() => {
        if (searchDraft === search) return undefined;
        const timer = setTimeout(() => setParam({ search: searchDraft }), 400);
        return () => clearTimeout(timer);
    }, [searchDraft, search, setParam]);

    useEffect(() => {
        if (!activeSlug) return undefined;
        let cancelled = false;
        setLoading(true);

        const params = { page, ordering, category: activeSlug };
        if (search) params.search = search;
        if (gender) params.gender = gender;
        if (onSale) params.on_sale = 'true';
        if (inStock) params.in_stock = 'true';

        shop
            .products(params)
            .then((data) => {
                if (cancelled) return;
                setProducts((data?.results || []).map(adaptProduct));
                setCount(data?.count ?? 0);
                setTotalPages(data?.total_pages ?? 1);
                setError('');
            })
            .catch((err) => {
                if (!cancelled) setError(errorText(err, 'Could not load products.'));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [activeSlug, page, ordering, search, gender, onSale, inStock]);

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
                setProducts((prev) =>
                    prev.map((p) => (p.id === id ? { ...p, isLiked: !p.isLiked } : p))
                );
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

    const handleCategoryChange = (slug) => {
        setShowCategoryDropdown(false);
        navigate(`/categories/${slug}`);
    };

    const handleSubcategoryChange = (slug) => {
        if (slug === 'all') navigate(`/categories/${categoryId}`);
        else navigate(`/categories/${categoryId}/${slug}`);
    };

    const clearFilters = () => {
        setSearchDraft('');
        setSearchParams(new URLSearchParams(), { replace: true });
    };

    const activeFilterCount =
        (gender ? 1 : 0) + (onSale ? 1 : 0) + (inStock ? 1 : 0);

    const activeSubcategory = subcategoryId || 'all';
    const subNavItems = useMemo(
        () => [{ id: 'all', slug: 'all', name: 'All' }, ...subcategories],
        [subcategories]
    );

    const getMinMaxValue = () => {
        if (viewMode === 'list') return '1fr';
        if (windowWidth < 480) return 'minmax(140px, 1fr)';
        if (windowWidth < 640) return 'minmax(160px, 1fr)';
        if (windowWidth < 768) return 'minmax(180px, 1fr)';
        if (windowWidth < 1024) return 'minmax(200px, 1fr)';
        if (windowWidth < 1280) return 'minmax(220px, 1fr)';
        return 'minmax(240px, 1fr)';
    };

    // Styles
    const pageStyle = {
        backgroundColor: colors.mainBg,
        minHeight: '100vh',
        paddingBottom: '40px',
    };

    const headerStyle = {
        padding: '16px 20px 12px',
        borderBottom: `1px solid ${isDark ? 'rgba(168, 137, 79,0.08)' : 'rgba(168, 137, 79,0.12)'}`,
        backgroundColor: isDark ? 'rgba(10,10,10,0.60)' : 'rgba(248,246,241,0.60)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
    };

    const headerTopStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
    };

    const titleContainerStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    };

    const backButtonStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: isDark ? 'rgba(26,26,26,0.60)' : 'rgba(255,255,255,0.60)',
        border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.10)' : 'rgba(168, 137, 79,0.15)'}`,
        cursor: 'pointer',
        color: colors.text,
        transition: 'all 0.2s ease',
    };

    const titleStyle = {
        fontSize: '22px',
        fontWeight: 800,
        color: colors.heading,
        letterSpacing: '-0.3px',
        margin: 0,
    };

    const categoryDropdownStyle = {
        position: 'relative',
        display: 'inline-block',
    };

    const dropdownTriggerStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '20px',
        background: isDark ? 'rgba(26,26,26,0.60)' : 'rgba(255,255,255,0.60)',
        border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.10)' : 'rgba(168, 137, 79,0.15)'}`,
        cursor: 'pointer',
        color: colors.secondaryText,
        fontSize: '12px',
        fontWeight: 500,
        transition: 'all 0.2s ease',
        fontFamily: 'inherit',
    };

    const dropdownMenuStyle = {
        position: 'absolute',
        top: 'calc(100% + 8px)',
        left: 0,
        minWidth: '200px',
        maxHeight: '300px',
        overflowY: 'auto',
        background: isDark ? 'rgba(20,20,20,0.95)' : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.10)' : 'rgba(168, 137, 79,0.15)'}`,
        borderRadius: '12px',
        padding: '6px',
        boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.40)' : '0 12px 40px rgba(0,0,0,0.08)',
        zIndex: 20,
        display: showCategoryDropdown ? 'block' : 'none',
    };

    const dropdownItemStyle = (active) => ({
        padding: '10px 14px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: active ? 600 : 400,
        color: active ? colors.primary : colors.text,
        background: active ? (isDark ? 'rgba(168, 137, 79,0.10)' : 'rgba(168, 137, 79,0.06)') : 'transparent',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    });

    const headerActionsStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    };

    const viewToggleStyle = {
        display: 'flex',
        gap: '4px',
        background: isDark ? 'rgba(26,26,26,0.60)' : 'rgba(255,255,255,0.60)',
        borderRadius: '8px',
        padding: '4px',
        border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.10)' : 'rgba(168, 137, 79,0.15)'}`,
    };

    const viewButtonStyle = (active) => ({
        padding: '6px',
        borderRadius: '6px',
        cursor: 'pointer',
        background: active ? colors.primary : 'transparent',
        color: active ? '#1A1A1A' : colors.secondaryText,
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
    });

    const searchWrapperStyle = {
        position: 'relative',
        width: '100%',
    };

    const searchInputStyle = {
        width: '100%',
        boxSizing: 'border-box',
        padding: '10px 40px',
        borderRadius: '12px',
        background: isDark ? 'rgba(26,26,26,0.80)' : 'rgba(255,255,255,0.80)',
        border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.10)' : 'rgba(168, 137, 79,0.15)'}`,
        fontSize: '13px',
        color: colors.text,
        outline: 'none',
        transition: 'all 0.2s ease',
        fontFamily: 'inherit',
    };

    const filterBarStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '12px',
        gap: '8px',
    };

    const filterButtonStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        borderRadius: '20px',
        background: isDark ? 'rgba(26,26,26,0.60)' : 'rgba(255,255,255,0.60)',
        border: `1px solid ${isDark ? 'rgba(168, 137, 79,0.10)' : 'rgba(168, 137, 79,0.15)'}`,
        fontSize: '12px',
        color: colors.text,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontFamily: 'inherit',
    };

    const sortSelectStyle = {
        ...filterButtonStyle,
        appearance: 'none',
        paddingRight: '30px',
        outline: 'none',
    };

    const filterPanelStyle = {
        padding: '16px 20px',
        background: isDark ? 'rgba(20,20,20,0.90)' : 'rgba(255,255,255,0.90)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${isDark ? 'rgba(168, 137, 79,0.08)' : 'rgba(168, 137, 79,0.12)'}`,
        display: showFilters ? 'block' : 'none',
    };

    const filterSectionStyle = {
        marginBottom: '12px',
    };

    const filterLabelStyle = {
        fontSize: '11px',
        fontWeight: 600,
        color: colors.secondaryText,
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        marginBottom: '8px',
        display: 'block',
    };

    const categoryChipsStyle = {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
    };

    const categoryChipStyle = (active) => ({
        padding: '4px 14px',
        borderRadius: '16px',
        fontSize: '11px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        background: active ? colors.primary : isDark ? 'rgba(26,26,26,0.60)' : 'rgba(248,246,241,0.60)',
        color: active ? '#1A1A1A' : colors.secondaryText,
        border: `1px solid ${active ? colors.primary : isDark ? 'rgba(168, 137, 79,0.08)' : 'rgba(168, 137, 79,0.10)'}`,
        fontFamily: 'inherit',
    });

    const clearFiltersStyle = {
        fontSize: '11px',
        color: colors.primary,
        cursor: 'pointer',
        background: 'none',
        border: 'none',
        padding: 0,
        fontFamily: 'inherit',
    };

    const subNavStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '12px 16px',
        overflowX: 'auto',
        borderBottom: `1px solid ${isDark ? 'rgba(168, 137, 79,0.06)' : 'rgba(168, 137, 79,0.08)'}`,
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
    };

    const subNavItemStyle = (active) => ({
        padding: '6px 16px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: active ? 600 : 400,
        color: active ? '#1A1A1A' : colors.secondaryText,
        background: active ? colors.primary : 'transparent',
        border: `1px solid ${active ? colors.primary : isDark ? 'rgba(168, 137, 79,0.08)' : 'rgba(168, 137, 79,0.10)'}`,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.2s ease',
        fontFamily: 'inherit',
    });

    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: viewMode === 'list' ? '1fr' : `repeat(auto-fit, ${getMinMaxValue()})`,
        gap: windowWidth < 480 ? '12px' : '16px',
        padding: '16px',
    };

    const emptyStateStyle = {
        textAlign: 'center',
        padding: '80px 20px',
        color: colors.secondaryText,
    };

    const emptyStateIconStyle = {
        fontSize: '48px',
        color: colors.primary,
        opacity: 0.3,
        marginBottom: '16px',
    };

    const resultCountStyle = {
        fontSize: '12px',
        color: colors.secondaryText,
        padding: '0 16px 8px',
    };

    if (categoryError) {
        return (
            <div style={pageStyle}>
                <div style={emptyStateStyle}>
                    <div style={emptyStateIconStyle}>✦</div>
                    <p style={{ fontSize: '16px', fontWeight: 600, color: colors.text }}>
                        Category not found
                    </p>
                    <button
                        onClick={() => navigate('/categories')}
                        style={{
                            marginTop: '16px',
                            padding: '8px 24px',
                            borderRadius: '20px',
                            background: colors.primary,
                            color: '#1A1A1A',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 600,
                            fontFamily: 'inherit',
                        }}
                    >
                        Browse Categories
                    </button>
                </div>
            </div>
        );
    }

    const heading = category?.name || (categoryLoading ? 'Loading…' : categoryId);

    return (
        <div style={pageStyle}>
            {/* Header */}
            <div style={headerStyle}>
                <div style={headerTopStyle}>
                    <div style={titleContainerStyle}>
                        <button
                            style={backButtonStyle}
                            onClick={() => navigate('/categories')}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = isDark
                                    ? 'rgba(168, 137, 79,0.10)'
                                    : 'rgba(168, 137, 79,0.06)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = isDark
                                    ? 'rgba(26,26,26,0.60)'
                                    : 'rgba(255,255,255,0.60)';
                            }}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <h1 style={titleStyle}>{heading}</h1>
                        {tree.length > 0 && (
                            <div style={categoryDropdownStyle}>
                                <button
                                    style={dropdownTriggerStyle}
                                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                >
                                    <span>Switch</span>
                                    <ChevronDown size={14} />
                                </button>
                                <div style={dropdownMenuStyle}>
                                    {tree.map((cat) => (
                                        <div
                                            key={cat.id}
                                            style={dropdownItemStyle(cat.slug === categoryId)}
                                            onClick={() => handleCategoryChange(cat.slug)}
                                        >
                                            <span>{cat.name}</span>
                                            {cat.slug === categoryId && (
                                                <span style={{ marginLeft: 'auto', color: colors.primary }}>✓</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div style={headerActionsStyle}>
                        <div style={viewToggleStyle}>
                            <button
                                style={viewButtonStyle(viewMode === 'grid')}
                                onClick={() => setViewMode('grid')}
                            >
                                <Grid size={16} />
                            </button>
                            <button
                                style={viewButtonStyle(viewMode === 'list')}
                                onClick={() => setViewMode('list')}
                            >
                                <List size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                <div style={searchWrapperStyle}>
                    <Search
                        size={16}
                        color={colors.secondaryText}
                        style={{
                            position: 'absolute',
                            left: '14px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                        }}
                    />
                    <input
                        style={searchInputStyle}
                        type="text"
                        placeholder={`Search ${String(heading).toLowerCase()}…`}
                        value={searchDraft}
                        onChange={(e) => setSearchDraft(e.target.value)}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(168, 137, 79,0.50)';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(168, 137, 79,0.08)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = isDark
                                ? 'rgba(168, 137, 79,0.10)'
                                : 'rgba(168, 137, 79,0.15)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    />
                    {searchDraft && (
                        <button
                            style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                color: colors.secondaryText,
                            }}
                            onClick={() => setSearchDraft('')}
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div style={filterBarStyle}>
                    <button style={filterButtonStyle} onClick={() => setShowFilters(!showFilters)}>
                        <Filter size={14} />
                        Filters
                        {activeFilterCount > 0 && (
                            <span
                                style={{
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '50%',
                                    background: colors.primary,
                                    color: '#1A1A1A',
                                    fontSize: '9px',
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {activeFilterCount}
                            </span>
                        )}
                    </button>

                    <select
                        style={sortSelectStyle}
                        value={ordering}
                        onChange={(e) => setParam({ ordering: e.target.value })}
                    >
                        {SORT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Subcategory Navigation */}
            {subNavItems.length > 1 && (
                <div style={subNavStyle}>
                    {subNavItems.map((sub) => (
                        <button
                            key={sub.id}
                            style={subNavItemStyle(activeSubcategory === sub.slug)}
                            onClick={() => handleSubcategoryChange(sub.slug)}
                        >
                            {sub.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Filter Panel */}
            <div style={filterPanelStyle}>
                <div style={filterSectionStyle}>
                    <span style={filterLabelStyle}>Wearer</span>
                    <div style={categoryChipsStyle}>
                        {Object.entries(GENDER_LABEL).map(([key, label]) => (
                            <button
                                key={key}
                                style={categoryChipStyle(gender === key)}
                                onClick={() => setParam({ gender: gender === key ? '' : key })}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={filterSectionStyle}>
                    <span style={filterLabelStyle}>Availability</span>
                    <div style={categoryChipsStyle}>
                        <button style={categoryChipStyle(onSale)} onClick={() => setParam({ on_sale: !onSale })}>
                            On sale
                        </button>
                        <button style={categoryChipStyle(inStock)} onClick={() => setParam({ in_stock: !inStock })}>
                            In stock
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: colors.secondaryText }}>
                        {count} product{count === 1 ? '' : 's'}
                    </span>
                    <button style={clearFiltersStyle} onClick={clearFilters}>
                        Clear all filters
                    </button>
                </div>
            </div>

            {/* Products */}
            {loading ? (
                <div style={gridStyle}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 320 }} />
                    ))}
                </div>
            ) : error ? (
                <div style={emptyStateStyle}>
                    <AlertCircle size={28} style={{ color: colors.error, marginBottom: 12 }} />
                    <p style={{ fontSize: '14px', margin: 0 }}>{error}</p>
                    <button className="btn btn-ghost" style={{ marginTop: 18 }} onClick={() => setParam({ page })}>
                        Try again
                    </button>
                </div>
            ) : products.length === 0 ? (
                <div style={emptyStateStyle}>
                    <div style={emptyStateIconStyle}>✦</div>
                    <p style={{ fontSize: '14px', margin: 0 }}>No products found</p>
                    <p style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
                        Try adjusting your filters or search
                    </p>
                </div>
            ) : (
                <>
                    <div style={resultCountStyle}>
                        Showing {products.length} of {count} products
                    </div>
                    <div style={gridStyle}>
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onPress={handleProductPress}
                                onAction={handleProductAction}
                            />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 14,
                                padding: '20px 0 6px',
                            }}
                        >
                            <button
                                className="icon-btn"
                                disabled={page <= 1}
                                onClick={() => setParam({ page: page - 1 })}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span style={{ fontSize: 13, color: colors.secondaryText }}>
                                Page {page} of {totalPages}
                            </span>
                            <button
                                className="icon-btn"
                                disabled={page >= totalPages}
                                onClick={() => setParam({ page: page + 1 })}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CategoryDetailsPage;
