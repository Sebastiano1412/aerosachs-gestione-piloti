import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Pilot, SearchFilters } from '../types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, UserPlus, Edit, Trash2, Loader2, UserX } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const Dashboard = () => {
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    searchBy: 'fullname'
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pilotToDelete, setPilotToDelete] = useState<string | null>(null);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [pilotToSuspend, setPilotToSuspend] = useState<string | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');

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
        toast.success("Pilota eliminato con successo");
      } catch (error) {
        console.error('Error deleting pilot:', error);
        toast.error("Errore durante l'eliminazione del pilota");
      } finally {
        setDeleteDialogOpen(false);
        setPilotToDelete(null);
      }
    }
  };

  const handleSuspendClick = (pilotId: string) => {
    setPilotToSuspend(pilotId);
    setSuspendDialogOpen(true);
  };

  const confirmSuspend = async () => {
    if (pilotToSuspend) {
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
          .eq('id', pilotToSuspend);
        
        if (error) {
          throw error;
        }

        // Update local state after successful suspension
        setPilots(pilots.filter(pilot => pilot.id !== pilotToSuspend));
        toast.success("Pilota sospeso con successo");
      } catch (error) {
        console.error('Error suspending pilot:', error);
        toast.error("Errore durante la sospensione del pilota");
      } finally {
        setSuspendDialogOpen(false);
        setPilotToSuspend(null);
        setSuspensionReason('');
      }
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
                <UserX className="mr-2 h-4 w-4" />
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

        <Card>
          <CardHeader>
            <CardTitle>Cerca Piloti</CardTitle>
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
          <CardHeader>
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
                      <TableHead className="hidden md:table-cell">Username Discord</TableHead>
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
                          <TableCell className="hidden md:table-cell">{pilot.discord}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="text-destructive hover:text-destructive hover:border-destructive"
                                onClick={() => handleSuspendClick(pilot.id as string)}
                                title="Sospendi"
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="icon" asChild>
                                <Link to={`/pilot/${pilot.id}`} title="Modifica">
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="text-destructive hover:text-destructive hover:border-destructive"
                                onClick={() => handleDeleteClick(pilot.id as string)}
                                title="Elimina"
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
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questo pilota? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

export default Dashboard;
