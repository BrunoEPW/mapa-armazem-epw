import { useWarehouse } from '@/contexts/WarehouseContext';
import { 
  cleanNonApiProductsFromShelf, 
  cleanAllNonApiProducts, 
  applyCleanupResults,
  CleanupResult 
} from '@/utils/nonApiProductCleaner';
import { toast } from 'sonner';

export const useNonApiProductCleaner = () => {
  const { 
    materials, 
    products, 
    movements, 
    removeMaterial,
    deleteProduct,
    clearAllData
  } = useWarehouse();

  const cleanShelf = async (estante: string, prateleira: number): Promise<CleanupResult> => {
    try {
      console.log(`🧹 Starting cleanup for shelf ${estante}${prateleira}`);
      
      const cleanupResult = cleanNonApiProductsFromShelf(materials, products, estante, prateleira);
      
      if (cleanupResult.materialsRemoved === 0) {
        toast.info(`Prateleira ${estante}${prateleira} não tem produtos não-API para remover`);
        return cleanupResult;
      }
      
      // Remove materials one by one
      for (const material of cleanupResult.removedItems.materials) {
        await removeMaterial(material.id);
      }
      
      // Remove products one by one (only if they have no remaining materials)
      for (const product of cleanupResult.removedItems.products) {
        const remainingMaterials = materials.filter(m => 
          m.product.id === product.id && 
          !cleanupResult.removedItems.materials.find(rm => rm.id === m.id)
        );
        
        if (remainingMaterials.length === 0) {
          await deleteProduct(product.id);
        }
      }
      
      toast.success(
        `Prateleira ${estante}${prateleira} limpa: removidos ${cleanupResult.materialsRemoved} materiais (${cleanupResult.totalPiecesRemoved} peças)`
      );
      
      return cleanupResult;
      
    } catch (error) {
      console.error('❌ Error cleaning shelf:', error);
      toast.error(`Erro ao limpar prateleira ${estante}${prateleira}`);
      throw error;
    }
  };

  const cleanAllShelves = async (): Promise<CleanupResult> => {
    try {
      console.log('🧹 Starting global cleanup of all non-API products');
      
      const cleanupResult = cleanAllNonApiProducts(materials, products);
      
      if (cleanupResult.materialsRemoved === 0) {
        toast.info('Não foram encontrados produtos não-API para remover');
        return cleanupResult;
      }
      
      // Show preview before confirmation
      const confirmMessage = `
        Será removido:
        • ${cleanupResult.productsRemoved} produtos não-API
        • ${cleanupResult.materialsRemoved} materiais
        • ${cleanupResult.totalPiecesRemoved} peças totais
        
        Esta ação não pode ser revertida. Continuar?
      `;
      
      if (!window.confirm(confirmMessage)) {
        toast.info('Limpeza cancelada pelo utilizador');
        return { ...cleanupResult, success: false };
      }
      
      // Remove materials one by one
      for (const material of cleanupResult.removedItems.materials) {
        await removeMaterial(material.id);
      }
      
      // Remove products one by one
      for (const product of cleanupResult.removedItems.products) {
        await deleteProduct(product.id);
      }
      
      toast.success(
        `Limpeza global concluída: removidos ${cleanupResult.productsRemoved} produtos, ${cleanupResult.materialsRemoved} materiais (${cleanupResult.totalPiecesRemoved} peças)`
      );
      
      return cleanupResult;
      
    } catch (error) {
      console.error('❌ Error in global cleanup:', error);
      toast.error('Erro durante a limpeza global');
      throw error;
    }
  };

  const previewCleanup = (): CleanupResult => {
    return cleanAllNonApiProducts(materials, products);
  };

  return {
    cleanShelf,
    cleanAllShelves,
    previewCleanup,
  };
};