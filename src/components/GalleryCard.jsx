// import React, { useState, useEffect, useRef } from 'react';
// import {
//   MoreVertical, Heart, Bookmark, Share2, ShoppingBag, Flame
// } from 'lucide-react';
// import { useTheme } from '../hooks/useTheme';

// const GalleryCard = ({ item, onNavigate, onAction }) => {
//   const { colors, theme } = useTheme();
//   const isDark = theme.mode === 'dark';
//   const nav = onNavigate || (() => { });
//   const action = onAction || (() => { });

//   // Local state
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [menuClosing, setMenuClosing] = useState(false);
//   const [isLiked, setIsLiked] = useState(item.isLiked || false);
//   const [isBookmarked, setIsBookmarked] = useState(item.isBookmarked || false);
//   const [likeCount, setLikeCount] = useState(item.likes || 0);
//   const [imageLoaded, setImageLoaded] = useState(false);
//   const [overlayVisible, setOverlayVisible] = useState(false);
//   const [likeAnimating, setLikeAnimating] = useState(false);
//   const [hoveredMenuItem, setHoveredMenuItem] = useState(null);

//   const menuRef = useRef(null);
//   const cardRef = useRef(null);


//   // Close menu on outside click
//   useEffect(() => {
//     if (!menuOpen) return;

//     const handler = (e) => {
//       if (menuRef.current && !menuRef.current.contains(e.target)) {
//         handleMenuClose();
//       }
//     };

//     document.addEventListener('mousedown', handler);
//     document.addEventListener('touchstart', handler);
//     return () => {
//       document.removeEventListener('mousedown', handler);
//       document.removeEventListener('touchstart', handler);
//     };
//   }, [menuOpen]);

//   // Handle menu close with exit animation
//   const handleMenuClose = () => {
//     setMenuClosing(true);
//     setTimeout(() => {
//       setMenuOpen(false);
//       setMenuClosing(false);
//     }, 200);
//   };

//   // Like handler
//   const handleLike = (e) => {
//     if (e) e.stopPropagation();
//     const next = !isLiked;
//     setIsLiked(next);
//     setLikeCount(c => next ? c + 1 : c - 1);
//     setLikeAnimating(true);
//     setTimeout(() => setLikeAnimating(false), 400);
//     action('like', item.id);
//     if (menuOpen) handleMenuClose();
//   };

//   // Bookmark handler
//   const handleBookmark = (e) => {
//     if (e) e.stopPropagation();
//     setIsBookmarked(b => !b);
//     action('bookmark', item.id);
//     if (menuOpen) handleMenuClose();
//   };

//   // Share handler
//   const handleShare = (e) => {
//     if (e) e.stopPropagation();
//     if (navigator.share) {
//       navigator.share({
//         title: item.name || 'Squally-Line Style',
//         url: window.location.origin + '/gallery/' + item.id,
//       }).catch(() => { });
//     }
//     action('share', item.id);
//     if (menuOpen) handleMenuClose();
//   };

//   // Order handler
//   const handleOrder = (e) => {
//     if (e) e.stopPropagation();
//     action('order', item.id);
//     if (menuOpen) handleMenuClose();
//   };

//   // Card press handler
//   const handleCardPress = () => {
//     nav('/gallery/' + item.id);
//   };

//   // Toggle menu
//   const toggleMenu = (e) => {
//     e.stopPropagation();
//     if (menuOpen) {
//       handleMenuClose();
//     } else {
//       setMenuOpen(true);
//       setMenuClosing(false);
//     }
//   };



