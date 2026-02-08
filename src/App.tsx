import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { supabase } from "@/integrations/supabase/client";

import PDV from "./pages/PDV";
import Dashboard from "./pages/Dashboard";
import Estoque from "./pages/Estoque";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import GerarImagem from "./pages/GerarImagem";
import Precificacao from "./pages/Precificacao";
import VitrineAdmin from "./pages/VitrineAdmin";
import VitrineLoja from "./pages/VitrineLoja";
import ReceitasAdmin from "./pages/ReceitasAdmin";

import MainLayout from "./components/MainLayout";
import { AgentChat } from "./components/AgentChat";

const queryClient = new QueryClient();

// Componente para proteger rotas autenticadas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    };
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  if (isAuthenticated === null) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />

              {/* Rotas com Sidebar */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/estoque" element={<ProtectedRoute><Estoque /></ProtectedRoute>} />
                <Route path="/pdv" element={<ProtectedRoute><PDV /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/gerar-imagem" element={<ProtectedRoute><GerarImagem /></ProtectedRoute>} />
                <Route path="/precificacao" element={<ProtectedRoute><Precificacao /></ProtectedRoute>} />
                <Route path="/vitrine-admin" element={<ProtectedRoute><VitrineAdmin /></ProtectedRoute>} />
                <Route path="/vitrine" element={<ProtectedRoute><VitrineLoja /></ProtectedRoute>} />
                <Route path="/receitas-admin" element={<ProtectedRoute><ReceitasAdmin /></ProtectedRoute>} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
            {/* Agente IA - Chat Flutuante */}
            <AgentChat />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
