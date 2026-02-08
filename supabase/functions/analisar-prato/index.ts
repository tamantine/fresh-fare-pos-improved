// Edge Function: Analisar Prato com IA
// Deploy: npx supabase functions deploy analisar-prato --no-verify-jwt

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { imagem } = await req.json();

        if (!imagem) {
            return new Response(
                JSON.stringify({ error: 'Imagem não fornecida' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Chamar OpenRouter API (mesma key da vitrineapi)
        const apiKey = Deno.env.get('vitrineapi');
        if (!apiKey) {
            throw new Error('API key não configurada');
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://hortifruti-app.vercel.app',
                'X-Title': 'NutriCam Hortifruti',
            },
            body: JSON.stringify({
                model: 'arcee-ai/trinity-large-preview:free',
                messages: [
                    {
                        role: 'system',
                        content: `Você é um nutricionista especialista. Analise a imagem do prato e retorne APENAS um JSON válido com esta estrutura:
{
    "calorias": número estimado de calorias,
    "proteinas": gramas de proteína,
    "carboidratos": gramas de carboidratos,
    "gorduras": gramas de gorduras,
    "ingredientes": ["lista", "de", "ingredientes", "identificados"]
}
Seja preciso mas não exagere. Se não conseguir identificar, faça uma estimativa razoável para um prato típico.`
                    },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: 'Analise este prato e me dê as informações nutricionais em JSON:'
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/jpeg;base64,${imagem}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 500,
                temperature: 0.3,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter error:', errorText);
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        // Extrair JSON da resposta
        let resultado;
        try {
            // Tentar encontrar JSON na resposta
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                resultado = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('JSON não encontrado');
            }
        } catch {
            // Fallback com valores padrão
            resultado = {
                calorias: 350,
                proteinas: 25,
                carboidratos: 40,
                gorduras: 10,
                ingredientes: ['Proteína', 'Vegetais', 'Grãos'],
            };
        }

        return new Response(
            JSON.stringify(resultado),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('Erro na análise:', error);
        return new Response(
            JSON.stringify({
                error: 'Erro ao analisar prato',
                calorias: 400,
                proteinas: 28,
                carboidratos: 42,
                gorduras: 12,
                ingredientes: ['Prato variado'],
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});
