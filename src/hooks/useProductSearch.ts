import { useState, useMemo } from 'react';
import { Product } from '@/types/warehouse';

export const useProductSearch = (products: Product[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFamilia, setSelectedFamilia] = useState('');

  const familias = useMemo(() => {
    const uniqueFamilias = [...new Set(products.map(p => p.familia))];
    return uniqueFamilias.sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    // Filter by family first
    if (selectedFamilia && selectedFamilia !== 'all') {
      filtered = filtered.filter(product => product.familia === selectedFamilia);
    }
    
    // Then filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.modelo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.acabamento.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.cor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.comprimento.toString().includes(searchQuery)
      );
    }
    
    return filtered;
  }, [products, searchQuery, selectedFamilia]);

  return {
    searchQuery,
    setSearchQuery,
    selectedFamilia,
    setSelectedFamilia,
    familias,
    filteredProducts,
  };
};