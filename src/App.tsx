import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WarehouseProvider } from "@/contexts/WarehouseContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Warehouse from "./pages/Warehouse";
import Shelf from "./pages/Shelf";
import ShelfDetail from "./pages/ShelfDetail";
import Search from "./pages/Search";
import Products from "./pages/Products";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <WarehouseProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/armazem" element={<Warehouse />} />
              <Route path="/estante/:estante" element={<Shelf />} />
              <Route path="/prateleira/:estante/:prateleira" element={<ShelfDetail />} />
              <Route path="/pesquisa" element={<Search />} />
              <Route path="/login" element={<Login />} />
              <Route path="/produtos" element={<Products />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </WarehouseProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
