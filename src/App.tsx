import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HeroScreen from "./pages/HeroScreen";
import AgendarScreen from "./pages/AgendarScreen";
import CadastroScreen from "./pages/CadastroScreen";
import PagamentoScreen from "./pages/PagamentoScreen";
import NotFound from "./pages/NotFound";
import AdminCalendarScreen from "./pages/AdminCalendarScreen";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HeroScreen />} />
          <Route path="/agendar" element={<AgendarScreen />} />
          <Route path="/cadastro" element={<CadastroScreen />} />
          <Route path="/pagamento" element={<PagamentoScreen />} />
          <Route path="/admin/calendar" element={<AdminCalendarScreen />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
