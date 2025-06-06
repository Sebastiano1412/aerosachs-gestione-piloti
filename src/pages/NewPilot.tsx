import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

const NewPilot = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    callsign: '',
    name: '',
    surname: '',
    discord: '',
    old_flights: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingCallsigns, setExistingCallsigns] = useState<string[]>([]);

  // Fetch existing active callsigns for validation
  useEffect(() => {
    const fetchCallsigns = async () => {
      try {
        const { data, error } = await supabase
          .from('pilots')
          .select('callsign')
          .eq('suspended', false);
        
        if (error) {
          throw error;
        }

        if (data) {
          setExistingCallsigns(data.map(pilot => pilot.callsign));
        }
      } catch (err) {
        console.error('Error fetching callsigns:', err);
        toast.error("Errore durante il caricamento dei callsign");
      }
    };

    fetchCallsigns();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // For callsign, convert to uppercase
    if (name === 'callsign') {
      setFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'old_flights' ? parseInt(value) || 0 : value
      }));
    }
    
    // Clear the error for this field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.callsign) {
      newErrors.callsign = "Il callsign è obbligatorio";
    } else if (!formData.callsign.match(/^ASX[0-9]{3}$/)) {
      newErrors.callsign = "Il callsign deve essere nel formato ASX seguito da 3 numeri (es. ASX001)";
    } else if (existingCallsigns.includes(formData.callsign)) {
      newErrors.callsign = "Questo callsign è già in uso";
    }
    
    if (!formData.name) {
      newErrors.name = "Il nome è obbligatorio";
    }
    
    if (!formData.surname) {
      newErrors.surname = "Il cognome è obbligatorio";
    }
    
    if (formData.old_flights < 0) {
      newErrors.old_flights = "Il numero di voli non può essere negativo";
    }
    
    // Removed discord validation as it's now optional
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendDiscordNotification = async (pilot: any, type: 'creation' | 'reactivation') => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Check if there's an existing suspended pilot with the same callsign
      const { data: existingSuspended, error: checkError } = await supabase
        .from('pilots')
        .select('id')
        .eq('callsign', formData.callsign)
        .eq('suspended', true);

      if (checkError) {
        throw checkError;
      }
      
      // If callsign exists but is suspended, update it instead of inserting new
      if (existingSuspended && existingSuspended.length > 0) {
        const { error: updateError } = await supabase
          .from('pilots')
          .update({
            name: formData.name,
            surname: formData.surname,
            discord: formData.discord || null,
            old_flights: formData.old_flights,
            suspended: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSuspended[0].id);
          
        if (updateError) {
          throw updateError;
        }
        
        // Send reactivation notification
        sendDiscordNotification(formData, 'reactivation');
        
        toast.success("Pilota riattivato con successo");
      } else {
        // Insert new pilot
        const { error: insertError } = await supabase
          .from('pilots')
          .insert([{
            callsign: formData.callsign,
            name: formData.name,
            surname: formData.surname,
            discord: formData.discord || null,
            old_flights: formData.old_flights,
            suspended: false
          }]);
          
        if (insertError) {
          throw insertError;
        }
        
        // Send creation notification
        sendDiscordNotification(formData, 'creation');
        
        toast.success("Nuovo pilota aggiunto con successo");
      }
      
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error creating pilot:', err);
      
      if (err.code === '23505') {
        // Unique violation error (likely callsign duplicate)
        setErrors(prev => ({
          ...prev,
          callsign: "Questo callsign è già in uso"
        }));
        toast.error("Errore: Callsign duplicato");
      } else {
        toast.error(`Errore durante il salvataggio: ${err.message || 'Sconosciuto'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="text-3xl font-bold">Aggiungi Nuovo Pilota</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informazioni Pilota</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="callsign">
                    Callsign
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input
                    id="callsign"
                    name="callsign"
                    value={formData.callsign}
                    onChange={handleInputChange}
                    className={errors.callsign ? "border-destructive" : ""}
                    placeholder="es. ASX004"
                    required
                  />
                  {errors.callsign && (
                    <p className="text-sm text-destructive">{errors.callsign}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nome
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={errors.name ? "border-destructive" : ""}
                    required
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surname">
                    Cognome
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input
                    id="surname"
                    name="surname"
                    value={formData.surname}
                    onChange={handleInputChange}
                    className={errors.surname ? "border-destructive" : ""}
                    required
                  />
                  {errors.surname && (
                    <p className="text-sm text-destructive">{errors.surname}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discord">
                    Username Discord
                    {/* Removed required asterisk */}
                  </Label>
                  <Input
                    id="discord"
                    name="discord"
                    value={formData.discord}
                    onChange={handleInputChange}
                    className={errors.discord ? "border-destructive" : ""}
                    placeholder="es. username#1234"
                    // Removed required attribute
                  />
                  {errors.discord && (
                    <p className="text-sm text-destructive">{errors.discord}</p>
                  )}
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
                    className={errors.old_flights ? "border-destructive" : ""}
                  />
                  {errors.old_flights && (
                    <p className="text-sm text-destructive">{errors.old_flights}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  asChild
                >
                  <Link to="/dashboard">Annulla</Link>
                </Button>
                <Button type="submit" className="gap-2" disabled={isSubmitting}>
                  {isSubmitting ? (
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
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default NewPilot;
