import { useState, useEffect } from 'react';

interface Modelo {
  codigo: string;
  descricao: string;
}

export const useModelos = () => {
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModelos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('https://pituxa.epw.pt/api/atributos/modelo');
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setModelos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar modelos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModelos();
  }, []);

  return {
    modelos,
    loading,
    error,
    refresh: fetchModelos
  };
};