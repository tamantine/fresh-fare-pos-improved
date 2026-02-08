/**
 * Utilitário para integração com impressoras térmicas via Web USB (ESC/POS)
 */

export class ImpressoraService {
  private device: USBDevice | null = null;

  /**
   * Solicita permissão e conecta à impressora USB
   */
  async conectar(): Promise<boolean> {
    try {
      if (!('usb' in navigator)) {
        throw new Error('Web USB API não suportada neste navegador.');
      }

      // Solicitar dispositivo USB (Impressora)
      this.device = await navigator.usb.requestDevice({
        filters: [{ classCode: 7 }] // Classe 7 é para impressoras
      });

      await this.device.open();
      await this.device.selectConfiguration(1);
      await this.device.claimInterface(0);
      
      return true;
    } catch (error) {
      console.error('Erro ao conectar à impressora:', error);
      return false;
    }
  }

  /**
   * Envia comandos ESC/POS para a impressora
   */
  async imprimirCupom(venda: any, itens: any[]) {
    if (!this.device) {
      const conectado = await this.conectar();
      if (!conectado) return;
    }

    const encoder = new TextEncoder();
    
    // Comandos ESC/POS básicos
    const ESC = '\x1b';
    const GS = '\x1d';
    const RESET = ESC + '@';
    const CENTER = ESC + 'a' + '\x01';
    const LEFT = ESC + 'a' + '\x00';
    const BOLD_ON = ESC + 'E' + '\x01';
    const BOLD_OFF = ESC + 'E' + '\x00';
    const DOUBLE_SIZE = GS + '!' + '\x11';
    const NORMAL_SIZE = GS + '!' + '\x00';

    let texto = RESET;
    texto += CENTER + BOLD_ON + DOUBLE_SIZE + 'HORTIFRUTI BOM PRECO\n' + NORMAL_SIZE + BOLD_OFF;
    texto += 'Rua do Comercio, 123 - Centro\n';
    texto += 'Tel: (11) 99999-9999\n';
    texto += '--------------------------------\n';
    texto += LEFT + BOLD_ON + 'CUPOM NAO FISCAL\n' + BOLD_OFF;
    texto += `Data: ${new Date().toLocaleString('pt-BR')}\n`;
    texto += `Venda: #${venda.numero_venda || '001'}\n`;
    texto += '--------------------------------\n';
    texto += 'ITEM   QTD   UN   PRECO   TOTAL\n';

    itens.forEach((item, index) => {
      const nome = item.nome.substring(0, 15).padEnd(15);
      const qtd = item.quantidade.toString().padStart(4);
      const preco = item.preco_unitario.toFixed(2).padStart(6);
      const total = (item.quantidade * item.preco_unitario).toFixed(2).padStart(7);
      texto += `${index + 1} ${nome}\n`;
      texto += `      ${qtd} x ${preco} = ${total}\n`;
    });

    texto += '--------------------------------\n';
    texto += BOLD_ON + `TOTAL: R$ ${venda.total.toFixed(2).padStart(20)}\n` + BOLD_OFF;
    texto += `Forma Pagto: ${venda.forma_pagamento || 'Dinheiro'}\n`;
    texto += '--------------------------------\n';
    texto += CENTER + 'Obrigado pela preferencia!\n\n\n\n';
    texto += ESC + 'm'; // Corte de papel (se suportado)

    const data = encoder.encode(texto);
    
    // Enviar para o endpoint de saída da impressora (geralmente o 1 ou 2)
    try {
      await this.device!.transferOut(1, data);
    } catch (error) {
      console.error('Erro ao enviar dados para impressora:', error);
      // Tentar endpoint 2 se o 1 falhar
      try {
        await this.device!.transferOut(2, data);
      } catch (e) {
        console.error('Falha total na impressão:', e);
      }
    }
  }
}

export const impressora = new ImpressoraService();