//   //   // Menu items with their positions (quarter arc toward bottom-left)
//   // const menuItems = [
//   //   { 
//   //     id: 'like', 
//   //     icon: Heart, 
//   //     label: isLiked ? 'Liked' : 'Like',
//   //     tx: -45, 
//   //     ty: 24,
//   //     onClick: handleLike,
//   //     getColor: () => isLiked ? '#1A1A1A' : 'rgba(248,246,241,0.90)',
//   //     getBg: () => isLiked ? 'rgba(168, 137, 79,0.92)' : 'rgba(15,15,15,0.82)',
//   //   },
//   //   { 
//   //     id: 'bookmark', 
//   //     icon: Bookmark, 
//   //     label: 'Save',
//   //     tx: -36, 
//   //     ty: 46,
//   //     onClick: handleBookmark,
//   //     getColor: () => isBookmarked ? '#1A1A1A' : 'rgba(248,246,241,0.90)',
//   //     getBg: () => isBookmarked ? 'rgba(168, 137, 79,0.92)' : 'rgba(15,15,15,0.82)',
//   //   },
//   //   { 
//   //     id: 'share', 
//   //     icon: Share2, 
//   //     label: 'Share',
//   //     tx: -16, 
//   //     ty: 58,
//   //     onClick: handleShare,
//   //     getColor: () => 'rgba(248,246,241,0.90)',
//   //     getBg: () => 'rgba(15,15,15,0.82)',
//   //   },
//   //   { 
//   //     id: 'order', 
//   //     icon: ShoppingBag, 
//   //     label: 'Order similar',
//   //     tx: 8, 
//   //     ty: 60,
//   //     onClick: handleOrder,
//   //     getColor: () => 'rgba(248,246,241,0.90)',
//   //     getBg: () => 'rgba(15,15,15,0.82)',
//   //   },
//   // ];

//   // Menu items with their positions (quarter arc toward bottom-left)
//   const menuItems = [
//     {
//       id: 'like',
//       icon: Heart,
//       label: isLiked ? 'Liked' : 'Like',
//       tx: -58,  // Changed from -45
//       ty: 32,   // Changed from 24
//       onClick: handleLike,
//       getColor: () => isLiked ? '#1A1A1A' : 'rgba(248,246,241,0.90)',
//       getBg: () => isLiked ? 'rgba(168, 137, 79,0.92)' : 'rgba(15,15,15,0.82)',
//     },
//     {
//       id: 'bookmark',
//       icon: Bookmark,
//       label: 'Save',
//       tx: -48,  // Changed from -36
//       ty: 62,   // Changed from 46
//       onClick: handleBookmark,
//       getColor: () => isBookmarked ? '#1A1A1A' : 'rgba(248,246,241,0.90)',
//       getBg: () => isBookmarked ? 'rgba(168, 137, 79,0.92)' : 'rgba(15,15,15,0.82)',
//     },
//     {
//       id: 'share',
//       icon: Share2,
//       label: 'Share',
//       tx: -24,  // Changed from -16
//       ty: 78,   // Changed from 58
//       onClick: handleShare,
//       getColor: () => 'rgba(248,246,241,0.90)',
//       getBg: () => 'rgba(15,15,15,0.82)',
//     },
//     {
//       id: 'order',
//       icon: ShoppingBag,
//       label: 'Order similar',
//       tx: 12,   // Changed from 8
//       ty: 82,   // Changed from 60
//       onClick: handleOrder,
//       getColor: () => 'rgba(248,246,241,0.90)',
//       getBg: () => 'rgba(15,15,15,0.82)',
//     },
//   ];

//   // Format count helper
//   const formatCount = (n) => {
//     return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
//   };

//   // Get visible tags (max 3)
//   const getVisibleTags = () => {
//     const tags = item.tags || [];
//     if (tags.length <= 3) return tags;
//     return [...tags.slice(0, 2), `+${tags.length - 2} more`];
//   };

//   const visibleTags = getVisibleTags();

//   // Menu item style function - FIXED: accepts menuItem parameter
//   const menuItemStyle = (menuItem, tx, ty, index) => ({
//     position: 'absolute',
//     top: '50%',
//     left: '50%',
//     width: '36px',
//     height: '36px',
//     borderRadius: '50%',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     cursor: 'pointer',
//     border: '1px solid rgba(168, 137, 79,0.35)',
//     backdropFilter: 'blur(12px)',
//     WebkitBackdropFilter: 'blur(12px)',
//     zIndex: 9,
//     transform: (menuOpen && !menuClosing)
//       ? `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`
//       : 'translate(-50%, -50%) scale(0.6)',
//     opacity: (menuOpen && !menuClosing) ? 1 : 0,
//     transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease',
//     transitionDelay: `${index * 40}ms`,
//     background: menuItem.getBg ? menuItem.getBg() : 'rgba(15,15,15,0.82)',
//   });

