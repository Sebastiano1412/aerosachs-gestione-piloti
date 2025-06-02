
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Loader2, Users, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  const { isAuthenticated } = useAuth();
  const [activePilotsCount, setActivePilotsCount] = useState<number | null>(null);
  const [suspendedPilotsCount, setSuspendedPilotsCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPilotCounts = async () => {
      try {
        setLoading(true);
        
        // Get count of active pilots (suspended = false)
        const { count: activeCount, error: activeError } = await supabase
          .from('pilots')
          .select('*', { count: 'exact', head: true })
          .eq('suspended', false);
        
        if (activeError) {
          throw activeError;
        }

        // Get count of suspended pilots (suspended = true)
        const { count: suspendedCount, error: suspendedError } = await supabase
          .from('pilots')
          .select('*', { count: 'exact', head: true })
          .eq('suspended', true);
        
        if (suspendedError) {
          throw suspendedError;
        }

        setActivePilotsCount(activeCount);
        setSuspendedPilotsCount(suspendedCount);
      } catch (error) {
        console.error('Error fetching pilots count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPilotCounts();
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex gap-2">
            <Button asChild className="bg-accent hover:bg-accent/90">
              <Link to="/dashboard">
                <Users className="mr-2 h-4 w-4" />
                Gestione Piloti
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Piloti Attivi</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" />
                  <span>Caricamento...</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <Users className="h-10 w-10 text-green-600 mr-3" />
                  <div className="text-3xl font-bold">{activePilotsCount}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Piloti Sospesi</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" />
                  <span>Caricamento...</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <UserX className="h-10 w-10 text-red-600 mr-3" />
                  <div className="text-3xl font-bold">{suspendedPilotsCount}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
