// hooks/useSettings.ts
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface SystemSettings {
  id: number;
  company_name: string;
  company_address: string | null;
  company_phone: string | null;
  company_email: string | null;
  company_website: string | null;
  company_tax_id: string | null;
  fiscal_year_start: string;
  fiscal_year_end: string;
  date_format: string;
  time_format: string;
  timezone: string;
  currency: string;
  currency_symbol: string;
  vat_rate: number;
}

export function useSettings() {
  const { authFetch } = useAuth();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await authFetch(`${API_BASE_URL}/api/settings/system`);
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.settings);
      } else {
        throw new Error(data.message || 'Failed to load settings');
      }
    } catch (err: any) {
      console.error('Error fetching settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading, error, refetch: fetchSettings };
}