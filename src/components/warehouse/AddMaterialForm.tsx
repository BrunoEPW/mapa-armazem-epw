
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { ShelfLocation, Product } from '@/types/warehouse';
import { toast } from 'sonner';
import { ProductSelectorAdvanced } from './ProductSelectorAdvanced';

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
  const [norc, setNorc] = useState<string>('');

  const handleProductSelect = (productId: string, product: Product) => {
    setSelectedProductId(productId);
    setSelectedProduct(product);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      
      // Direct DOM manipulation to show debug info
      document.title = `DEBUG: Step 1 - Function started`;
      
      console.log('=== ADD MATERIAL DEBUG ===');
      console.log('🔍 Function started, checking variables...');
      console.log('🔍 selectedProductId:', selectedProductId);
      console.log('🔍 selectedProductId type:', typeof selectedProductId);
      console.log('🔍 selectedProduct exists:', !!selectedProduct);
      console.log('🔍 selectedProduct:', selectedProduct);
      console.log('🔍 pecas:', pecas);
      console.log('🔍 pecas type:', typeof pecas);
      console.log('🔍 norc:', norc);
      console.log('🔍 norc type:', typeof norc);
      console.log('🔍 location:', location);
      console.log('🔍 About to start validation...');
      
      document.title = `DEBUG: Step 2 - Starting validation`;
      
      if (!selectedProductId || !selectedProduct) {
        document.title = `DEBUG: ERROR - No product selected`;
        console.log('❌ ERROR: No product selected');
        toast.error('Por favor, selecione um produto');
        return;
      }

    if (pecas <= 0) {
      console.log('ERROR: Invalid pecas:', pecas);
      toast.error('Por favor, especifique uma quantidade válida');
      return;
    }

    if (!norc.trim()) {
      console.log('ERROR: No NORC provided');
      toast.error('Por favor, especifique o NORC');
      return;
    }

      document.title = `DEBUG: Step 3 - Validation passed`;
      console.log('=== VALIDATION PASSED ===');

    try {
      console.log('=== STARTING ADD MATERIAL PROCESS ===');
      console.log('🔍 selectedProduct:', JSON.stringify(selectedProduct, null, 2));
      console.log('🔍 selectedProduct.id:', selectedProduct.id);
      console.log('🔍 selectedProduct.id type:', typeof selectedProduct.id);
      
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
      console.log('🔍 About to check if API product...');

      // If it's an API product, create it locally first
      if (selectedProduct.id.startsWith('api_')) {
        console.log('🔄 Creating local product from API data...');
        console.log('🔍 API Product details:', JSON.stringify(selectedProduct, null, 2));
        console.log('🔍 API Product ID:', selectedProduct.id);
        console.log('🔍 createProductFromApi function exists:', !!createProductFromApi);
        
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
          
          // More specific error message based on error type
          let userMessage = 'Erro ao criar produto localmente';
          if (createError?.message?.includes('Campo obrigatório')) {
            userMessage = `Dados incompletos: ${createError.message}`;
          } else if (createError?.message?.includes('Supabase')) {
            userMessage = 'Erro de conexão com a base de dados';
          } else if (createError?.message?.includes('conversão')) {
            userMessage = 'Erro na conversão dos dados do produto';
          }
          
          toast.error(userMessage);
          return;
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
      console.log('=== PROCESS COMPLETED SUCCESSFULLY ===');
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
      <ProductSelectorAdvanced
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
          <Label htmlFor="norc">NORC</Label>
          <Input
            id="norc"
            type="text"
            value={norc}
            onChange={(e) => setNorc(e.target.value)}
            placeholder="Ex: OF123456"
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
