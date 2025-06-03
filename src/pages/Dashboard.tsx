import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Pilot, SearchFilters } from '../types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, UserPlus, UserX, Loader2, AlertCircle, Users, UserCheck, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    searchBy: 'fullname'
  });
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pilotToSuspend, setPilotToSuspend] = useState<string | null>(null);
  const [pilotToDelete, setPilotToDelete] = useState<string | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspending, setSuspending] = useState(false);
  const [flightHours, setFlightHours] = useState<number | undefined>(undefined);
  const [activePilotsCount, setActivePilotsCount] = useState<number>(0);
  const [suspendedPilotsCount, setSuspendedPilotsCount] = useState<number>(0);

  useEffect(() => {
    const fetchPilots = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('pilots')
          .select('*')
          .eq('suspended', false)
          .order('callsign', { ascending: true });
        
        if (error) {
          throw error;
        }

        setPilots(data || []);
      } catch (error) {
        console.error('Error fetching pilots:', error);
        toast.error("Errore durante il caricamento dei piloti");
      } finally {
        setLoading(false);
      }
    };

    fetchPilots();
  }, []);

  useEffect(() => {
    const fetchPilotCounts = async () => {
      try {
        // Fetch active pilots count
        const { count: activeCount, error: activeError } = await supabase
          .from('pilots')
          .select('*', { count: 'exact', head: true })
          .eq('suspended', false);

        if (activeError) {
          throw activeError;
        }

        // Fetch suspended pilots count
        const { count: suspendedCount, error: suspendedError } = await supabase
          .from('pilots')
          .select('*', { count: 'exact', head: true })
          .eq('suspended', true);

        if (suspendedError) {
          throw suspendedError;
        }

        setActivePilotsCount(activeCount || 0);
        setSuspendedPilotsCount(suspendedCount || 0);
      } catch (error) {
        console.error('Error fetching pilot counts:', error);
      }
    };

    fetchPilotCounts();
  }, [pilots]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchFilters(prev => ({ ...prev, query: e.target.value }));
  };

  const handleSearchByChange = (value: string) => {
    setSearchFilters(prev => ({ ...prev, searchBy: value as 'callsign' | 'fullname' }));
  };

  const filteredPilots = pilots.filter(pilot => {
    const query = searchFilters.query.toLowerCase();
    if (!query) return true;
    
    if (searchFilters.searchBy === 'callsign') {
      return pilot.callsign.toLowerCase().includes(query);
    } else {
      const fullName = `${pilot.name} ${pilot.surname}`.toLowerCase();
      return fullName.includes(query);
    }
  });

  const handleSuspendClick = (pilotId: string) => {
    setPilotToSuspend(pilotId);
    setSuspendDialogOpen(true);
  };

  const handleDeleteClick = (pilotId: string) => {
    setPilotToDelete(pilotId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (pilotToDelete) {
      try {
        const { error } = await supabase
          .from('pilots')
          .delete()
          .eq('id', pilotToDelete);
        
        if (error) {
          throw error;
        }

        // Update local state after successful deletion
        setPilots(pilots.filter(pilot => pilot.id !== pilotToDelete));
        toast.success("Pilota eliminato definitivamente");
      } catch (error) {
        console.error('Error deleting pilot:', error);
        toast.error("Errore durante l'eliminazione del pilota");
      } finally {
        setDeleteDialogOpen(false);
        setPilotToDelete(null);
      }
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

  const sendDiscordNotification = async (pilot: Pilot, type: 'suspension' | 'reactivation', reason?: string) => {
    try {
      console.log(`Sending Discord notification for pilot ${type}:`, pilot.callsign);
      
      const { error } = await supabase.functions.invoke('discord-notification', {
        body: {
          callsign: pilot.callsign,
          name: pilot.name,
          surname: pilot.surname,
          type: type,
          reason: reason
        }
      });

      if (error) {
        console.error('Discord notification error:', error);
        // Don't show error to user as this is not critical
      } else {
        console.log('Discord notification sent successfully');
      }
    } catch (error) {
      console.error('Failed to send Discord notification:', error);
      // Don't show error to user as this is not critical
    }
  };

  const handleReactivatePilot = async (pilotId: string) => {
    try {
      // Get pilot data before updating
      const { data: pilotData, error: fetchError } = await supabase
        .from('pilots')
        .select('*')
        .eq('id', pilotId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const { error } = await supabase
        .from('pilots')
        .update({ 
          suspended: false, 
          updated_at: new Date().toISOString(),
          suspension_reason: null,
          suspension_date: null 
        })
        .eq('id', pilotId);
      
      if (error) {
        throw error;
      }

      // Send reactivation notification
      if (pilotData) {
        sendDiscordNotification(pilotData, 'reactivation');
      }

      // Update local state after successful reactivation
      setPilots(pilots.filter(pilot => pilot.id !== pilotId));
      toast.success("Pilota riattivato con successo");
    } catch (error) {
      console.error('Error reactivating pilot:', error);
      toast.error("Errore durante la riattivazione del pilota");
    }
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
          suspension_date: suspensionDate,
          flight_hours: flightHours
        })
        .eq('id', pilotToSuspend);
      
      if (error) {
        throw error;
      }

      // Find the pilot data for notification
      const pilotData = pilots.find(p => p.id === pilotToSuspend);
      if (pilotData) {
        // Send suspension notification
        sendDiscordNotification(pilotData, 'suspension', suspensionReason);
      }

      // Update local state after successful suspension
      setPilots(pilots.filter(pilot => pilot.id !== pilotToSuspend));
      toast.success("Pilota sospeso con successo");
    } catch (err) {
      console.error('Error updating pilot status:', err);
      toast.error("Errore durante l'aggiornamento dello stato");
    } finally {
      setSuspending(false);
      setSuspendDialogOpen(false);
      setPilotToSuspend(null);
      setSuspensionReason('');
      setFlightHours(undefined);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold">Gestione Piloti</h1>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/suspended">
                <UserCheck className="mr-2 h-4 w-4" />
                Piloti Sospesi
              </Link>
            </Button>
            <Button asChild className="bg-accent hover:bg-accent/90">
              <Link to="/new-pilot">
                <UserPlus className="mr-2 h-4 w-4" />
                Nuovo Pilota
              </Link>
            </Button>
          </div>
        </div>

        {/* Pilot Counters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Piloti Attivi</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activePilotsCount}</div>
              <p className="text-xs text-muted-foreground">
                Piloti attualmente operativi
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Piloti Sospesi</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{suspendedPilotsCount}</div>
              <p className="text-xs text-muted-foreground">
                Piloti attualmente sospesi
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cerca Pilota</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cerca pilota..."
                  value={searchFilters.query}
                  onChange={handleSearchChange}
                  className="pl-9"
                />
              </div>
              <Select
                value={searchFilters.searchBy}
                onValueChange={handleSearchByChange}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Cerca per" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fullname">Nome e Cognome</SelectItem>
                  <SelectItem value="callsign">Callsign</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Lista Piloti</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Callsign</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cognome</TableHead>
                      <TableHead>Discord</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPilots.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                          Nessun pilota trovato
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPilots.map((pilot) => (
                        <TableRow key={pilot.id}>
                          <TableCell>{pilot.callsign}</TableCell>
                          <TableCell>{pilot.name}</TableCell>
                          <TableCell>{pilot.surname}</TableCell>
                          <TableCell>{pilot.discord || 'N/A'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="icon" asChild>
                                <Link to={`/pilot/${pilot.id}`} title="Dettagli">
                                  <Search className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="text-destructive hover:text-destructive hover:border-destructive"
                                onClick={() => handleSuspendClick(pilot.id as string)}
                                title="Sospendi"
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="text-destructive hover:text-destructive hover:border-destructive"
                                onClick={() => handleDeleteClick(pilot.id as string)}
                                title="Elimina definitivamente"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sospensione pilota</DialogTitle>
            <DialogDescription>
              Inserisci il motivo della sospensione del pilota e le ore di volo. Queste informazioni verranno registrate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="flight-hours">Ore di Volo</Label>
              <Input
                id="flight-hours"
                type="number"
                min="0"
                step="0.1"
                placeholder="Inserisci le ore di volo..."
                value={flightHours === undefined ? '' : flightHours}
                onChange={(e) => setFlightHours(parseFloat(e.target.value) || undefined)}
              />
            </div>
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
              setFlightHours(undefined);
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione definitiva</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare definitivamente questo pilota? Il callsign potrà essere riutilizzato, ma tutti i dati associati andranno persi. Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Elimina definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Dashboard;
