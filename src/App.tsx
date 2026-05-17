import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HeroScreen from "./pages/HeroScreen";
import AgendarScreen from "./pages/AgendarScreen";
import CadastroScreen from "./pages/CadastroScreen";
import SolicitacaoEnviadaScreen from "./pages/SolicitacaoEnviadaScreen";
import NotFound from "./pages/NotFound";
import AdminCalendarScreen from "./pages/AdminCalendarScreen";
import AdminLoginScreen from "./pages/AdminLoginScreen";
import AdminDashboard from "./pages/AdminDashboard";
import RiderLoginScreen from "./pages/RiderLoginScreen";
import RiderDashboard from "./pages/RiderDashboard";

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
          <Route path="/solicitacao-enviada" element={<SolicitacaoEnviadaScreen />} />
          <Route path="/admin/calendar" element={<AdminCalendarScreen />} />
          <Route path="/admin/login" element={<AdminLoginScreen />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/rider/login" element={<RiderLoginScreen />} />
          <Route path="/rider/dashboard" element={<RiderDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
