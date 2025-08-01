
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { ShelfLocation, Product } from '@/types/warehouse';
import { toast } from 'sonner';
import { OptimizedProductSelector } from './OptimizedProductSelector';

interface AddMaterialFormProps {
  location: ShelfLocation;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddMaterialForm: React.FC<AddMaterialFormProps> = ({
  location,
  onSuccess,
  onCancel,
}) => {
  const { products, addMaterial, addMovement, createProductFromApi } = useWarehouse();
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [pecas, setPecas] = useState<number>(1);
  const [norc, setNorc] = useState<string>(''); // Sempre NORC para entradas

  const handleProductSelect = (productId: string, product: Product) => {
    setSelectedProductId(productId);
    setSelectedProduct(product);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      
      
      
      
      
      
      // Validation checks
      if (!selectedProduct || !pecas || !norc.trim()) {
        
        console.log('❌ ERROR: Missing required fields');
        toast.error('Por favor, preencha todos os campos');
        return;
      }
      
      if (!selectedProductId || !selectedProduct) {
        
        console.log('❌ ERROR: No product selected');
        toast.error('Por favor, selecione um produto');
        return;
      }

    if (pecas <= 0) {
      console.log('ERROR: Invalid pecas:', pecas);
      toast.error('Por favor, especifique uma quantidade válida');
      return;
    }

      
      

    try {
      
      let productToUse = selectedProduct;

      // Safety check for selectedProduct.id
      if (!selectedProduct.id || typeof selectedProduct.id !== 'string') {
        console.error('❌ ERROR: selectedProduct.id is invalid:', selectedProduct.id);
        console.error('❌ selectedProduct.id type:', typeof selectedProduct.id);
        console.error('❌ Full selectedProduct:', JSON.stringify(selectedProduct, null, 2));
        toast.error('Erro: ID do produto inválido');
        return;
      }
      
      console.log('✅ selectedProduct.id validation passed');
      

      // If it's an API product, create it locally first
      if (selectedProduct.id.startsWith('api_')) {
        console.log('🔄 Creating local product from API data...');
        
        try {
          console.log('📞 About to call createProductFromApi...');
          console.log('📞 Function type:', typeof createProductFromApi);
          const createdProduct = await createProductFromApi(selectedProduct);
          console.log('✅ Product created from API successfully:', createdProduct);
          productToUse = createdProduct;
        } catch (createError) {
          console.error('❌ Error creating product from API:', createError);
          console.error('❌ Create error details:', {
            message: createError?.message,
            stack: createError?.stack,
            name: createError?.name,
            cause: createError?.cause
          });
          
          // Enhanced error handling - don't fail the material creation
          console.log('🔄 Product creation failed, but continuing with material creation...');
          
          // Use the original API product data as fallback
          productToUse = selectedProduct;
          
          // Show warning but don't stop the process
          toast.warning('Produto não foi guardado na base de dados', {
            description: 'O material será adicionado com dados temporários do produto.'
          });
        }
      } else {
        console.log('📋 Using existing local product:', productToUse);
      }

      const materialId = `${productToUse.id}_${location.estante}${location.prateleira}_${Date.now()}`;
      console.log('Generated materialId:', materialId);
      
      console.log('About to call addMaterial with:', {
        productId: productToUse.id,
        product: productToUse,
        pecas,
        location,
      });
      
      const createdMaterial = await addMaterial({
        productId: productToUse.id,
        product: productToUse,
        pecas,
        location,
      });

      console.log('Material created successfully:', createdMaterial);

      console.log('About to call addMovement with:', {
        materialId: createdMaterial.id,
        type: 'entrada',
        pecas,
        norc: norc.trim(),
        date: new Date().toISOString(),
      });

      await addMovement({
        materialId: createdMaterial.id,
        type: 'entrada',
        pecas,
        norc: norc.trim(),
        date: new Date().toISOString(),
      });

      console.log('Movement added successfully');
      
      toast.success(`Material adicionado com sucesso! ${pecas} peças de ${selectedProduct.epwModelo?.d || selectedProduct.modelo} em ${location.estante}${location.prateleira}`);
      onSuccess();
    } catch (error) {
      console.error('=== ERROR ADDING MATERIAL ===');
      console.error('Error details:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      toast.error('Erro ao adicionar material. Tente novamente.');
    }
    } catch (mainError) {
      console.error('=== CRITICAL ERROR IN HANDLE SUBMIT ===');
      console.error('Critical error details:', mainError);
      console.error('Critical error message:', mainError?.message);
      console.error('Critical error stack:', mainError?.stack);
      toast.error('Erro crítico. Tente novamente.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
        <OptimizedProductSelector
          selectedProductId={selectedProductId}
          onProductSelect={handleProductSelect}
        />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="pecas">Número de Peças</Label>
          <Input
            id="pecas"
            type="number"
            min="1"
            value={pecas}
            onChange={(e) => setPecas(parseInt(e.target.value) || 1)}
            required
          />
        </div>

        <div>
          <Label htmlFor="norc">NORC (Número de Ordem)</Label>
          <Input
            id="norc"
            value={norc}
            onChange={(e) => setNorc(e.target.value)}
            placeholder="Ex: NORC001, OF123456"
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          Adicionar
        </Button>
      </div>
    </form>
  );
};
