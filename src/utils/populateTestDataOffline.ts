import { Material, Product, Movement, ShelfLocation } from '@/types/warehouse';
import { toast } from 'sonner';

interface PopulateTestDataOfflineProps {
  materials: Material[];
  products: Product[];
  movements: Movement[];
  setMaterials: React.Dispatch<React.SetStateAction<Material[]>>;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setMovements: React.Dispatch<React.SetStateAction<Movement[]>>;
}

export const populateTestDataOffline = async ({
  materials,
  products,
  setMaterials,
  setProducts,
  setMovements,
}: PopulateTestDataOfflineProps) => {
  console.log('🔄 Iniciando população de dados de teste (MODO OFFLINE)...');
  
  try {
    // Definir os produtos de teste
    const testProducts = [
      { code: 'RSZ32AG01', quantidade: 120 },
      { code: 'RSEZ23VL01', quantidade: 58 },
      { code: 'RFL23AL01', quantidade: 280 },
    ];

    // Criar produtos básicos se não existirem
    const newProducts: Product[] = [...products];
    const createdProducts: { [key: string]: Product } = {};
    
    for (const testProduct of testProducts) {
      let product = newProducts.find(p => p.codigo === testProduct.code);
      
      if (!product) {
        console.log(`📦 Criando produto ${testProduct.code} (offline)...`);
        
        const basicProduct: Product = {
          id: `offline-product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          codigo: testProduct.code,
          
          modelo: testProduct.code.substring(0, 6),
          acabamento: 'PADRÃO',
          cor: 'NATURAL',
          comprimento: 32,
          descricao: `Produto de teste offline ${testProduct.code}`,
        };
        
        newProducts.push(basicProduct);
        createdProducts[testProduct.code] = basicProduct;
        console.log(`✅ Produto criado offline: ${testProduct.code}`);
      } else {
        createdProducts[testProduct.code] = product;
      }
    }

    // Atualizar produtos no estado
    setProducts(newProducts);

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

    const newMaterials: Material[] = [...materials];
    const newMovements: Movement[] = [];
    let totalMaterials = 0;

    // Função para criar material offline
    const createMaterialOffline = (product: Product, pecas: number, location: ShelfLocation) => {
      const materialId = `offline-material-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const material: Material = {
        id: materialId,
        productId: product.id,
        product,
        pecas,
        location,
      };

      newMaterials.push(material);

      // Criar movimento de entrada
      const movement: Movement = {
        id: `offline-movement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        materialId: materialId,
        type: 'entrada',
        pecas,
        norc: 'TESTE-INICIAL-OFFLINE',
        date: new Date().toISOString(),
      };

      newMovements.push(movement);
      return material;
    };

    // Adicionar RSZ32AG01 às prateleiras ímpares de B e F
    console.log('📍 Adicionando RSZ32AG01 às prateleiras (offline)...');
    for (const location of rszLocations) {
      createMaterialOffline(createdProducts['RSZ32AG01'], 120, location);
      console.log(`✅ Adicionado offline: ${location.estante}${location.prateleira} - 120 peças RSZ32AG01`);
      totalMaterials++;
    }

    // Adicionar RSEZ23VL01 às prateleiras pares de C e D
    console.log('📍 Adicionando RSEZ23VL01 às prateleiras (offline)...');
    for (const location of rsezLocations) {
      createMaterialOffline(createdProducts['RSEZ23VL01'], 58, location);
      console.log(`✅ Adicionado offline: ${location.estante}${location.prateleira} - 58 peças RSEZ23VL01`);
      totalMaterials++;
    }

    // Adicionar RFL23AL01 à estante A
    console.log('📍 Adicionando RFL23AL01 à estante A (offline)...');
    for (const location of rflLocations) {
      createMaterialOffline(createdProducts['RFL23AL01'], 280, location);
      console.log(`✅ Adicionado offline: ${location.estante}${location.prateleira} - 280 peças RFL23AL01`);
      totalMaterials++;
    }

    // Atualizar estado com novos materiais e movimentos
    setMaterials(newMaterials);
    setMovements(prev => [...prev, ...newMovements]);

    // Salvar no localStorage para persistência
    localStorage.setItem('warehouse_test_data_populated', 'true');
    localStorage.setItem('warehouse_test_data_timestamp', new Date().toISOString());

    console.log(`🎉 População de dados offline concluída! ${totalMaterials} materiais adicionados.`);
    toast.success(`Dados de teste populados com sucesso (MODO OFFLINE)! ${totalMaterials} materiais adicionados.`);
    
    return {
      success: true,
      materialsAdded: totalMaterials,
      productsCreated: Object.keys(createdProducts).length,
      mode: 'offline',
    };

  } catch (error) {
    console.error('🔴 Erro ao popular dados de teste offline:', error);
    toast.error('Erro ao popular dados de teste offline');
    throw error;
  }
};