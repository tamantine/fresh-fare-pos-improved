import { ESC, encodeText, formatCurrency } from '../utils/escpos';

export interface PrinterDevice {
    device: USBDevice;
    isConnected: boolean;
}

export class UsbPrinterService {
    private device: USBDevice | null = null;
    private interfaceNumber: number = 0;
    private endpointOut: number = 0;

    constructor() { }

    /**
     * Solicita ao usuário permissão para conectar a uma impressora USB.
     */
    async requestDevice(): Promise<boolean> {
        try {
            // Filtros para impressoras (Classe 7) ou genérico
            // Algumas impressoras não reportam a classe corretamente, então filters: [] permite listar tudo (menos seguro/filtrado)
            // Mas para WebUSB, filters é obrigatório ou usar [] para "todos os dispositivos permitidos anteriormente"
            // Se for a primeira vez, é melhor ter um filtro vazio ou específico.

            const device = await navigator.usb.requestDevice({ filters: [] });
            await this.setupDevice(device);
            return true;
        } catch (error) {
            console.error('Erro ao solicitar dispositivo USB:', error);
            return false;
        }
    }

    /**
     * Tenta reconectar a um dispositivo previamente autorizado.
     */
    async reconnectPreviousDevice(): Promise<boolean> {
        try {
            const devices = await navigator.usb.getDevices();
            if (devices.length > 0) {
                // Tenta o primeiro dispositivo disponível (ou lógica mais complexa de matching)
                await this.setupDevice(devices[0]);
                return true;
            }
        } catch (error) {
            console.error('Erro ao reconectar dispositivo:', error);
        }
        return false;
    }

    /**
     * Configura o dispositivo (open, select configuration, claim interface).
     */
    private async setupDevice(device: USBDevice) {
        await device.open();
        if (device.configuration === null) {
            await device.selectConfiguration(1);
        }

        // Tentar encontrar a interface de impressora
        // Geralmente interfaceClass 7. Se não achar, tenta a 0.
        const interfaces = device.configuration?.interfaces || [];
        let targetInterface = interfaces.find(i => i.alternate.interfaceClass === 7) || interfaces[0];

        if (!targetInterface) throw new Error('Interface de impressora não encontrada.');

        this.interfaceNumber = targetInterface.interfaceNumber;
        await device.claimInterface(this.interfaceNumber);

        // Encontrar endpoint OUT (direção 'out')
        const endpoint = targetInterface.alternate.endpoints.find(e => e.direction === 'out');
        if (!endpoint) throw new Error('Endpoint de saída não encontrado.');

        this.endpointOut = endpoint.endpointNumber;
        this.device = device;
        console.log('Impressora configurada com sucesso:', device.productName);
    }

    /**
     * Envia dados brutos para a impressora.
     */
    async print(data: Uint8Array) {
        if (!this.device) throw new Error('Impressora não conectada.');

        try {
            await this.device.transferOut(this.endpointOut, data as any);
        } catch (error) {
            console.error('Erro de tranferência USB:', error);
            throw error;
        }
    }

    /**
     * Gera o buffer de impressão do cupom.
     */
    generateReceipt(saleData: any): Uint8Array {
        const buffers: Uint8Array[] = [];

        const add = (command: number[]) => buffers.push(new Uint8Array(command));
        const text = (str: string) => buffers.push(encodeText(str));
        const line = (str: string) => buffers.push(encodeText(str + '\n'));

        // Inicialização
        add(ESC.INIT);
        add(ESC.ALIGN_CENTER);
        add(ESC.BOLD_ON);
        line('HORTIFRUTI BOM PRECO');
        add(ESC.BOLD_OFF);
        line('Salto de Pirapora, SP');
        line('--------------------------------');

        line(`Data: ${new Date().toLocaleString('pt-BR')}`);
        line('--------------------------------');

        // Itens
        add(ESC.ALIGN_LEFT);
        line('ITEM             QTD   VALOR');

        let total = 0;
        if (saleData.items && Array.isArray(saleData.items)) {
            saleData.items.forEach((item: any) => {
                const nome = item.name.substring(0, 15).padEnd(16, ' ');
                const qtd = String(item.quantity).substring(0, 4).padEnd(5, ' ');
                const valor = formatCurrency(item.price * item.quantity).padStart(8, ' ');
                line(`${nome}${qtd}${valor}`);
                total += item.price * item.quantity;
            });
        }

        line('--------------------------------');

        // Total
        add(ESC.ALIGN_RIGHT);
        add(ESC.BOLD_ON);
        add(ESC.TEXT_DOUBLE_HEIGHT);
        line(`TOTAL: ${formatCurrency(total)}`);
        add(ESC.TEXT_NORMAL);
        add(ESC.BOLD_OFF);

        line('--------------------------------');
        add(ESC.ALIGN_LEFT);

        // Forma de Pagamento
        const getPaymentLabel = (method: string) => ({
            'dinheiro': 'DINHEIRO',
            'debito': 'CARTAO DEBITO',
            'credito': 'CARTAO CREDITO',
            'pix': 'PIX',
            'multiplo': 'MULTIPLO'
        }[method] || 'OUTROS');

        const paymentMethodLabel = getPaymentLabel(saleData.paymentMethod as string);

        line(`FORMA PAGTO: ${paymentMethodLabel}`);

        // Se for múltiplo, listar
        if (saleData.payments && saleData.payments.length > 0) {
            saleData.payments.forEach((p: any) => {
                const label = getPaymentLabel(p.method).padEnd(14, ' ');
                const val = formatCurrency(p.value).padStart(8, ' ');
                line(`- ${label}${val}`);
            });
        }

        // Se for dinheiro, mostra pago e troco
        if (saleData.paymentMethod === 'dinheiro' && saleData.moneyReceived) {
            line(`VALOR PAGO : ${formatCurrency(saleData.moneyReceived)}`);
            line(`TROCO      : ${formatCurrency(saleData.change)}`);
        }

        // Rodapé
        add(ESC.ALIGN_CENTER);
        line('');
        line('');
        line('Obrigado pela preferencia!');
        line('');
        line('CUPOM NAO FISCAL');
        line('');
        line(''); // Feed

        // Corte
        add(ESC.CUT);

        // Concatenar tudo
        const totalLength = buffers.reduce((acc, buf) => acc + buf.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const buf of buffers) {
            result.set(buf, offset);
            offset += buf.length;
        }

        return result;
    }

    isConnected() {
        return !!this.device && this.device.opened;
    }
}

export const printerService = new UsbPrinterService();
