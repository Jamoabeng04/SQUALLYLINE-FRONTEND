import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, Scissors, Tags, CalendarCheck, Factory,
} from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';

/**
 * Route-level navigation shared by every admin screen so the console reads as
 * one product. Items are gated by role to mirror the sidebar:
 *   - staff (admin + apprentice) see the operational pages
 *   - only admins see the catalogue-management pages
 * The routes themselves are still guarded by ProtectedRoute; this only decides
 * what to surface.
 */
export default function AdminNav() {
  const { isAdmin, isStaff } = useAuth();

  const items = [
    isStaff && { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    isAdmin && { to: '/admin/products', label: 'Products', icon: Package },
    isAdmin && { to: '/admin/styles', label: 'Styles', icon: Scissors },
    isAdmin && { to: '/admin/categories', label: 'Categories', icon: Tags },
    isStaff && { to: '/admin/consultations', label: 'Consultations', icon: CalendarCheck },
    isStaff && { to: '/admin/production-queue', label: 'Production', icon: Factory },
  ].filter(Boolean);

  if (items.length <= 1) return null;

  return (
    <nav className="admin-nav" aria-label="Admin sections">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => (isActive ? 'active' : undefined)}
        >
          <Icon size={16} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
