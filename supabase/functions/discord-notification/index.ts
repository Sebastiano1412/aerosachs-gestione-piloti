
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SuspensionData {
  callsign: string
  name: string
  surname: string
  reason: string
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
    const { callsign, name, surname, reason }: SuspensionData = await req.json()
    
    console.log('Sending Discord notification for pilot suspension:', { callsign, name, surname })

    const webhookUrl = 'https://discord.com/api/webhooks/939879808274403338/oPKZHqM0L8RFfTQ1aOOWPnQvL-tpWcBrkvnSNWpBRk-hNhqagHKdBK52hcS0iQi0xzFN'
    
    const discordMessage = {
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
            value: reason,
            inline: false
          }
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: "Sistema Gestione Piloti"
        }
      }]
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
