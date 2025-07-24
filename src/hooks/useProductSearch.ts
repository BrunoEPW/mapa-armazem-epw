import { useState, useMemo } from 'react';
import { Product } from '@/types/warehouse';
import { CombinedProduct } from './useCombinedProducts';

export const useProductSearch = <T extends Product | CombinedProduct>(products: T[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFamilia, setSelectedFamilia] = useState('');
  const [selectedSource, setSelectedSource] = useState<'all' | 'local' | 'api'>('all');

  const familias = useMemo(() => {
    const uniqueFamilias = [...new Set(products.map(p => p.familia))];
    return uniqueFamilias.sort();
  }, [products]);

  const filteredProducts = useMemo((): T[] => {
    let filtered = products;
    
    // Filter by source first
    if (selectedSource !== 'all' && 'source' in (products[0] || {})) {
      filtered = filtered.filter(product => 
        (product as CombinedProduct).source === selectedSource
      );
    }
    
    // Filter by family
    if (selectedFamilia && selectedFamilia !== 'all') {
      filtered = filtered.filter(product => product.familia === selectedFamilia);
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.modelo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.acabamento.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.cor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.comprimento.toString().includes(searchQuery)
      );
    }
    
    return filtered as T[];
  }, [products, searchQuery, selectedFamilia, selectedSource]);

  return {
    searchQuery,
    setSearchQuery,
    selectedFamilia,
    setSelectedFamilia,
    selectedSource,
    setSelectedSource,
    familias,
    filteredProducts,
  };
};