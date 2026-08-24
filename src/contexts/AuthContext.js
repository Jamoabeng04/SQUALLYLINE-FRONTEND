// contexts/AuthContext.js
import { createContext } from 'react';

export const ROLES = {
  ADMIN: 'admin',
  APPRENTICE: 'apprentice',
  CUSTOMER: 'customer',
};

// The backend returns the user under two slightly different shapes:
//   login/register -> UserSerializer (flat user fields)
//   /auth/me/      -> ProfileSerializer ({ user: {...}, phone, address, gender, ... })
// Normalise both into one flat object the UI can rely on.
export const transformUserData = (payload) => {
  if (!payload) return null;

  const isProfileShape = Boolean(payload.user && typeof payload.user === 'object');
  const user = isProfileShape ? payload.user : payload;
  const profile = isProfileShape ? payload : payload.profile || {};

  const firstName = user.first_name || '';
  const lastName = user.last_name || '';

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role || ROLES.CUSTOMER,
    firstName,
    lastName,
    fullName: user.full_name || `${firstName} ${lastName}`.trim() || user.username,
    isActive: user.is_active !== false,
    dateJoined: user.date_joined,
    lastLogin: user.last_login,

    // Profile side
    profileId: isProfileShape ? payload.id : profile.id,
    phone: profile.phone || '',
    address: profile.address || '',
    dateOfBirth: profile.date_of_birth || null,
    gender: profile.gender || '',
    profilePic: profile.profile_pic || null,
  };
};

export const AuthContext = createContext(undefined);
