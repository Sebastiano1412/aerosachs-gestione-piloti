
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Pilot } from '../types';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, User, Loader2, UserX, UserCheck, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PilotDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pilot, setPilot] = useState<Pilot>({
    callsign: "",
    name: "",
    surname: "",
    discord: "",
    old_flights: 0,
    suspended: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [suspending, setSuspending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Pilot>({
    callsign: "",
    name: "",
    surname: "",
    discord: "",
    old_flights: 0,
    suspended: false
  });
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');

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

  const handleSuspendClick = () => {
    setSuspendDialogOpen(true);
  };

  const confirmSuspend = async () => {
    setSuspending(true);
    try {
      const suspensionDate = new Date().toISOString();
      const { error } = await supabase
        .from('pilots')
        .update({
          suspended: true,
          updated_at: suspensionDate,
          suspension_reason: suspensionReason,
          suspension_date: suspensionDate
        })
        .eq('id', id);
      
      if (error) {
        throw error;
      }

      // Update the local state
      setPilot(prev => ({ 
        ...prev, 
        suspended: true,
        suspension_reason: suspensionReason,
        suspension_date: suspensionDate
      }));
      toast.success("Pilota sospeso con successo");
      
      // Redirect to suspended pilots page
      navigate('/suspended');
    } catch (err) {
      console.error('Error updating pilot status:', err);
      toast.error("Errore durante l'aggiornamento dello stato");
    } finally {
      setSuspending(false);
      setSuspendDialogOpen(false);
      setSuspensionReason('');
    }
  };

  const handleReactivate = async () => {
    setSuspending(true);
    try {
      const { error } = await supabase
        .from('pilots')
        .update({
          suspended: false,
          updated_at: new Date().toISOString(),
          suspension_reason: null,
          suspension_date: null
        })
        .eq('id', id);
      
      if (error) {
        throw error;
      }

      // Update the local state
      setPilot(prev => ({ 
        ...prev, 
        suspended: false,
        suspension_reason: undefined,
        suspension_date: undefined
      }));
      toast.success("Pilota riattivato con successo");
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Error updating pilot status:', err);
      toast.error("Errore durante l'aggiornamento dello stato");
    } finally {
      setSuspending(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm");
    } catch (error) {
      return "Data non valida";
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
            onClick={() => navigate(pilot.suspended ? '/suspended' : '/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Dettagli Pilota</h1>
          {pilot.suspended && (
            <Badge variant="destructive" className="ml-2">Sospeso</Badge>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <User className="h-6 w-6" />
                <span>{!isEditing ? `${pilot.name} ${pilot.surname} (${pilot.callsign})` : 'Modifica Pilota'}</span>
              </CardTitle>
              <div className="flex gap-2">
                {!isEditing && (
                  <>
                    <Button 
                      variant={pilot.suspended ? "default" : "destructive"}
                      className="gap-2"
                      onClick={pilot.suspended ? handleReactivate : handleSuspendClick}
                      disabled={suspending}
                    >
                      {suspending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : pilot.suspended ? (
                        <UserCheck className="h-4 w-4" />
                      ) : (
                        <UserX className="h-4 w-4" />
                      )}
                      {pilot.suspended ? "Riattiva" : "Sospendi"}
                    </Button>
                    <Button onClick={() => setIsEditing(true)}>
                      Modifica
                    </Button>
                  </>
                )}
              </div>
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
                {pilot.suspended && (
                  <>
                    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-sm font-medium text-gray-500">Data Sospensione</dt>
                      <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0 flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        {formatDate(pilot.suspension_date)}
                      </dd>
                    </div>
                    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-sm font-medium text-gray-500">Motivo Sospensione</dt>
                      <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                        <div className="flex items-start">
                          <AlertCircle className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                          <span className="whitespace-pre-wrap">{pilot.suspension_reason || "Nessun motivo specificato"}</span>
                        </div>
                      </dd>
                    </div>
                  </>
                )}
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

      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sospensione pilota</DialogTitle>
            <DialogDescription>
              Inserisci il motivo della sospensione del pilota. Questa informazione verrà registrata.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="suspension-reason">Motivo della sospensione</Label>
              <Textarea
                id="suspension-reason"
                placeholder="Inserisci il motivo della sospensione..."
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSuspendDialogOpen(false);
              setSuspensionReason('');
            }}>
              Annulla
            </Button>
            <Button 
              onClick={confirmSuspend} 
              className="bg-destructive text-destructive-foreground"
              disabled={!suspensionReason.trim()}
            >
              Sospendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default PilotDetail;
