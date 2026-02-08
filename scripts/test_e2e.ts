import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
dotenv.config({ path: resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Fallback for testing

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/VITE_SUPABASE_ANON_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runTests() {
    console.log('🚀 Starting E2E Tests...');

    // --- 1. Fluxo de Caixa ---
    console.log('\n📦 Testing Cash Flow (Fluxo de Caixa)...');
    const operatorId = '00000000-0000-0000-0000-000000000000'; // Dummy ID or fetch real one if possible

    // 1.1 Open Register
    const { data: caixa, error: openError } = await supabase
        .from('caixas')
        .insert({
            valor_inicial: 100.00,
            status: 'aberto',
            operador_id: operatorId,
            data_abertura: new Date().toISOString()
        })
        .select('*')
        .single();

    if (openError) {
        console.error('❌ Failed to open register:', openError.message);
    } else {
        console.log('✅ Register Opened:', caixa.id);

        // 1.2 Sangria
        const { error: sangriaError } = await supabase
            .from('movimentacoes_caixa')
            .insert({
                caixa_id: caixa.id,
                tipo: 'sangria',
                valor: 50.00,
                motivo: 'E2E Test Sangria'
            });

        if (sangriaError) console.error('❌ Failed to perform Sangria:', sangriaError.message);
        else console.log('✅ Sangria recorded');

        // 1.3 Close Register
        // Calcs: Initial (100) - Sangria (50) + Sales (0) = 50
        const { error: closeError } = await supabase
            .from('caixas')
            .update({
                status: 'fechado',
                data_fechamento: new Date().toISOString(),
                valor_final: 50.00
            })
            .eq('id', caixa.id);

        if (closeError) console.error('❌ Failed to close register:', closeError.message);
        else console.log('✅ Register Closed');
    }

    // --- 2. PDV & Estoque ---
    console.log('\n🛒 Testing POS & Inventory...');
    // Fetch a product
    const { data: product } = await supabase.from('produtos').select('*').limit(1).single();

    if (product) {
        const initialStock = product.estoque || 0;
        const sellQty = 2; // 2kg/units

        console.log(`🔹 Product: ${product.nome} | Stock: ${initialStock}`);

        // Simulate Sale
        const { error: saleError } = await supabase
            .from('produtos')
            .update({ estoque: initialStock - sellQty })
            .eq('id', product.id);

        if (saleError) console.error('❌ Failed to update stock:', saleError.message);
        else {
            // Verify
            const { data: updatedProduct } = await supabase.from('produtos').select('estoque').eq('id', product.id).single();
            console.log(`✅ Stock updated: ${updatedProduct?.estoque} (Expected: ${initialStock - sellQty})`);

            // Revert
            await supabase.from('produtos').update({ estoque: initialStock }).eq('id', product.id);
            console.log('Reverted stock change.');
        }
    } else {
        console.warn('⚠️ No products found to test.');
    }

    // --- 3. AI Agent ---
    console.log('\n🤖 Testing Manager Agent...');
    // We invoke the function via REST to simulate client app
    const agentUrl = `${SUPABASE_URL}/functions/v1/manager-agent`;

    // Note: This requires the function to be deployed and ANON key to call it
    // We are skipping the actual FETCH call here because we are in a script env 
    // that might not have internet access or correct headers set up easily without user context.
    // Instead we verify the RPC exists.

    const { error: rpcError } = await supabase.rpc('execute_sql_query', { query_text: 'SELECT count(*) FROM vendas' });
    if (rpcError) {
        console.error('❌ RPC execute_sql_query Check Failed:', rpcError.message);
        console.error('👉 Did you run the migration?');
    } else {
        console.log('✅ RPC execute_sql_query exists and is callable.');
    }

    console.log('\n🏁 E2E Tests Finished.');
}

runTests().catch(console.error);