//   // Card styles
//   const cardRootStyle = {
//     position: 'relative',
//     borderRadius: '16px',
//     overflow: 'hidden',
//     cursor: 'pointer',
//     background: colors.surfaceL1,
//     animation: 'fadeIn 0.4s ease forwards',
//     WebkitTapHighlightColor: 'transparent',
//     userSelect: 'none',
//   };

//   const imageWrapperStyle = {
//     width: '100%',
//     overflow: 'hidden',
//     position: 'relative',
//   };

//   const shimmerStyle = {
//     position: 'absolute',
//     inset: 0,
//     background: `linear-gradient(90deg, 
//       ${colors.surfaceL1} 25%, 
//       ${isDark ? '#2A2000' : '#F0E8D0'} 50%, 
//       ${colors.surfaceL1} 75%
//     )`,
//     backgroundSize: '400px 100%',
//     animation: 'shimmerLoad 1.4s ease infinite',
//     borderRadius: '16px',
//     zIndex: 1,
//   };

//   const imageStyle = {
//     display: 'block',
//     width: '100%',
//     height: 'auto',
//     objectFit: 'cover',
//     opacity: imageLoaded ? 1 : 0,
//     transition: 'opacity 0.4s ease',
//   };

//   const overlayStyle = {
//     position: 'absolute',
//     inset: 0,
//     background: `linear-gradient(180deg, 
//       rgba(10,10,10,0.0) 0%, 
//       rgba(10,10,10,0.0) 50%, 
//       rgba(10,10,10,0.45) 100%
//     )`,
//     opacity: overlayVisible ? 1 : 0,
//     transition: 'opacity 0.3s ease',
//     pointerEvents: 'none',
//   };

//   const interestPillStyle = {
//     position: 'absolute',
//     top: '10px',
//     left: '10px',
//     zIndex: 4,
//     display: 'inline-flex',
//     alignItems: 'center',
//     gap: '5px',
//     padding: '4px 10px',
//     borderRadius: '20px',
//     background: 'rgba(10,10,10,0.52)',
//     backdropFilter: 'blur(10px) saturate(160%)',
//     WebkitBackdropFilter: 'blur(10px) saturate(160%)',
//     border: '1px solid rgba(255,255,255,0.08)',
//     pointerEvents: 'none',
//   };

//   const menuWrapperStyle = {
//     position: 'absolute',
//     top: '10px',
//     right: '10px',
//     zIndex: 10,
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//   };

//   const menuTriggerStyle = {
//     width: '32px',
//     height: '32px',
//     borderRadius: '50%',
//     background: menuOpen
//       ? 'rgba(168, 137, 79,0.90)'
//       : 'rgba(10,10,10,0.52)',
//     backdropFilter: 'blur(10px)',
//     WebkitBackdropFilter: 'blur(10px)',
//     border: `1px solid ${menuOpen
//       ? 'rgba(168, 137, 79,0.60)'
//       : 'rgba(255,255,255,0.08)'
//       }`,
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     cursor: 'pointer',
//     transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
//     position: 'relative',
//     zIndex: 11,
//   };

//   const menuContainerStyle = {
//     position: 'absolute',
//     top: '0',
//     right: '0',
//     width: '32px',
//     height: '32px',
//     zIndex: 9,
//     pointerEvents: menuOpen ? 'auto' : 'none',
//   };

//   const tooltipStyle = {
//     position: 'absolute',
//     bottom: '42px',
//     left: '50%',
//     transform: 'translateX(-50%)',
//     padding: '4px 8px',
//     borderRadius: '8px',
//     background: 'rgba(10,10,10,0.85)',
//     color: 'rgba(248,246,241,0.90)',
//     fontSize: '9px',
//     fontWeight: 600,
//     whiteSpace: 'nowrap',
//     pointerEvents: 'none',
//     zIndex: 20,
//   };

//   const tagsContainerStyle = {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     padding: '10px 10px 12px',
//     opacity: overlayVisible ? 1 : 0,
//     transform: overlayVisible ? 'translateY(0)' : 'translateY(8px)',
//     transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
//     display: 'flex',
//     gap: '6px',
//     flexWrap: 'wrap',
//     pointerEvents: 'none',
//   };

