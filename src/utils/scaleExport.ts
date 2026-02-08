/**
 * Utilitário para exportação de dados para Balanças Toledo (Formato MGV 5/6)
 * Gera o arquivo ITENS.TXT
 */

import { Produto } from "@/integrations/supabase/service";

export const ScaleExport = {
    /**
     * Formata um número preenchendo com zeros à esquerda
     */
    padZero(num: number | string, size: number): string {
        let s = String(num);
        while (s.length < size) {
            s = "0" + s;
        }
        return s.substring(0, size);
    },

    /**
     * Formata texto preenchendo com espaços à direita (e remove acentos/especiais se necessário para compatibilidade)
     */
    padText(text: string, size: number): string {
        // Normalização básica para ASCII (remove acentos)
        const normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
        let s = normalized;
        while (s.length < size) {
            s = s + " ";
        }
        return s.substring(0, size);
    },

    /**
     * Gera o conteúdo do arquivo ITENS.TXT
     * Layout simplificado TIPO 1 (Toledo MGV):
     * 01-02: Depto (01)
     * 03-03: Tipo (0=Peso, 1=Unidade)
     * 04-09: Código (6 dígitos)
     * 10-15: Preço (6 dígitos, sem vírgula, centavos implícitos)
     * 16-18: Validade Dias (3 dígitos)
     * 19-33: Descrição 1 (15 chars) - ou mais dependendo da config, vamos usar 25 para garantir
     * ...
     * 
     * Vamos usar um layout genérico compatível com Importação de Texto MGV:
     * DEPT (2) | TIPO (1) | COD (6) | PRECO (6) | DIAS_VAL (3) | DESC (50)
     */
    generateToledoMGV(produtos: Produto[]): string {
        let content = "";

        produtos.forEach((prod: any) => {
            // Filtra apenas produtos de peso se necessário, mas o MGV aceita unidade também.
            // Geralmente queremos exportar tudo que vai pra balança.

            // 1. Depto: Sempre 01 (padronização básica)
            const dept = "01";

            // 2. Tipo: 
            // Balança Toledo: 0 = Peso (etiqueta de peso) / 1 = Unidade (etiqueta unitária)
            // Nosso sistema: 'peso' / 'unidade'
            const type = prod.tipo_venda === 'peso' ? "0" : "1";

            // 3. Código: 6 dígitos (PLU)
            // Se o código de barras for EAN-13, geralmente o MGV ignora e usa o PLU interno.
            // Vamos tentar usar os 6 últimos dígitos ou o próprio ID se for numérico curto.
            // Se codigo_barras for '200010...', o PLU é '00010' (digits 2-6)
            // Se não tiver padrão, usa id numérico se possível ou hash.
            // Simplificação: Pegar o código de barras, limpar zeros e pegar até 6 digitos.
            let plu = "000000";
            if (prod.codigo_barras) {
                // Tenta limpar e pegar
                const clean = prod.codigo_barras.replace(/\D/g, '');
                if (clean.length > 0) {
                    plu = this.padZero(clean.slice(-6), 6);
                }
            } else {
                // Fallback pro ID se for numérico (improvável no Supabase UUID)
                // Se usar UUID, não dá pra exportar pra balança que pede numérico.
                // O cliente precisa ter 'codigo_barras' numérico cadastrado.
                // Vamos gerar um sequencial fake só pra não quebrar se tiver vazio? Não, deixa 000000
            }

            // 4. Preço: 6 dígitos (0000,00)
            const priceVal = prod.tipo_venda === 'peso' ? (prod.preco_kg || 0) : (prod.preco_unidade || 0);
            const priceStr = this.padZero(Math.round(priceVal * 100), 6);

            // 5. Validade: 3 dígitos (dias)
            // Se não tiver, 000
            const days = "000";

            // 6. Descrição: 25 chars
            const desc = this.padText(prod.nome, 25);

            // Linha Formatada
            const line = `${dept}${type}${plu}${priceStr}${days}${desc}`;
            content += line + "\r\n";
        });

        return content;
    },

    /**
     * Trigger the download of the file
     */
    downloadFile(content: string, filename: string = "ITENS.TXT") {
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }
};
