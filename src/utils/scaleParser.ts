/**
 * Utilitário para parsing de códigos de barras de balanças (Padrão Toledo/Filizola)
 * Formato padrão: 2-CCCCC-VVVVV-D (Preço Total)
 * Onde:
 * 2 = Prefixo (Indica produto pesável interno)
 * CCCCC = Código do Produto (PLU) - 5 dígitos (pode ser 4, dependendo da config)
 * VVVVV = Valor Total ou Peso - 5 dígitos
 * D = Dígito Verificador Geral
 */

export interface ParsedScaleBarcode {
    isValid: boolean;
    plu: string | null;
    value: number | null; // Valor total ou Peso
    type: 'price' | 'weight' | null;
    originalCode: string;
}

export const ScaleParser = {
    /**
     * Verifica se é um código de barras de balança (Começa com 2 e tem 13 dígitos)
     */
    isScaleBarcode(code: string): boolean {
        // Remove caracteres não numéricos
        const cleanCode = code.replace(/\D/g, '');
        return cleanCode.length === 13 && cleanCode.startsWith('2');
    },

    /**
     * Parseia o código de barras
     * @param code Código de 13 dígitos
     * @param valueType Define se os 5 dígitos de valor representam Preço ('price') ou Peso ('weight')
     *                  O padrão de mercado para checkout é 'price' (Valor Total).
     */
    parse(code: string, valueType: 'price' | 'weight' = 'price'): ParsedScaleBarcode {
        const cleanCode = code.replace(/\D/g, '');

        if (!this.isScaleBarcode(cleanCode)) {
            return { isValid: false, plu: null, value: null, type: null, originalCode: code };
        }

        // Padrão: 2 CCCCC VVVVV D
        // C = Código do item (PLU)
        // V = Valor (Preço total ou Peso)

        // Extração
        const prefix = cleanCode.substring(0, 1); // 2
        const pluRaw = cleanCode.substring(1, 6); // CCCCC
        const valueRaw = cleanCode.substring(6, 11); // VVVVV
        const checkDigit = cleanCode.substring(12, 13); // D

        // Processamento do PLU (Remove zeros à esquerda se necessário, mas mantém string para busca exata)
        // Em muitos sistemas, o PLU 5 pode vir como 00005.
        const plu = parseInt(pluRaw, 10).toString();

        // Processamento do Valor
        // O valor geralmente tem 2 casas decimais implícitas. (Ex: 01500 = 15.00)
        // Se for peso, geralmente 3 casas (Ex: 01500 = 1.500 kg) - DEPENDE DA CONFIG DA BALANÇA
        // Vamos assumir 2 casas para Preço e 3 para Peso como padrão.
        const divisor = valueType === 'price' ? 100 : 1000;
        const value = parseInt(valueRaw, 10) / divisor;

        return {
            isValid: true,
            plu,
            value,
            type: valueType,
            originalCode: cleanCode
        };
    }
};
