import { Material, Product, ShelfLocation } from '@/types/warehouse';
import { toast } from 'sonner';

interface PopulateTestDataProps {
  addMaterial: (material: Omit<Material, 'id'>) => Promise<Material>;
  addMovement: (movement: Omit<import('@/types/warehouse').Movement, 'id'>) => Promise<void>;
  createProductFromApi: (productCode: string) => Promise<Product | null>;
  products: Product[];
}

export const populateTestData = async ({
  addMaterial,
  addMovement,
  createProductFromApi,
  products,
}: PopulateTestDataProps) => {
  console.log('🚀 Iniciando população de dados de teste...');
  
  try {
    // Definir os produtos de teste
    const testProducts = [
      { code: 'RSZ32AG01', quantidade: 120 },
      { code: 'RSEZ23VL01', quantidade: 58 },
      { code: 'RFL23AL01', quantidade: 280 },
    ];

    // Verificar/criar produtos
    const createdProducts: { [key: string]: Product } = {};
    
    for (const testProduct of testProducts) {
      let product = products.find(p => p.codigo === testProduct.code);
      
      if (!product) {
        console.log(`📦 Criando produto ${testProduct.code}...`);
        
        // Criar produto básico diretamente (não usar API para dados de teste)
        const basicProduct: Product = {
          id: `local-product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          codigo: testProduct.code,
          familia: 'TESTE',
          modelo: testProduct.code.substring(0, 6),
          acabamento: 'PADRÃO',
          cor: 'NATURAL',
          comprimento: 32,
          descricao: `Produto de teste ${testProduct.code}`,
        };
        
        product = basicProduct;
        createdProducts[testProduct.code] = basicProduct;
        console.log(`✅ Produto criado: ${testProduct.code}`);
      } else {
        createdProducts[testProduct.code] = product;
      }
    }

    // Definir localizações para RSZ32AG01 (prateleiras ímpares de B e F)
    const rszLocations: ShelfLocation[] = [
      { estante: 'B', prateleira: 1 },
      { estante: 'B', prateleira: 3 },
      { estante: 'B', prateleira: 5 },
      { estante: 'B', prateleira: 7 },
      { estante: 'F', prateleira: 1 },
      { estante: 'F', prateleira: 3 },
      { estante: 'F', prateleira: 5 },
      { estante: 'F', prateleira: 7 },
    ];

    // Definir localizações para RSEZ23VL01 (prateleiras pares de C e D)
    const rsezLocations: ShelfLocation[] = [
      { estante: 'C', prateleira: 2 },
      { estante: 'C', prateleira: 4 },
      { estante: 'C', prateleira: 6 },
      { estante: 'D', prateleira: 2 },
      { estante: 'D', prateleira: 4 },
      { estante: 'D', prateleira: 6 },
    ];

    // Definir localizações para RFL23AL01 (estante A)
    const rflLocations: ShelfLocation[] = [
      { estante: 'A', prateleira: 1 },
    ];

    let totalMaterials = 0;

    // Adicionar RSZ32AG01 às prateleiras ímpares de B e F
    console.log('📍 Adicionando RSZ32AG01 às prateleiras...');
    for (const location of rszLocations) {
      const material = await addMaterial({
        productId: createdProducts['RSZ32AG01'].id,
        product: createdProducts['RSZ32AG01'],
        pecas: 120,
        location,
      });

      await addMovement({
        materialId: material.id,
        type: 'entrada',
        pecas: 120,
        norc: 'TESTE-INICIAL',
        date: new Date().toISOString(),
      });

      console.log(`✅ Adicionado: ${location.estante}${location.prateleira} - 120 peças RSZ32AG01`);
      totalMaterials++;
    }

    // Adicionar RSEZ23VL01 às prateleiras pares de C e D
    console.log('📍 Adicionando RSEZ23VL01 às prateleiras...');
    for (const location of rsezLocations) {
      const material = await addMaterial({
        productId: createdProducts['RSEZ23VL01'].id,
        product: createdProducts['RSEZ23VL01'],
        pecas: 58,
        location,
      });

      await addMovement({
        materialId: material.id,
        type: 'entrada',
        pecas: 58,
        norc: 'TESTE-INICIAL',
        date: new Date().toISOString(),
      });

      console.log(`✅ Adicionado: ${location.estante}${location.prateleira} - 58 peças RSEZ23VL01`);
      totalMaterials++;
    }

    // Adicionar RFL23AL01 à estante A
    console.log('📍 Adicionando RFL23AL01 à estante A...');
    for (const location of rflLocations) {
      const material = await addMaterial({
        productId: createdProducts['RFL23AL01'].id,
        product: createdProducts['RFL23AL01'],
        pecas: 280,
        location,
      });

      await addMovement({
        materialId: material.id,
        type: 'entrada',
        pecas: 280,
        norc: 'TESTE-INICIAL',
        date: new Date().toISOString(),
      });

      console.log(`✅ Adicionado: ${location.estante}${location.prateleira} - 280 peças RFL23AL01`);
      totalMaterials++;
    }

    console.log(`🎉 População de dados concluída! ${totalMaterials} materiais adicionados.`);
    toast.success(`Dados de teste populados com sucesso! ${totalMaterials} materiais adicionados.`);
    
    return {
      success: true,
      materialsAdded: totalMaterials,
      productsCreated: Object.keys(createdProducts).length,
    };

  } catch (error) {
    console.error('🔴 Erro ao popular dados de teste:', error);
    toast.error('Erro ao popular dados de teste');
    throw error;
  }
};