//   const tagStyle = {
//     padding: '3px 8px',
//     borderRadius: '10px',
//     background: 'rgba(168, 137, 79,0.20)',
//     backdropFilter: 'blur(8px)',
//     border: '1px solid rgba(168, 137, 79,0.30)',
//     fontSize: '9px',
//     fontWeight: 600,
//     color: 'rgba(168, 137, 79,0.95)',
//     letterSpacing: '0.3px',
//     textTransform: 'uppercase',
//   };

//   const nameLabelStyle = {
//     marginTop: '8px',
//     paddingLeft: '4px',
//     paddingRight: '4px',
//     marginBottom: '4px',
//   };

//   const nameStyle = {
//     display: 'block',
//     fontSize: '12px',
//     fontWeight: 600,
//     color: colors.text,
//     letterSpacing: '0.2px',
//     lineHeight: 1.3,
//     overflow: 'hidden',
//     textOverflow: 'ellipsis',
//     whiteSpace: 'nowrap',
//   };

//   const designerStyle = {
//     display: 'block',
//     marginTop: '2px',
//     fontSize: '10px',
//     fontWeight: 400,
//     color: colors.secondaryText,
//     overflow: 'hidden',
//     textOverflow: 'ellipsis',
//     whiteSpace: 'nowrap',
//   };

//   return (
//     <div className="squally-card-wrapper" style={{ display: 'inline-block', width: '100%' }}>
//       {/* Visual Card */}
//       <div
//         ref={cardRef}
//         className="squally-card-root"
//         style={cardRootStyle}
//         onClick={handleCardPress}
//         onMouseEnter={() => setOverlayVisible(true)}
//         onMouseLeave={() => setOverlayVisible(false)}
//       >
//         {/* Image Area */}
//         <div style={imageWrapperStyle}>
//           {/* Shimmer Loader */}
//           {!imageLoaded && <div style={shimmerStyle} />}

//           <img
//             className="squally-img"
//             src={item.image}
//             alt={item.name || 'Fashion style'}
//             draggable={false}
//             onLoad={() => setImageLoaded(true)}
//             style={imageStyle}
//           />
//         </div>

//         {/* Overlay */}
//         <div style={overlayStyle} />

//         {/* Interest Count */}
//         <div style={interestPillStyle}>
//           <Flame
//             size={11}
//             color={isLiked ? '#A8894F' : 'rgba(248,246,241,0.70)'}
//           />
//           <span style={{
//             fontSize: '11px',
//             fontWeight: 600,
//             color: 'rgba(248,246,241,0.90)',
//             letterSpacing: '0.2px',
//           }}>
//             {formatCount(likeCount)}
//           </span>
//         </div>

//         {/* Menu */}
//         <div style={menuWrapperStyle} ref={menuRef}>
//           {/* Menu Trigger Button */}
//           <div
//             style={menuTriggerStyle}
//             onClick={toggleMenu}
//           >
//             <MoreVertical
//               size={15}
//               color={menuOpen ? '#1A1A1A' : 'rgba(248,246,241,0.90)'}
//               style={{ transition: 'color 0.2s ease' }}
//             />
//           </div>

//           {/* Menu Items Container */}
//           <div style={menuContainerStyle}>
//             {menuItems.map((menuItem, index) => {
//               const Icon = menuItem.icon;

//               return (
//                 <div
//                   key={menuItem.id}
//                   style={menuItemStyle(menuItem, menuItem.tx, menuItem.ty, index)}
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     menuItem.onClick(e);
//                   }}
//                   onMouseEnter={() => setHoveredMenuItem(menuItem.id)}
//                   onMouseLeave={() => setHoveredMenuItem(null)}
//                 >
//                   <Icon
//                     size={15}
//                     color={menuItem.getColor ? menuItem.getColor() : 'rgba(248,246,241,0.90)'}
//                     style={menuItem.id === 'like' && likeAnimating ? { animation: 'heartBeat 0.4s ease' } : {}}
//                   />
//                   {hoveredMenuItem === menuItem.id && (
//                     <div style={tooltipStyle}>
//                       {menuItem.label}
//                     </div>
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         {/* Bottom Tags */}
//         {visibleTags.length > 0 && (
//           <div style={tagsContainerStyle}>
//             {visibleTags.map((tag, idx) => (
//               <span key={idx} style={tagStyle}>{tag}</span>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Name Label Below Card */}
//       <div style={nameLabelStyle}>
//         {item.name && (
//           <>
//             <span style={nameStyle}>{item.name}</span>
//             {item.designer && (
//               <span style={designerStyle}>by {item.designer}</span>
//             )}
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default GalleryCard;











