import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface AdminStore {
  isAdminAuthenticated: boolean;
  adminUser: AdminUser | null;
  adminToken: string | null;
  loginAdmin: (credentials: { email: string; password: string }) => Promise<boolean>;
  logoutAdmin: () => void;
  setAdminAuth: (user: AdminUser, token: string) => void;
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      isAdminAuthenticated: false,
      adminUser: null,
      adminToken: null,

      loginAdmin: async (credentials) => {
        try {
          const response = await fetch('/api/admin/auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
          });

          const data = await response.json();

          if (data.success) {
            const adminUser = {
              id: data.user.id,
              firstName: data.user.firstName,
              lastName: data.user.lastName,
              email: data.user.email,
              role: data.user.role,
            };
            
            set({ 
              isAdminAuthenticated: true, 
              adminUser,
              adminToken: data.token,
            });
            return true;
          }
          return false;
        } catch (error) {
          console.error('Admin login error:', error);
          return false;
        }
      },

      setAdminAuth: (user: AdminUser, token: string) => {
        set({
          isAdminAuthenticated: true,
          adminUser: user,
          adminToken: token,
        });
      },

      logoutAdmin: () => {
        set({ 
          isAdminAuthenticated: false, 
          adminUser: null,
          adminToken: null,
        });
      },
    }),
    {
      name: 'maisonmiaro-admin',
    }
  )
);
