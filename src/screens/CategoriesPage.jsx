import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Grid, List, ChevronRight, AlertCircle } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { shop } from '../api/endpoints';
import { adaptCategory, errorText } from '../api/adapters';

const CategoriesPage = () => {
    const navigate = useNavigate();
    const { colors, theme } = useTheme();
    const isDark = theme.mode === 'dark';

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('list');
    const [reloadKey, setReloadKey] = useState(0);

    // One request draws the whole tree — the ?tree=true form nests each
    // parent's children, so there is no per-row follow-up call.
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        shop
            .categoryTree()
            .then((rows) => {
                if (cancelled) return;
                setCategories((rows || []).map(adaptCategory));
                setError('');
            })
            .catch((err) => {
                if (!cancelled) setError(errorText(err, 'Could not load categories.'));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [reloadKey]);

    // A parent stays visible when any of its children match, and in that case
    // only the matching children are shown beneath it.
    const filteredCategories = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return categories;
        return categories
            .map((category) => {
                const selfMatch = category.name.toLowerCase().includes(q);
                const subs = (category.subcategories || []).filter((s) =>
                    s.name.toLowerCase().includes(q)
                );
                if (selfMatch) return category;
                if (subs.length) return { ...category, subcategories: subs };
                return null;
            })
            .filter(Boolean);
    }, [categories, searchQuery]);

    const handleCategoryPress = (slug) => {
        navigate(`/categories/${slug}`);
    };

    const handleSubcategoryPress = (categorySlug, subcategorySlug) => {
        navigate(`/categories/${categorySlug}/${subcategorySlug}`);
    };

    // "View all" drops straight into the product grid, pre-filtered.
    const handleViewAll = (slug) => {
        navigate(`/products?category=${encodeURIComponent(slug)}`);
    };

    // Styles
    const pageStyle = {
        backgroundColor: colors.mainBg,
        minHeight: '100vh',
        paddingBottom: '40px',
    };

    const headerStyle = {
        padding: '20px 20px 16px',
        borderBottom: `1px solid ${isDark ? 'rgba(212, 175, 55,0.08)' : 'rgba(212, 175, 55,0.12)'}`,
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

    const titleStyle = {
        fontSize: '24px',
        fontWeight: 800,
        color: colors.heading,
        letterSpacing: '-0.3px',
        margin: 0,
    };

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
        border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.10)' : 'rgba(212, 175, 55,0.15)'}`,
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
        padding: '10px 16px 10px 40px',
        borderRadius: '12px',
        background: isDark ? 'rgba(26,26,26,0.80)' : 'rgba(255,255,255,0.80)',
        border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.10)' : 'rgba(212, 175, 55,0.15)'}`,
        fontSize: '13px',
        color: colors.text,
        outline: 'none',
        transition: 'all 0.2s ease',
        fontFamily: 'inherit',
    };

    const listContainerStyle = {
        padding: '16px 20px',
    };

    const categoryCardStyle = {
        marginBottom: '24px',
        borderRadius: '16px',
        background: isDark ? 'rgba(20,20,20,0.80)' : 'rgba(255,255,255,0.80)',
        border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.08)' : 'rgba(212, 175, 55,0.12)'}`,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
    };

    const categoryHeaderStyle = {
        display: 'flex',
        alignItems: 'center',
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'background 0.2s ease',
        gap: '14px',
    };

    const categoryImageStyle = {
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        objectFit: 'cover',
        flexShrink: 0,
        border: `2px solid ${isDark ? 'rgba(212, 175, 55,0.15)' : 'rgba(212, 175, 55,0.20)'}`,
    };

    const categoryInfoStyle = {
        flex: 1,
        minWidth: 0,
    };

    const categoryNameStyle = {
        fontSize: '15px',
        fontWeight: 600,
        color: colors.text,
        letterSpacing: '0.2px',
        margin: 0,
    };

    const categoryCountStyle = {
        fontSize: '12px',
        color: colors.secondaryText,
        marginTop: '2px',
    };

    const viewAllStyle = {
        fontSize: '12px',
        fontWeight: 500,
        color: colors.primary,
        cursor: 'pointer',
        padding: '4px 12px',
        borderRadius: '12px',
        border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.20)' : 'rgba(212, 175, 55,0.25)'}`,
        background: 'transparent',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        whiteSpace: 'nowrap',
        fontFamily: 'inherit',
    };

    // Grid view lays the children out in rows; list view keeps the horizontal strip.
    const subcategoriesContainerStyle =
        viewMode === 'grid'
            ? {
                  padding: '0 16px 16px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                  gap: '12px',
              }
            : {
                  padding: '0 16px 16px',
                  overflowX: 'auto',
                  display: 'flex',
                  gap: '12px',
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
              };

    const subcategoryCardStyle = {
        flexShrink: 0,
        width: viewMode === 'grid' ? '100%' : '100px',
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
    };

    const subcategoryImageStyle = {
        width: '100%',
        height: '100px',
        borderRadius: '14px',
        objectFit: 'cover',
        border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.10)' : 'rgba(212, 175, 55,0.15)'}`,
        transition: 'transform 0.3s ease',
    };

    const subcategoryInfoStyle = {
        marginTop: '8px',
        textAlign: 'center',
    };

    const subcategoryNameStyle = {
        fontSize: '12px',
        fontWeight: 500,
        color: colors.text,
        letterSpacing: '0.1px',
        display: 'block',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    };

    const subcategoryTagStyle = {
        position: 'absolute',
        top: '6px',
        right: '6px',
        padding: '2px 8px',
        borderRadius: '10px',
        fontSize: '9px',
        fontWeight: 600,
        background: 'rgba(212, 175, 55,0.90)',
        color: '#1A1A1A',
        letterSpacing: '0.2px',
    };

    const subcategoryImageWrapperStyle = {
        position: 'relative',
        width: '100%',
        height: '100px',
    };

    const emptyStateStyle = {
        textAlign: 'center',
        padding: '60px 20px',
        color: colors.secondaryText,
    };

    const emptyStateIconStyle = {
        fontSize: '48px',
        color: colors.primary,
        opacity: 0.3,
        marginBottom: '16px',
    };

    const renderBody = () => {
        if (loading) {
            return Array.from({ length: 3 }).map((_, i) => (
                <div
                    key={i}
                    className="skeleton"
                    style={{ height: 180, borderRadius: 16, marginBottom: 24 }}
                />
            ));
        }

        if (error) {
            return (
                <div style={emptyStateStyle}>
                    <AlertCircle size={28} style={{ color: colors.error, marginBottom: 12 }} />
                    <p style={{ fontSize: '14px', margin: 0 }}>{error}</p>
                    <button
                        className="btn btn-ghost"
                        style={{ marginTop: 18 }}
                        onClick={() => setReloadKey((k) => k + 1)}
                    >
                        Try again
                    </button>
                </div>
            );
        }

        if (filteredCategories.length === 0) {
            return (
                <div style={emptyStateStyle}>
                    <div style={emptyStateIconStyle}>✦</div>
                    <p style={{ fontSize: '14px', margin: 0 }}>No categories found</p>
                    <p style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
                        {searchQuery ? 'Try adjusting your search' : 'Nothing has been published yet'}
                    </p>
                </div>
            );
        }

        return filteredCategories.map((category) => (
            <div key={category.id} style={categoryCardStyle}>
                <div
                    style={categoryHeaderStyle}
                    onClick={() => handleCategoryPress(category.slug)}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(212, 175, 55,0.04)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                    }}
                >
                    <img
                        src={category.image}
                        alt={category.name}
                        style={categoryImageStyle}
                        draggable={false}
                    />
                    <div style={categoryInfoStyle}>
                        <div style={categoryNameStyle}>{category.name}</div>
                        <div style={categoryCountStyle}>
                            {category.productCount} product{category.productCount === 1 ? '' : 's'}
                            {category.styleCount > 0 && ` • ${category.styleCount} styles`}
                            {category.subcategories.length > 0 &&
                                ` • ${category.subcategories.length} subcategories`}
                        </div>
                    </div>
                    <button
                        style={viewAllStyle}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleViewAll(category.slug);
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = colors.primary;
                            e.currentTarget.style.color = '#1A1A1A';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = colors.primary;
                        }}
                    >
                        View all
                        <ChevronRight size={14} />
                    </button>
                </div>

                {category.subcategories.length > 0 && (
                    <div style={subcategoriesContainerStyle}>
                        {category.subcategories.map((sub) => (
                            <div
                                key={sub.id}
                                style={subcategoryCardStyle}
                                onClick={() => handleSubcategoryPress(category.slug, sub.slug)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <div style={subcategoryImageWrapperStyle}>
                                    <img
                                        src={sub.image}
                                        alt={sub.name}
                                        style={subcategoryImageStyle}
                                        draggable={false}
                                    />
                                    {sub.productCount + sub.styleCount > 0 && (
                                        <div style={subcategoryTagStyle}>
                                            {sub.productCount + sub.styleCount}
                                        </div>
                                    )}
                                </div>
                                <div style={subcategoryInfoStyle}>
                                    <span style={subcategoryNameStyle}>{sub.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        ));
    };

    return (
        <div style={pageStyle}>
            <div style={headerStyle}>
                <div style={headerTopStyle}>
                    <h1 style={titleStyle}>Categories</h1>
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
                        placeholder="Search categories…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(212, 175, 55,0.50)';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212, 175, 55,0.08)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = isDark
                                ? 'rgba(212, 175, 55,0.10)'
                                : 'rgba(212, 175, 55,0.15)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    />
                </div>
            </div>

            <div style={listContainerStyle}>{renderBody()}</div>
        </div>
    );
};

export default CategoriesPage;
