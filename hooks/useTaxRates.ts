// hooks/useTaxRates.ts
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface TaxRate {
  id: number;
  name: string;
  rate: number;
  type: string;
  description: string | null;
  is_active: boolean;
  is_default: boolean;
}

export function useTaxRates(includeInactive = false) {
  const { authFetch } = useAuth();
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [defaultTaxRate, setDefaultTaxRate] = useState<TaxRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTaxRates();
  }, [includeInactive]);

  const fetchTaxRates = async () => {
    try {
      setLoading(true);
      const response = await authFetch(
        `${API_BASE_URL}/api/settings/tax-rates${includeInactive ? '?include_inactive=true' : ''}`
      );
      const data = await response.json();
      
      if (data.success) {
        setTaxRates(data.tax_rates || []);
        const defaultRate = data.tax_rates?.find((rate: TaxRate) => rate.is_default);
        setDefaultTaxRate(defaultRate || null);
      } else {
        throw new Error(data.message || 'Failed to load tax rates');
      }
    } catch (err: any) {
      console.error('Error fetching tax rates:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { taxRates, defaultTaxRate, loading, error, refetch: fetchTaxRates };
}