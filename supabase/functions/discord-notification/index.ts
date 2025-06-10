import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationData {
  callsign: string
  name: string
  surname: string
  type: 'suspension' | 'reactivation' | 'creation'
  reason?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    const { callsign, name, surname, type, reason }: NotificationData = await req.json()
    
    console.log(`Sending Discord notification for pilot ${type}:`, { callsign, name, surname })

    const webhookUrl = 'https://discord.com/api/webhooks/1382093166328680570/EH2xToAQ86lE-Tfu4c9Z7IiDr5yfeOHkzpZ_SO5ydDExzMmEjS6uLLYn5ITJUz_q0i1v'
    
    let discordMessage;

    switch (type) {
      case 'suspension':
        discordMessage = {
          embeds: [{
            title: "🚫 Pilota Sospeso",
            color: 0xff0000, // Red color
            fields: [
              {
                name: "Callsign",
                value: callsign,
                inline: true
              },
              {
                name: "Nome",
                value: `${name} ${surname}`,
                inline: true
              },
              {
                name: "Motivo",
                value: reason || "Nessun motivo specificato",
                inline: false
              }
            ],
            timestamp: new Date().toISOString(),
            footer: {
              text: "Sistema Gestione Piloti"
            }
          }]
        };
        break;

      case 'reactivation':
        discordMessage = {
          embeds: [{
            title: "✅ Pilota Riattivato",
            color: 0x00ff00, // Green color
            fields: [
              {
                name: "Callsign",
                value: callsign,
                inline: true
              },
              {
                name: "Nome",
                value: `${name} ${surname}`,
                inline: true
              }
            ],
            timestamp: new Date().toISOString(),
            footer: {
              text: "Sistema Gestione Piloti"
            }
          }]
        };
        break;

      case 'creation':
        discordMessage = {
          embeds: [{
            title: "🆕 Nuovo Pilota Aggiunto",
            color: 0x0099ff, // Blue color
            fields: [
              {
                name: "Callsign",
                value: callsign,
                inline: true
              },
              {
                name: "Nome",
                value: `${name} ${surname}`,
                inline: true
              }
            ],
            timestamp: new Date().toISOString(),
            footer: {
              text: "Sistema Gestione Piloti"
            }
          }]
        };
        break;

      default:
        throw new Error(`Invalid notification type: ${type}`);
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordMessage)
    })

    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.status}`)
    }

    console.log('Discord notification sent successfully')

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error sending Discord notification:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
