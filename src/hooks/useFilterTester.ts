// Hook to test filter codes and find working combinations
import { useState, useCallback } from 'react';
import { testFilterCode, findWorkingFilterCodes } from '@/utils/filterCodeMapper';
import { ApiAttribute } from '@/services/attributesApiService';

interface FilterTestResult {
  filterType: string;
  code: string;
  description: string;
  isWorking: boolean;
  recordsFound?: number;
}

interface UseFilterTesterReturn {
  testing: boolean;
  results: FilterTestResult[];
  testSingleCode: (filterType: string, code: string, description: string) => Promise<boolean>;
  testAllCodes: (filterType: string, codes: ApiAttribute[]) => Promise<FilterTestResult[]>;
  clearResults: () => void;
}

export const useFilterTester = (): UseFilterTesterReturn => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<FilterTestResult[]>([]);

  const testSingleCode = useCallback(async (filterType: string, code: string, description: string): Promise<boolean> => {
    console.log(`🧪 [FilterTester] Testing ${filterType}=${code}`);
    
    try {
      const isWorking = await testFilterCode(filterType, code);
      
      const result: FilterTestResult = {
        filterType,
        code,
        description,
        isWorking
      };
      
      setResults(prev => [...prev, result]);
      return isWorking;
    } catch (error) {
      console.error(`🧪 [FilterTester] Error testing ${filterType}=${code}:`, error);
      return false;
    }
  }, []);

  const testAllCodes = useCallback(async (filterType: string, codes: ApiAttribute[]): Promise<FilterTestResult[]> => {
    setTesting(true);
    setResults([]);
    
    console.log(`🧪 [FilterTester] Testing all ${codes.length} codes for ${filterType}...`);
    
    const testResults: FilterTestResult[] = [];
    
    for (const code of codes.slice(0, 10)) { // Test only first 10 to avoid overwhelming API
      try {
        const isWorking = await testFilterCode(filterType, code.l);
        
        const result: FilterTestResult = {
          filterType,
          code: code.l,
          description: code.d,
          isWorking
        };
        
        testResults.push(result);
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`🧪 [FilterTester] Error testing ${filterType}=${code.l}:`, error);
        
        testResults.push({
          filterType,
          code: code.l,
          description: code.d,
          isWorking: false
        });
      }
    }
    
    setResults(testResults);
    setTesting(false);
    
    console.log(`🧪 [FilterTester] Test complete for ${filterType}:`, {
      total: testResults.length,
      working: testResults.filter(r => r.isWorking).length,
      failed: testResults.filter(r => !r.isWorking).length
    });
    
    return testResults;
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return {
    testing,
    results,
    testSingleCode,
    testAllCodes,
    clearResults
  };
};