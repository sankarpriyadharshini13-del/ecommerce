import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import api from '../lib/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null); // row from our Prisma User table
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  const loadProfile = useCallback(async () => {
    const { data } = await api.get('/auth/me'); // backend verifies token + creates the user row
    setProfile(data.user);
    return data.user;
  }, []);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        try { await loadProfile(); } catch { await supabase.auth.signOut(); }
      }
      if (alive) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { setProfile(null); qc.clear(); }
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, [loadProfile, qc]);

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return loadProfile();
  };

  const register = async (name, email, password, role = 'USER') => {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name, role } } });
    if (error) throw error;
    if (!data.session) return { needsConfirmation: true };
    return { profile: await loadProfile() };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    qc.clear();
  };

  const claimAdmin = async () => {
    const { data } = await api.post('/auth/make-first-admin');
    setProfile(data.user);
    return data.user;
  };

  return (
    <AuthContext.Provider
      value={{ user: profile, isAdmin: profile?.role === 'ADMIN', loading, login, register, logout, claimAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
}
