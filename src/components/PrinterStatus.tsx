import React, { useEffect, useState } from 'react';
import { Printer, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePrinter } from '@/hooks/usePrinter';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export function PrinterStatus() {
    const { isConnected, connect, isPrinting } = usePrinter();

    // Estado local para feedback visual imediato se necessário, 
    // mas o hook já gerencia via printerService

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant={isConnected ? "outline" : "destructive"}
                        size="sm"
                        onClick={connect}
                        disabled={isPrinting}
                        className={`gap-2 transition-all ${isConnected ? 'border-green-500 text-green-600 hover:text-green-700 hover:bg-green-50' : ''}`}
                    >
                        <Printer className="h-4 w-4" />
                        {isConnected ? (
                            <>
                                <span className="hidden sm:inline">Conectada</span>
                                <Check className="h-3 w-3 ml-1" />
                            </>
                        ) : (
                            <>
                                <span className="hidden sm:inline">Desconectada</span>
                                <X className="h-3 w-3 ml-1" />
                            </>
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{isConnected ? "Impressora pronta para uso" : "Clique para conectar impressora USB"}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
