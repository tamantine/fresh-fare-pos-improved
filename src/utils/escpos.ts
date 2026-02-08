// Comandos ESC/POS Básicos
export const ESC = {
    INIT: [0x1B, 0x40], // Inicializa impressora
    ALIGN_LEFT: [0x1B, 0x61, 0x00],
    ALIGN_CENTER: [0x1B, 0x61, 0x01],
    ALIGN_RIGHT: [0x1B, 0x61, 0x02],
    BOLD_ON: [0x1B, 0x45, 0x01],
    BOLD_OFF: [0x1B, 0x45, 0x00],
    CUT: [0x1D, 0x56, 0x41, 0x10], // Corta papel (feeder)
    TEXT_NORMAL: [0x1B, 0x21, 0x00],
    TEXT_DOUBLE_HEIGHT: [0x1B, 0x21, 0x10],
    TEXT_DOUBLE_WIDTH: [0x1B, 0x21, 0x20],
};

/**
 * Converte string para Uint8Array usando encoder compatível (ex: CP860 ou ASCII básico).
 * Para simplificar, vamos usar ASCII/UTF-8 básico e remover acentos se necessário,
 * ou enviar bytes diretos se a impressora suportar Page Code 850/860.
 * A maioria das impressoras térmicas suporta ISO-8859-1 ou PC850.
 */
export const encodeText = (text: string): Uint8Array => {
    // Simples conversão para evitar problemas de encoding imediatos
    // Idealmente, usaríamos uma lib como 'iconv-lite' se precisássemos de Codepage 850
    // Aqui vamos normalizar para ASCII "seguro" removendo acentos críticos se der problema,
    // mas vamos tentar envio direto primeiro.
    const encoder = new TextEncoder();
    return encoder.encode(text);
};

export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};
