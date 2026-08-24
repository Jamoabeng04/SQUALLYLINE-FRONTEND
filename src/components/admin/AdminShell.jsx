import React from 'react';
import AdminNav from './AdminNav';

/**
 * Consistent chrome for every admin page: centred max-width container, a
 * header (eyebrow + sans title + subtitle + actions slot) and the shared
 * route nav. Pages pass their own body as children.
 *
 * Props:
 *   eyebrow   short uppercase kicker (string)
 *   title     page title (string | node)
 *   subtitle  supporting line (string | node)
 *   actions   right-aligned header controls (node)
 *   nav       render the shared AdminNav (default true)
 *   className extra classes on the shell
 */
export default function AdminShell({
  eyebrow,
  title,
  subtitle,
  actions,
  nav = true,
  className = '',
  children,
}) {
  return (
    <main className={`admin-shell ${className}`.trim()}>
      <header className="admin-shell-header">
        <div>
          {eyebrow && <span className="ash-eyebrow">{eyebrow}</span>}
          {title && <h1>{title}</h1>}
          {subtitle && <p className="ash-sub">{subtitle}</p>}
        </div>
        {actions && <div className="ash-actions">{actions}</div>}
      </header>

      {nav && <AdminNav />}

      {children}
    </main>
  );
}
