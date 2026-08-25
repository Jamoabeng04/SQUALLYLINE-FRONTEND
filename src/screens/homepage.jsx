import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Star, StarHalf } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import HomeBanner from '../components/home/HomeBanner';
import EndlessStylesBanner from '../components/home/StylesBanner';
import MeasurementsBanner from '../components/home/MeasurementsBanner';
import TrendingStyles from '../components/home/TrendingStyles';
import BookAppointmentSection from '../components/home/BookAppointmentSection';
import TrendingProducts from '../components/home/TrendingProducts';
import PromisesSection from '../components/home/PromisesSection';
import SocialSection from '../components/home/SocialSection';
import LuxuryTagline from '../components/LuxuryTagline';
import { shop } from '../api/endpoints';
import { adaptCategory } from '../api/adapters';

const HomePage = () => {
  const navigate = useNavigate();
  const { colors, theme } = useTheme();
  const isDark = theme.mode === 'dark';

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [testimonials, setTestimonials] = useState([]);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeCategorySet, setActiveCategorySet] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const itemsPerView = isMobile ? 1 : isTablet ? 2 : 3;

  // Track window width
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Top-level categories with their children nested, so each card can show the
  // subcategory strip without a request per category.
  useEffect(() => {
    let cancelled = false;
    shop
      .categoryTree()
      .then((rows) => {
        if (cancelled) return;
        setCategories(
          (rows || [])
            .map(adaptCategory)
            .filter((c) => c.productCount + c.styleCount + c.subcategoryCount > 0)
        );
      })
      .catch(() => {
        // The rest of the homepage stands on its own without this strip.
      })
      .finally(() => {
        if (!cancelled) setLoadingCategories(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Real customer words only — the section stays hidden until reviews exist.
  useEffect(() => {
    let cancelled = false;
    shop
      .latestReviews(6)
      .then((rows) => {
        if (!cancelled) setTestimonials(rows || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const totalSets = Math.max(1, Math.ceil(categories.length / itemsPerView));

  // Keep the carousel index valid when the viewport or the data changes.
  useEffect(() => {
    setActiveCategorySet((current) => (current >= totalSets ? 0 : current));
  }, [totalSets]);

  useEffect(() => {
    if (isPaused || totalSets < 2) return undefined;
    const interval = setInterval(() => {
      setActiveCategorySet((prev) => (prev + 1) % totalSets);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPaused, totalSets]);

  useEffect(() => {
    if (testimonials.length < 2) return undefined;
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const visibleCategories = useMemo(() => {
    const start = activeCategorySet * itemsPerView;
    return categories.slice(start, start + itemsPerView);
  }, [categories, activeCategorySet, itemsPerView]);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i += 1) {
      stars.push(<Star key={i} size={14} fill="#D4AF37" color="#D4AF37" />);
    }
    if (hasHalfStar) {
      stars.push(<StarHalf key="half" size={14} fill="#D4AF37" color="#D4AF37" />);
    }
    const remaining = 5 - stars.length;
    for (let i = 0; i < remaining; i += 1) {
      stars.push(<Star key={`empty-${i}`} size={14} color="rgba(212, 175, 55,0.20)" />);
    }
    return stars;
  };

  // Every catalogue count a category carries, rolled into one line.
  const categoryCountLabel = (category) => {
    const total = category.productCount + category.styleCount;
    if (total === 0) return `${category.subcategoryCount} collections`;
    return `${total} ${total === 1 ? 'piece' : 'pieces'}`;
  };

  // Styles
  const pageStyle = {
    backgroundColor: colors.mainBg,
    minHeight: '100vh',
    overflowX: 'hidden',
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: isMobile ? '12px' : '16px',
  };

  // Categories Section
  const categoriesSectionStyle = {
    padding: isMobile ? '16px 0' : '24px 0',
  };

  const categoriesHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isMobile ? '14px' : '18px',
  };

  const categoriesTitleStyle = {
    fontSize: isMobile ? '20px' : '26px',
    fontWeight: 700,
    color: colors.heading,
    margin: 0,
  };

  const categoriesSeeAllStyle = {
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

  const scrollContainerStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${Math.max(1, visibleCategories.length)}, 1fr)`,
    gap: isMobile ? '12px' : '16px',
    transition: 'all 0.5s ease',
    overflow: 'hidden',
  };

  const categoryFullCardStyle = {
    borderRadius: '14px',
    background: isDark ? 'rgba(20,20,20,0.60)' : 'rgba(255,255,255,0.60)',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.06)' : 'rgba(212, 175, 55,0.08)'}`,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  const categoryHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: isMobile ? '12px 14px' : '14px 16px',
    gap: isMobile ? '12px' : '16px',
    borderBottom: `1px solid ${isDark ? 'rgba(212, 175, 55,0.06)' : 'rgba(212, 175, 55,0.08)'}`,
  };

  const categoryImageStyle = {
    width: isMobile ? '48px' : '56px',
    height: isMobile ? '48px' : '56px',
    borderRadius: '50%',
    objectFit: 'cover',
    flexShrink: 0,
    border: `2px solid ${isDark ? 'rgba(212, 175, 55,0.12)' : 'rgba(212, 175, 55,0.15)'}`,
  };

  const categoryInfoStyle = {
    flex: 1,
    minWidth: 0,
  };

  const categoryNameStyle = {
    fontSize: isMobile ? '14px' : '16px',
    fontWeight: 600,
    color: colors.text,
    margin: 0,
  };

  const categoryCountStyle = {
    fontSize: isMobile ? '11px' : '12px',
    color: colors.secondaryText,
    marginTop: '2px',
  };

  const categoryArrowStyle = {
    color: colors.primary,
    flexShrink: 0,
  };

  const subcategoriesContainerStyle = {
    padding: isMobile ? '10px 12px 14px' : '12px 14px 16px',
    overflowX: 'auto',
    display: 'flex',
    gap: isMobile ? '10px' : '14px',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  };

  const subcategoryCardStyle = {
    flexShrink: 0,
    width: isMobile ? '80px' : '90px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
    textAlign: 'center',
  };

  const subcategoryImageStyle = {
    width: isMobile ? '68px' : '80px',
    height: isMobile ? '68px' : '80px',
    borderRadius: '12px',
    objectFit: 'cover',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.08)' : 'rgba(212, 175, 55,0.10)'}`,
    transition: 'transform 0.3s ease',
    display: 'block',
    margin: '0 auto',
  };

  const subcategoryTagStyle = {
    position: 'absolute',
    top: '4px',
    right: '4px',
    padding: '1px 6px',
    borderRadius: '8px',
    fontSize: '8px',
    fontWeight: 600,
    background: colors.primary,
    color: '#1A1A1A',
  };

  const subcategoryImageWrapperStyle = {
    position: 'relative',
    display: 'inline-block',
  };

  const subcategoryNameStyle = {
    fontSize: isMobile ? '10px' : '11px',
    fontWeight: 500,
    color: colors.text,
    display: 'block',
    marginTop: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const dotsContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    marginTop: isMobile ? '14px' : '18px',
  };

  const dotStyle = (active) => ({
    width: active ? '28px' : '8px',
    height: '8px',
    borderRadius: '4px',
    background: active ? colors.primary : isDark ? 'rgba(212, 175, 55,0.15)' : 'rgba(212, 175, 55,0.20)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: 'none',
    padding: 0,
  });

  const sectionHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isMobile ? '16px' : '20px',
  };

  const sectionTitleStyle = {
    fontSize: isMobile ? '20px' : '26px',
    fontWeight: 700,
    color: colors.heading,
    margin: 0,
  };

  // Testimonials
  const testimonialContainerStyle = {
    padding: isMobile ? '20px 0' : '40px 0',
  };

  const testimonialCardStyle = {
    maxWidth: '600px',
    margin: '0 auto',
    padding: isMobile ? '24px' : '32px',
    borderRadius: '16px',
    background: isDark ? 'rgba(20,20,20,0.60)' : 'rgba(255,255,255,0.60)',
    border: `1px solid ${isDark ? 'rgba(212, 175, 55,0.06)' : 'rgba(212, 175, 55,0.08)'}`,
    textAlign: 'center',
  };

  const testimonialTextStyle = {
    fontSize: isMobile ? '14px' : '16px',
    color: colors.text,
    lineHeight: 1.7,
    marginBottom: '12px',
  };

  const testimonialNameStyle = {
    fontSize: isMobile ? '14px' : '16px',
    fontWeight: 600,
    color: colors.heading,
  };

  const testimonialRoleStyle = {
    fontSize: isMobile ? '12px' : '13px',
    color: colors.secondaryText,
  };

  const testimonialDotsStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '16px',
  };

  const testimonialDotStyle = (active) => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: active ? colors.primary : isDark ? 'rgba(212, 175, 55,0.15)' : 'rgba(212, 175, 55,0.20)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    padding: 0,
  });

  const review = testimonials[activeTestimonial];

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {/* Banner */}
        <HomeBanner />

        {/* Categories */}
        {(loadingCategories || categories.length > 0) && (
          <div
            style={categoriesSectionStyle}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div style={categoriesHeaderStyle}>
              <h2 style={categoriesTitleStyle}>Shop by Category</h2>
              <button style={categoriesSeeAllStyle} onClick={() => navigate('/categories')}>
                See All <ChevronRight size={16} />
              </button>
            </div>

            {loadingCategories ? (
              <div style={scrollContainerStyle}>
                {Array.from({ length: itemsPerView }).map((_, i) => (
                  <div
                    key={`cat-skeleton-${i}`}
                    className="skeleton"
                    style={{ height: isMobile ? '170px' : '190px', borderRadius: '14px' }}
                  />
                ))}
              </div>
            ) : (
              <div style={scrollContainerStyle}>
                {visibleCategories.map((category) => (
                  <div
                    key={category.id}
                    style={categoryFullCardStyle}
                    onClick={() => navigate(`/categories/${category.slug}`)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = isDark
                        ? '0 8px 24px rgba(0,0,0,0.30)'
                        : '0 8px 24px rgba(0,0,0,0.06)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={categoryHeaderStyle}>
                      <img
                        src={category.image}
                        alt={category.name}
                        style={categoryImageStyle}
                        draggable={false}
                      />
                      <div style={categoryInfoStyle}>
                        <div style={categoryNameStyle}>{category.name}</div>
                        <div style={categoryCountStyle}>{categoryCountLabel(category)}</div>
                      </div>
                      <ChevronRight size={isMobile ? 16 : 18} style={categoryArrowStyle} />
                    </div>

                    {category.subcategories.length > 0 && (
                      <div
                        style={subcategoriesContainerStyle}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {category.subcategories.map((sub) => (
                          <div
                            key={sub.id}
                            style={subcategoryCardStyle}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/categories/${category.slug}/${sub.slug}`);
                            }}
                            onMouseEnter={(e) => {
                              const img = e.currentTarget.querySelector('.sub-img');
                              if (img) img.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              const img = e.currentTarget.querySelector('.sub-img');
                              if (img) img.style.transform = 'scale(1)';
                            }}
                          >
                            <div style={subcategoryImageWrapperStyle}>
                              <img
                                src={sub.image}
                                alt={sub.name}
                                className="sub-img"
                                style={subcategoryImageStyle}
                                draggable={false}
                              />
                              {sub.productCount + sub.styleCount > 0 && (
                                <span style={subcategoryTagStyle}>
                                  {sub.productCount + sub.styleCount}
                                </span>
                              )}
                            </div>
                            <span style={subcategoryNameStyle}>{sub.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {totalSets > 1 && (
              <div style={dotsContainerStyle}>
                {Array.from({ length: totalSets }).map((_, idx) => (
                  <button
                    key={idx}
                    aria-label={`Category set ${idx + 1}`}
                    style={dotStyle(activeCategorySet === idx)}
                    onClick={() => setActiveCategorySet(idx)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <EndlessStylesBanner />

        <MeasurementsBanner />

        <TrendingStyles />

        <BookAppointmentSection />

        <TrendingProducts />

        <PromisesSection />

        <LuxuryTagline />

        {/* Testimonials — only once real reviews are in */}
        {review && (
          <div style={testimonialContainerStyle}>
            <div style={sectionHeaderStyle}>
              <h2 style={sectionTitleStyle}>What Our Clients Say</h2>
            </div>
            <div style={testimonialCardStyle}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '2px',
                  marginBottom: '8px',
                }}
              >
                {renderStars(Number(review.rating) || 0)}
              </div>
              <p style={testimonialTextStyle}>&ldquo;{review.comment}&rdquo;</p>
              <div style={testimonialNameStyle}>{review.user_name}</div>
              <div style={testimonialRoleStyle}>on {review.item_name}</div>
            </div>
            {testimonials.length > 1 && (
              <div style={testimonialDotsStyle}>
                {testimonials.map((t, idx) => (
                  <button
                    key={t.id}
                    aria-label={`Review ${idx + 1}`}
                    style={testimonialDotStyle(activeTestimonial === idx)}
                    onClick={() => setActiveTestimonial(idx)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <SocialSection />
      </div>
    </div>
  );
};

export default HomePage;
