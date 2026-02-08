/**
 * Utilitário para integração com balanças via Web Serial API
 */

export interface BalancaData {
  peso: number;
  unidade: string;
  estavel: boolean;
}

export class BalancaService {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader | null = null;
  private keepReading: boolean = false;

  /**
   * Solicita permissão e conecta à balança
   */
  async conectar(): Promise<boolean> {
    try {
      if (!('serial' in navigator)) {
        throw new Error('Web Serial API não suportada neste navegador.');
      }

      // Solicitar porta ao usuário
      this.port = await (navigator as any).serial.requestPort();
      
      // Abrir a porta (configurações padrão para a maioria das balanças: 9600 baud)
      await this.port!.open({ baudRate: 9600 });
      
      return true;
    } catch (error) {
      console.error('Erro ao conectar à balança:', error);
      return false;
    }
  }

  /**
   * Inicia a leitura contínua dos dados da balança
   */
  async lerPeso(onData: (data: BalancaData) => void) {
    if (!this.port || !this.port.readable) return;

    this.keepReading = true;
    const decoder = new TextDecoder();

    while (this.port.readable && this.keepReading) {
      this.reader = this.port.readable.getReader();
      try {
        while (true) {
          const { value, done } = await this.reader.read();
          if (done) break;
          
          const text = decoder.decode(value);
          const peso = this.parsePeso(text);
          
          if (peso !== null) {
            onData({
              peso,
              unidade: 'kg',
              estavel: true // Simplificação: a maioria das balanças envia apenas quando estável ou tem um flag
            });
          }
        }
      } catch (error) {
        console.error('Erro na leitura da balança:', error);
      } finally {
        this.reader.releaseLock();
      }
    }
  }

  /**
   * Para a leitura
   */
  async parar() {
    this.keepReading = false;
    if (this.reader) {
      await this.reader.cancel();
    }
    if (this.port) {
      await this.port.close();
    }
  }

  /**
   * Converte a string recebida da balança em número
   * Formatos comuns: "ST,GS,+  1.250kg", "001.250", etc.
   */
  private parsePeso(data: string): number | null {
    // Regex para extrair números e decimais
    const match = data.match(/[-+]?\d*\.?\d+/);
    if (match) {
      return parseFloat(match[0]);
    }
    return null;
  }
}

export const balanca = new BalancaService();
