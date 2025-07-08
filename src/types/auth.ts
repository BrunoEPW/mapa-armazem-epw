export type UserRole = 'admin' | 'editor' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  last_seen?: string;
}

export interface AuthState {
  user: UserProfile | null;
  session: any;
  loading: boolean;
}

export const ROLE_PERMISSIONS = {
  admin: {
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    canManageUsers: true,
    canViewReports: true,
  },
  editor: {
    canCreate: true,
    canUpdate: true,
    canDelete: false,
    canManageUsers: false,
    canViewReports: true,
  },
  viewer: {
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canManageUsers: false,
    canViewReports: true,
  },
} as const;