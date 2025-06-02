import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Pilot, SearchFilters } from '../types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, UserPlus, Trash2, Loader2, ArrowLeft, UserCheck, Clock, AlignLeft, Gauge } from 'lucide-react';
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
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const SuspendedPilots = () => {
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    searchBy: 'fullname'
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pilotToDelete, setPilotToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchPilots = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('pilots')
          .select('*')
          .eq('suspended', true)
          .order('callsign', { ascending: true });
        
        if (error) {
          throw error;
        }

        setPilots(data || []);
      } catch (error) {
        console.error('Error fetching suspended pilots:', error);
        toast.error("Errore durante il caricamento dei piloti sospesi");
      } finally {
        setLoading(false);
      }
    };

    fetchPilots();
  }, []);

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

  const sendDiscordNotification = async (pilot: Pilot, type: 'reactivation') => {
    try {
      console.log(`Sending Discord notification for pilot ${type}:`, pilot.callsign);
      
      const { error } = await supabase.functions.invoke('discord-notification', {
        body: {
          callsign: pilot.callsign,
          name: pilot.name,
          surname: pilot.surname,
          type: type
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
      const pilotData = pilots.find(p => p.id === pilotId);

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm");
    } catch (error) {
      return "Data non valida";
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              asChild
            >
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Piloti Sospesi</h1>
          </div>
          <Button asChild className="bg-accent hover:bg-accent/90">
            <Link to="/new-pilot">
              <UserPlus className="mr-2 h-4 w-4" />
              Nuovo Pilota
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cerca Piloti Sospesi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cerca pilota sospeso..."
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
            <CardTitle>Lista Piloti Sospesi</CardTitle>
            <Badge variant="destructive" className="text-xs">
              {pilots.length} sospesi
            </Badge>
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
                      <TableHead className="hidden md:table-cell">Data Sospensione</TableHead>
                      <TableHead className="hidden md:table-cell">Ore di Volo</TableHead>
                      <TableHead className="hidden md:table-cell">Motivo</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPilots.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                          Nessun pilota sospeso trovato
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPilots.map((pilot) => (
                        <TableRow key={pilot.id}>
                          <TableCell>{pilot.callsign}</TableCell>
                          <TableCell>{pilot.name}</TableCell>
                          <TableCell>{pilot.surname}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center">
                              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                              {formatDate(pilot.suspension_date)}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center">
                              <Gauge className="mr-2 h-4 w-4 text-muted-foreground" />
                              {pilot.flight_hours !== undefined ? `${pilot.flight_hours}` : 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center cursor-help">
                                    <AlignLeft className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span className="truncate max-w-[150px]">
                                      {pilot.suspension_reason || "Nessun motivo specificato"}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>{pilot.suspension_reason || "Nessun motivo specificato"}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="text-primary hover:text-primary hover:border-primary"
                                onClick={() => handleReactivatePilot(pilot.id as string)}
                                title="Riattiva"
                              >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="icon" asChild>
                                <Link to={`/pilot/${pilot.id}`} title="Dettagli">
                                  <Search className="h-4 w-4" />
                                </Link>
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

export default SuspendedPilots;
