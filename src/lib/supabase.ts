// Cliente Supabase. Só é criado quando as variáveis de ambiente existem;
// sem elas, o app roda no modo demonstração (dados locais).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const SUPABASE_ENABLED = !!url && !!key;

export const supabase: SupabaseClient | null = SUPABASE_ENABLED
  ? createClient(url!, key!, {
      auth: {
        // AsyncStorage funciona em iOS, Android e web.
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
