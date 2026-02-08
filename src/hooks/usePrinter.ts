import { useState, useEffect, useCallback } from 'react';
import { printerService } from '../services/usbPrinter';
import { useToast } from './use-toast';

export function usePrinter() {
    const [isConnected, setIsConnected] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const { toast } = useToast();

    const checkConnection = useCallback(() => {
        setIsConnected(printerService.isConnected());
    }, []);

    useEffect(() => {
        // Tentar reconexão automática ao montar
        printerService.reconnectPreviousDevice().then((connected) => {
            if (connected) {
                setIsConnected(true);
                // toast({ title: "Impressora reconectada", duration: 2000 });
            }
        });

        // Listeners para desconexão (navigador.usb events se necessário)
        if (navigator.usb) {
            navigator.usb.addEventListener('disconnect', () => {
                setIsConnected(false);
                toast({ title: "Impressora desconectada", variant: "destructive" });
            });
        }
    }, [toast]);

    const connect = async () => {
        try {
            const connected = await printerService.requestDevice();
            setIsConnected(connected);
            if (connected) {
                toast({ title: "Impressora conectada com sucesso!" });
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Falha ao conectar impressora", variant: "destructive" });
        }
    };

    const printReceipt = async (saleData: any) => {
        if (!printerService.isConnected()) {
            toast({
                title: "Impressora não conectada",
                description: "Conecte a impressora antes de imprimir.",
                variant: "destructive"
            });
            return false;
        }

        setIsPrinting(true);
        try {
            const data = printerService.generateReceipt(saleData);
            await printerService.print(data);
            // toast({ title: "Comando de impressão enviado" });
            return true;
        } catch (error) {
            console.error(error);
            toast({ title: "Erro na impressão", variant: "destructive" });
            return false;
        } finally {
            setIsPrinting(false);
        }
    };

    return { isConnected, connect, printReceipt, isPrinting };
}