import React, { useState, useEffect, useRef } from 'react';
import {
  MoreVertical, Heart, Bookmark, Share2, ShoppingBag, Flame
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const GalleryCard = ({ item, onNavigate, onAction }) => {
  const { colors } = useTheme();
  const nav = onNavigate || (() => { });
  const action = onAction || (() => { });

  // Local state
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const [isLiked, setIsLiked] = useState(item.isLiked || false);
  const [isBookmarked, setIsBookmarked] = useState(item.isBookmarked || false);
  const [likeCount, setLikeCount] = useState(item.likes || 0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [hoveredMenuItem, setHoveredMenuItem] = useState(null);

  const menuRef = useRef(null);
  const cardRef = useRef(null);


  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;

    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        handleMenuClose();
      }
    };

    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [menuOpen]);

  // Handle menu close with exit animation
  const handleMenuClose = () => {
    setMenuClosing(true);
    setTimeout(() => {
      setMenuOpen(false);
      setMenuClosing(false);
    }, 200);
  };

  // Like handler
  const handleLike = (e) => {
    if (e) e.stopPropagation();
    const next = !isLiked;
    setIsLiked(next);
    setLikeCount(c => next ? c + 1 : c - 1);
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 400);
    action('like', item.id);
    if (menuOpen) handleMenuClose();
  };

  // Bookmark handler
  const handleBookmark = (e) => {
    if (e) e.stopPropagation();
    setIsBookmarked(b => !b);
    action('bookmark', item.id);
    if (menuOpen) handleMenuClose();
  };

  // Share handler
  const handleShare = (e) => {
    if (e) e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: item.name || 'Squally-Line Style',
        url: window.location.origin + '/gallery/' + item.id,
      }).catch(() => { });
    }
    action('share', item.id);
    if (menuOpen) handleMenuClose();
  };

  // Both detail endpoints look records up by slug, not by id, and a gallery can
  // hold ready-to-wear alongside tailored styles.
  const detailPath =
    item.kind === 'product'
      ? '/product/' + (item.slug || item.id)
      : '/styles/order/' + (item.slug || item.id);

  // Order handler - Navigate to the detail page
  const handleOrder = (e) => {
    if (e) e.stopPropagation();
    nav(detailPath);
    if (menuOpen) handleMenuClose();
  };

  // Card press handler - Navigate to the detail page
  const handleCardPress = () => {
    nav(detailPath);
  };

  // Toggle menu
  const toggleMenu = (e) => {
    e.stopPropagation();
    if (menuOpen) {
      handleMenuClose();
    } else {
      setMenuOpen(true);
      setMenuClosing(false);
    }
  };

  // Menu items with their positions (quarter arc toward bottom-left)
  const menuItems = [
    {
      id: 'like',
      icon: Heart,
      label: isLiked ? 'Liked' : 'Like',
      tx: -58,
      ty: 32,
      onClick: handleLike,
      getColor: () => isLiked ? '#1A1A1A' : 'rgba(248,246,241,0.90)',
      getBg: () => isLiked ? 'rgba(168, 137, 79,0.92)' : 'rgba(15,15,15,0.82)',
    },
    {
      id: 'bookmark',
      icon: Bookmark,
      label: 'Save',
      tx: -48,
      ty: 62,
      onClick: handleBookmark,
      getColor: () => isBookmarked ? '#1A1A1A' : 'rgba(248,246,241,0.90)',
      getBg: () => isBookmarked ? 'rgba(168, 137, 79,0.92)' : 'rgba(15,15,15,0.82)',
    },
    {
      id: 'share',
      icon: Share2,
      label: 'Share',
      tx: -24,
      ty: 78,
      onClick: handleShare,
      getColor: () => 'rgba(248,246,241,0.90)',
      getBg: () => 'rgba(15,15,15,0.82)',
    },
    {
      id: 'order',
      icon: ShoppingBag,
      label: 'Order this style',
      tx: 12,
      ty: 82,
      onClick: handleOrder,
      getColor: () => 'rgba(248,246,241,0.90)',
      getBg: () => 'rgba(15,15,15,0.82)',
    },
  ];

  // Format count helper
  const formatCount = (n) => {
    return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
  };

  // Get visible tags (max 3)
  const getVisibleTags = () => {
    const tags = item.tags || [];
    if (tags.length <= 3) return tags;
    return [...tags.slice(0, 2), `+${tags.length - 2} more`];
  };

  const visibleTags = getVisibleTags();

  // Menu item style function
  const menuItemStyle = (menuItem, tx, ty, index) => ({
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: '1px solid rgba(168, 137, 79,0.35)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    zIndex: 9,
    transform: (menuOpen && !menuClosing)
      ? `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`
      : 'translate(-50%, -50%) scale(0.6)',
    opacity: (menuOpen && !menuClosing) ? 1 : 0,
    transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease',
    transitionDelay: `${index * 40}ms`,
    background: menuItem.getBg ? menuItem.getBg() : 'rgba(15,15,15,0.82)',
  });

  // Card styles
  const cardRootStyle = {
    position: 'relative',
    borderRadius: '16px',
    overflow: 'hidden',
    cursor: 'pointer',
    background: colors.surfaceL1,
    animation: 'fadeIn 0.4s ease forwards',
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
  };

  const imageWrapperStyle = {
    width: '100%',
    aspectRatio: item.aspectRatio ? `1 / ${item.aspectRatio}` : 'auto',
    overflow: 'hidden',
    position: 'relative',
  };

  const shimmerStyle = {
    position: 'absolute',
    inset: 0,
    background: colors.surfaceL2,
    animation: 'skeletonPulse 1.4s ease-in-out infinite',
    borderRadius: '16px',
    zIndex: 1,
  };

  const imageStyle = {
    display: 'block',
    width: '100%',
    height: item.aspectRatio ? '100%' : 'auto',
    objectFit: 'cover',
    opacity: imageLoaded ? 1 : 0,
    transition: 'opacity 0.4s ease',
  };

  const overlayStyle = {
    position: 'absolute',
    inset: 0,
    background: `linear-gradient(180deg, 
      rgba(10,10,10,0.0) 0%, 
      rgba(10,10,10,0.0) 50%, 
      rgba(10,10,10,0.45) 100%
    )`,
    opacity: overlayVisible ? 1 : 0,
    transition: 'opacity 0.3s ease',
    pointerEvents: 'none',
  };

  const interestPillStyle = {
    position: 'absolute',
    top: '10px',
    left: '10px',
    zIndex: 4,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 10px',
    borderRadius: '20px',
    background: 'rgba(10,10,10,0.52)',
    backdropFilter: 'blur(10px) saturate(160%)',
    WebkitBackdropFilter: 'blur(10px) saturate(160%)',
    border: '1px solid rgba(255,255,255,0.08)',
    pointerEvents: 'none',
  };

  const menuWrapperStyle = {
    position: 'absolute',
    top: '10px',
    right: '10px',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const menuTriggerStyle = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: menuOpen
      ? 'rgba(168, 137, 79,0.90)'
      : 'rgba(10,10,10,0.52)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: `1px solid ${menuOpen
      ? 'rgba(168, 137, 79,0.60)'
      : 'rgba(255,255,255,0.08)'
      }`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
    position: 'relative',
    zIndex: 11,
  };

  const menuContainerStyle = {
    position: 'absolute',
    top: '0',
    right: '0',
    width: '32px',
    height: '32px',
    zIndex: 9,
    pointerEvents: menuOpen ? 'auto' : 'none',
  };

  const tooltipStyle = {
    position: 'absolute',
    bottom: '42px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '4px 8px',
    borderRadius: '8px',
    background: 'rgba(10,10,10,0.85)',
    color: 'rgba(248,246,241,0.90)',
    fontSize: '9px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    zIndex: 20,
  };

  const tagsContainerStyle = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '10px 10px 12px',
    opacity: overlayVisible ? 1 : 0,
    transform: overlayVisible ? 'translateY(0)' : 'translateY(8px)',
    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    pointerEvents: 'none',
  };

  const tagStyle = {
    padding: '3px 8px',
    borderRadius: '10px',
    background: 'rgba(168, 137, 79,0.20)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(168, 137, 79,0.30)',
    fontSize: '9px',
    fontWeight: 600,
    color: 'rgba(168, 137, 79,0.95)',
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
  };

  const nameLabelStyle = {
    marginTop: '8px',
    paddingLeft: '4px',
    paddingRight: '4px',
    marginBottom: '4px',
  };

  const nameStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: colors.text,
    letterSpacing: '0.2px',
    lineHeight: 1.3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const designerStyle = {
    display: 'block',
    marginTop: '2px',
    fontSize: '10px',
    fontWeight: 400,
    color: colors.secondaryText,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  return (
    <div className="squally-card-wrapper" style={{ display: 'inline-block', width: '100%' }}>
      {/* Visual Card */}
      <div
        ref={cardRef}
        className="squally-card-root"
        style={cardRootStyle}
        onClick={handleCardPress}
        onMouseEnter={() => setOverlayVisible(true)}
        onMouseLeave={() => setOverlayVisible(false)}
      >
        {/* Image Area */}
        <div style={imageWrapperStyle}>
          {/* Shimmer Loader */}
          {!imageLoaded && <div style={shimmerStyle} />}

          <img
            className="squally-img"
            src={item.image}
            alt={item.name || 'Fashion style'}
            draggable={false}
            onLoad={() => setImageLoaded(true)}
            style={imageStyle}
          />
        </div>

        {/* Overlay */}
        <div style={overlayStyle} />

        {/* Interest Count */}
        <div style={interestPillStyle}>
          <Flame
            size={11}
            color={isLiked ? '#A8894F' : 'rgba(248,246,241,0.70)'}
          />
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'rgba(248,246,241,0.90)',
            letterSpacing: '0.2px',
          }}>
            {formatCount(likeCount)}
          </span>
        </div>

        {/* Menu */}
        <div style={menuWrapperStyle} ref={menuRef}>
          {/* Menu Trigger Button */}
          <div
            style={menuTriggerStyle}
            onClick={toggleMenu}
          >
            <MoreVertical
              size={15}
              color={menuOpen ? '#1A1A1A' : 'rgba(248,246,241,0.90)'}
              style={{ transition: 'color 0.2s ease' }}
            />
          </div>

          {/* Menu Items Container */}
          <div style={menuContainerStyle}>
            {menuItems.map((menuItem, index) => {
              const Icon = menuItem.icon;

              return (
                <div
                  key={menuItem.id}
                  style={menuItemStyle(menuItem, menuItem.tx, menuItem.ty, index)}
                  onClick={(e) => {
                    e.stopPropagation();
                    menuItem.onClick(e);
                  }}
                  onMouseEnter={() => setHoveredMenuItem(menuItem.id)}
                  onMouseLeave={() => setHoveredMenuItem(null)}
                >
                  <Icon
                    size={15}
                    color={menuItem.getColor ? menuItem.getColor() : 'rgba(248,246,241,0.90)'}
                    style={menuItem.id === 'like' && likeAnimating ? { animation: 'heartBeat 0.4s ease' } : {}}
                  />
                  {hoveredMenuItem === menuItem.id && (
                    <div style={tooltipStyle}>
                      {menuItem.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Tags */}
        {visibleTags.length > 0 && (
          <div style={tagsContainerStyle}>
            {visibleTags.map((tag, idx) => (
              <span key={idx} style={tagStyle}>{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Name Label Below Card */}
      <div style={nameLabelStyle}>
        {item.name && (
          <>
            <span style={nameStyle}>{item.name}</span>
            {item.designer && (
              <span style={designerStyle}>by {item.designer}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GalleryCard;
