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
    // Definir os novos produtos de teste
    const testProductCodes = ['RFF23VG01', 'RFZ32BG01', 'RSA15LL01', 'RSD23IW01', 'RSD23UR01'];
    
    // Todas as estantes e prateleiras disponíveis
    const availableEstantes = ['A', 'B', 'C', 'D', 'E', 'F'];
    const availablePrateleiras = [1, 2, 3, 4, 5, 6, 7, 8];

    // Função para gerar localização aleatória
    const generateRandomLocation = (): ShelfLocation => ({
      estante: availableEstantes[Math.floor(Math.random() * availableEstantes.length)],
      prateleira: availablePrateleiras[Math.floor(Math.random() * availablePrateleiras.length)]
    });

    // Função para gerar localizações únicas para um produto
    const generateUniqueLocations = (min: number, max: number): ShelfLocation[] => {
      const count = Math.floor(Math.random() * (max - min + 1)) + min;
      const locations: ShelfLocation[] = [];
      const usedKeys = new Set<string>();

      while (locations.length < count) {
        const location = generateRandomLocation();
        const key = `${location.estante}${location.prateleira}`;
        
        if (!usedKeys.has(key)) {
          locations.push(location);
          usedKeys.add(key);
        }
      }

      return locations;
    };

    // Função para gerar quantidade aleatória entre 50-120
    const generateRandomQuantity = (): number => 
      Math.floor(Math.random() * (120 - 50 + 1)) + 50;

    // Verificar/criar produtos
    const createdProducts: { [key: string]: Product } = {};
    
    for (const productCode of testProductCodes) {
      let product = products.find(p => p.codigo === productCode);
      
      if (!product) {
        console.log(`📦 Tentando buscar produto ${productCode} na API...`);
        
        // Tentar criar produto da API
        product = await createProductFromApi(productCode);
        
        if (!product) {
          console.log(`📦 Criando produto básico ${productCode}...`);
          
          // Criar produto básico se não encontrar na API
          const basicProduct: Product = {
            id: `local-product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            codigo: productCode,
            
            modelo: productCode.substring(0, 6),
            acabamento: productCode.substring(6, 8),
            cor: productCode.substring(8, 10),
            comprimento: 32,
            descricao: `Produto EPW ${productCode}`,
          };
          
          product = basicProduct;
        }
        
        createdProducts[productCode] = product;
        console.log(`✅ Produto preparado: ${productCode}`);
      } else {
        createdProducts[productCode] = product;
        console.log(`🔍 Produto existente encontrado: ${productCode}`);
      }
    }

    let totalMaterials = 0;
    let totalPieces = 0;

    // Para cada produto, gerar localizações aleatórias
    for (const productCode of testProductCodes) {
      const locations = generateUniqueLocations(2, 5); // Entre 2 a 5 localizações por produto
      let productTotalPieces = 0;
      
      console.log(`📍 Distribuindo ${productCode} por ${locations.length} localizações:`);
      
      for (const location of locations) {
        const quantity = generateRandomQuantity();
        
        const material = await addMaterial({
          productId: createdProducts[productCode].id,
          product: createdProducts[productCode],
          pecas: quantity,
          location,
        });

        await addMovement({
          materialId: material.id,
          type: 'entrada',
          pecas: quantity,
          norc: 'TESTE-INICIAL',
          date: new Date().toISOString(),
        });

        console.log(`  ✅ ${location.estante}${location.prateleira} - ${quantity} peças`);
        totalMaterials++;
        totalPieces += quantity;
        productTotalPieces += quantity;
      }
      
      console.log(`🎯 Total ${productCode}: ${productTotalPieces} peças em ${locations.length} localizações`);
    }

    console.log(`🎉 População de dados concluída!`);
    console.log(`📊 Resumo: ${totalMaterials} materiais, ${totalPieces} peças totais, ${testProductCodes.length} produtos diferentes`);
    
    toast.success(`Dados de teste populados! ${totalMaterials} materiais (${totalPieces} peças) distribuídos aleatoriamente.`);
    
    return {
      success: true,
      materialsAdded: totalMaterials,
      totalPieces: totalPieces,
      productsCreated: Object.keys(createdProducts).length,
    };

  } catch (error) {
    console.error('🔴 Erro ao popular dados de teste:', error);
    toast.error('Erro ao popular dados de teste');
    throw error;
  }
};