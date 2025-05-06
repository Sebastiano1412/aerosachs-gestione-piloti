
import React from 'react';
import { Plane } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-white shadow-md py-4">
        <div className="container mx-auto flex justify-between items-center px-4">
          <div className="flex items-center space-x-3">
            <Plane size={28} />
            <h1 className="text-xl md:text-2xl font-semibold">Aerosachs Gestione Piloti</h1>
          </div>
          <Button 
            variant="outline" 
            className="border-white text-black hover:bg-white hover:text-primary"
            onClick={logout}
          >
            Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-6 px-4">
        {children}
      </main>

      <footer className="bg-muted py-4 border-t border-gray-200">
        <div className="container mx-auto text-center text-sm text-gray-600">
          &copy; {new Date().getFullYear()} Aerosachs Virtual Airline - Tutti i diritti riservati
        </div>
      </footer>
    </div>
  );
};

export default Layout;
