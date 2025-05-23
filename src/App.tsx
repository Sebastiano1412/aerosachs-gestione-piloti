
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PilotDetail from "./pages/PilotDetail";
import NewPilot from "./pages/NewPilot";
import NotFound from "./pages/NotFound";
import SuspendedPilots from "./pages/SuspendedPilots";
import Index from "./pages/Index";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/pilot/:id"
              element={
                <ProtectedRoute>
                  <PilotDetail />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/new-pilot"
              element={
                <ProtectedRoute>
                  <NewPilot />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/suspended"
              element={
                <ProtectedRoute>
                  <SuspendedPilots />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
