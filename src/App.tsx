import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WarehouseProvider } from "@/contexts/WarehouseContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Shelf from "./pages/Shelf";
import ShelfDetail from "./pages/ShelfDetail";
import Search from "./pages/Search";
import Products from "./pages/Products";
import Login from "./pages/Login";
import Reports from "./pages/Reports";
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
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/estante/:estante" element={<ProtectedRoute><Shelf /></ProtectedRoute>} />
              <Route path="/prateleira/:estante/:prateleira" element={<ProtectedRoute><ShelfDetail /></ProtectedRoute>} />
              <Route path="/pesquisa" element={<ProtectedRoute><Search /></ProtectedRoute>} />
              <Route path="/produtos" element={<ProtectedRoute><Products /></ProtectedRoute>} />
              <Route path="/relatorios" element={<ProtectedRoute requiredRole="editor"><Reports /></ProtectedRoute>} />
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
