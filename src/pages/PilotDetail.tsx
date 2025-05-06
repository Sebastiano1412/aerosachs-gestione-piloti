
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Pilot } from '../types';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

const PilotDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pilot, setPilot] = useState<Pilot>({
    callsign: "",
    name: "",
    surname: "",
    discord: "",
    old_flights: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Pilot>({
    callsign: "",
    name: "",
    surname: "",
    discord: "",
    old_flights: 0
  });

  useEffect(() => {
    const fetchPilot = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('pilots')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          throw error;
        }

        if (data) {
          setPilot(data);
          setFormData(data);
        } else {
          setError("Pilota non trovato");
        }
      } catch (err) {
        console.error('Error fetching pilot:', err);
        setError("Errore durante il caricamento dei dati");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPilot();
    }
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'old_flights' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('pilots')
        .update({
          callsign: formData.callsign,
          name: formData.name,
          surname: formData.surname,
          discord: formData.discord,
          old_flights: formData.old_flights,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) {
        throw error;
      }

      // Update the local state
      setPilot(formData);
      setIsEditing(false);
      toast.success("Dati del pilota aggiornati con successo");
    } catch (err) {
      console.error('Error updating pilot:', err);
      toast.error("Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-destructive">{error}</p>
          <Button asChild>
            <Link to="/dashboard">Torna alla dashboard</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Dettagli Pilota</h1>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <User className="h-6 w-6" />
                <span>{!isEditing ? `${pilot.name} ${pilot.surname} (${pilot.callsign})` : 'Modifica Pilota'}</span>
              </CardTitle>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)}>
                  Modifica
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!isEditing ? (
              <dl className="divide-y divide-gray-200">
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Callsign</dt>
                  <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">{pilot.callsign}</dd>
                </div>
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Nome</dt>
                  <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">{pilot.name}</dd>
                </div>
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Cognome</dt>
                  <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">{pilot.surname}</dd>
                </div>
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Username Discord</dt>
                  <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">{pilot.discord}</dd>
                </div>
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Voli Totali Vecchi VMS</dt>
                  <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">{pilot.old_flights}</dd>
                </div>
              </dl>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="callsign">Callsign</Label>
                    <Input
                      id="callsign"
                      name="callsign"
                      value={formData.callsign}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="surname">Cognome</Label>
                    <Input
                      id="surname"
                      name="surname"
                      value={formData.surname}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discord">Username Discord</Label>
                    <Input
                      id="discord"
                      name="discord"
                      value={formData.discord}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="old_flights">Voli Totali Vecchi VMS</Label>
                    <Input
                      id="old_flights"
                      name="old_flights"
                      type="number"
                      min="0"
                      value={formData.old_flights}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(pilot);
                    }}
                    disabled={saving}
                  >
                    Annulla
                  </Button>
                  <Button type="submit" className="gap-2" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Salvataggio...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Salva
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PilotDetail;
