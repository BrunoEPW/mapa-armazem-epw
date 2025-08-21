import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useExclusions } from '@/contexts/ExclusionsContext';
import { Search, Eye, EyeOff, AlertTriangle } from 'lucide-react';

interface ExclusionsAnalysisPanelProps {
  products?: any[];
  allProducts?: any[];
}

export const ExclusionsAnalysisPanel: React.FC<ExclusionsAnalysisPanelProps> = ({ 
  products = [], 
  allProducts = [] 
}) => {
  const { exclusions, shouldExcludeProduct } = useExclusions();
  const [isOpen, setIsOpen] = useState(false);
  const [showExcluded, setShowExcluded] = useState(false);
  const [analysis, setAnalysis] = useState<{
    totalProducts: number;
    includedProducts: number;
    excludedProducts: number;
    prefixAnalysis: Array<{
      prefix: string;
      excludedCount: number;
      excludedProducts: string[];
    }>;
    excludedProductsList: Array<{
      codigo: string;
      matchedPrefix: string;
    }>;
  }>({
    totalProducts: 0,
    includedProducts: 0,
    excludedProducts: 0,
    prefixAnalysis: [],
    excludedProductsList: []
  });

  useEffect(() => {
    if (!exclusions.enabled || allProducts.length === 0) {
      setAnalysis({
        totalProducts: allProducts.length,
        includedProducts: allProducts.length,
        excludedProducts: 0,
        prefixAnalysis: [],
        excludedProductsList: []
      });
      return;
    }

    const excludedProductsList: Array<{ codigo: string; matchedPrefix: string }> = [];
    const prefixCounts: Record<string, { count: number; products: string[] }> = {};

    // Initialize prefix counts
    exclusions.prefixes.forEach(prefix => {
      prefixCounts[prefix] = { count: 0, products: [] };
    });

    // Analyze each product
    allProducts.forEach(product => {
      const codigo = product.codigo || product.artigo || '';
      const isExcluded = shouldExcludeProduct(codigo);
      
      if (isExcluded) {
        // Find which prefix matched
        const matchedPrefix = exclusions.prefixes.find(prefix => 
          codigo.toUpperCase().startsWith(prefix.toUpperCase())
        );
        
        if (matchedPrefix) {
          excludedProductsList.push({ codigo, matchedPrefix });
          prefixCounts[matchedPrefix].count++;
          prefixCounts[matchedPrefix].products.push(codigo);
        }
      }
    });

    const prefixAnalysis = exclusions.prefixes.map(prefix => ({
      prefix,
      excludedCount: prefixCounts[prefix]?.count || 0,
      excludedProducts: prefixCounts[prefix]?.products || []
    }));

    setAnalysis({
      totalProducts: allProducts.length,
      includedProducts: allProducts.length - excludedProductsList.length,
      excludedProducts: excludedProductsList.length,
      prefixAnalysis,
      excludedProductsList
    });
  }, [allProducts, exclusions, shouldExcludeProduct]);

  const rProductsAnalysis = () => {
    const rProducts = allProducts.filter(product => {
      const codigo = product.codigo || product.artigo || '';
      return codigo.toUpperCase().startsWith('R');
    });

    const excludedRProducts = rProducts.filter(product => {
      const codigo = product.codigo || product.artigo || '';
      return shouldExcludeProduct(codigo);
    });

    return {
      total: rProducts.length,
      excluded: excludedRProducts.length,
      included: rProducts.length - excludedRProducts.length,
      products: rProducts.map(product => {
        const codigo = product.codigo || product.artigo || '';
        const isExcluded = shouldExcludeProduct(codigo);
        const matchedPrefix = isExcluded ? exclusions.prefixes.find(prefix => 
          codigo.toUpperCase().startsWith(prefix.toUpperCase())
        ) : null;
        
        return {
          codigo,
          isExcluded,
          matchedPrefix
        };
      })
    };
  };

  const rAnalysis = rProductsAnalysis();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Search className="h-4 w-4" />
          Analyze Exclusions
          {analysis.excludedProducts > 0 && (
            <Badge variant="destructive" className="ml-1">
              -{analysis.excludedProducts}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Exclusions Analysis</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Overview Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analysis.totalProducts}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Included</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{analysis.includedProducts}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Excluded</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{analysis.excludedProducts}</div>
              </CardContent>
            </Card>
          </div>

          {/* R Products Special Analysis */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                "R" Products Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-sm text-muted-foreground">Total "R" Products</div>
                  <div className="text-xl font-bold">{rAnalysis.total}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Included</div>
                  <div className="text-xl font-bold text-green-600">{rAnalysis.included}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Excluded</div>
                  <div className="text-xl font-bold text-red-600">{rAnalysis.excluded}</div>
                </div>
              </div>
              
              {rAnalysis.excluded > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Excluded "R" Products:</div>
                  <ScrollArea className="h-32 border rounded p-2">
                    {rAnalysis.products
                      .filter(p => p.isExcluded)
                      .map(product => (
                        <div key={product.codigo} className="text-sm py-1">
                          <span className="font-mono">{product.codigo}</span>
                          {product.matchedPrefix && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              matches "{product.matchedPrefix}"
                            </Badge>
                          )}
                        </div>
                      ))}
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prefix Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Exclusion Prefixes Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {analysis.prefixAnalysis.map(({ prefix, excludedCount, excludedProducts }) => (
                  <div key={prefix} className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        {prefix}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        excludes {excludedCount} products
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log(`Products excluded by "${prefix}":`, excludedProducts);
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Show/Hide Excluded Products */}
          <div className="flex items-center space-x-2">
            <Switch
              id="show-excluded"
              checked={showExcluded}
              onCheckedChange={setShowExcluded}
            />
            <label htmlFor="show-excluded" className="text-sm font-medium">
              Show excluded products list
            </label>
          </div>

          {showExcluded && analysis.excludedProductsList.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Excluded Products</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {analysis.excludedProductsList.map(({ codigo, matchedPrefix }) => (
                    <div key={codigo} className="flex items-center justify-between py-1 text-sm">
                      <span className="font-mono">{codigo}</span>
                      <Badge variant="outline" className="text-xs">
                        matches "{matchedPrefix}"
                      </Badge>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};