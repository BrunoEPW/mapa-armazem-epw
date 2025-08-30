import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WarehouseProvider } from "@/contexts/WarehouseContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { clearAllAppCache } from "@/utils/cacheUtils";

import Index from "./pages/Index";
import Shelf from "./pages/Shelf";
import ShelfDetail from "./pages/ShelfDetail";
import Search from "./pages/Search";
import Products from "./pages/Products";
import Movements from "./pages/Movements";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Clear all cache on app startup
clearAllAppCache();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WarehouseProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/estante/:estante" element={<Shelf />} />
                <Route path="/prateleira/:estante/:prateleira" element={<ShelfDetail />} />
                <Route path="/pesquisa" element={<Search />} />
                <Route path="/produtos" element={<Products />} />
                <Route path="/movimentos" element={<Movements />} />
                <Route path="/relatorios" element={<Reports />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            <Toaster />
            <Sonner />
          </WarehouseProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;