
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plane } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      const success = login(password);
      if (success) {
        navigate('/dashboard');
      } else {
        toast.error("Password errata. Riprova.");
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-muted flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <Plane size={48} className="text-primary mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Aerosachs</h1>
          <p className="text-gray-600">Sistema di Gestione Piloti</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <Input 
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Inserisci la password di accesso"
              className="w-full"
              autoFocus
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? 'Accesso in corso...' : 'Accedi'}
          </Button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Accesso riservato allo staff Aerosachs
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
