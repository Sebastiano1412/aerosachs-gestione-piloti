
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pilot, SearchFilters } from '../types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, UserPlus, Edit, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';
import { toast } from 'sonner';
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

// Mock data - will be replaced by Supabase data
const initialPilots: Pilot[] = [
  { id: "1", callsign: "ASX001", name: "Marco", surname: "Rossi", discord: "marco_rossi#1234", old_flights: 42 },
  { id: "2", callsign: "ASX002", name: "Laura", surname: "Bianchi", discord: "laura_b#5678", old_flights: 28 },
  { id: "3", callsign: "ASX003", name: "Antonio", surname: "Verdi", discord: "a_verdi#9012", old_flights: 56 }
];

const Dashboard = () => {
  const [pilots, setPilots] = useState<Pilot[]>(initialPilots);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    searchBy: 'fullname'
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pilotToDelete, setPilotToDelete] = useState<string | null>(null);

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

  const confirmDelete = () => {
    if (pilotToDelete) {
      // Filter out the pilot to delete
      setPilots(pilots.filter(pilot => pilot.id !== pilotToDelete));
      toast.success("Pilota eliminato con successo");
      setDeleteDialogOpen(false);
      setPilotToDelete(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold">Gestione Piloti</h1>
          <Button asChild className="bg-accent hover:bg-accent/90">
            <Link to="/new-pilot">
              <UserPlus className="mr-2 h-4 w-4" />
              Nuovo Pilota
            </Link>
          </Button>
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
                            <Button variant="outline" size="icon" asChild>
                              <Link to={`/pilot/${pilot.id}`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="text-destructive hover:text-destructive hover:border-destructive"
                              onClick={() => handleDeleteClick(pilot.id as string)}
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
    </Layout>
  );
};

export default Dashboard;
