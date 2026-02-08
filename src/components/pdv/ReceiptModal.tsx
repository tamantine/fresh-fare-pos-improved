import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    Dialog,
    DialogContent,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { usePrinter } from '@/hooks/usePrinter';

interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    venda: any;
    itens: any[];
    onPrint?: () => void;
    autoPrint?: boolean;
}

// Componente visual do recibo (reutilizado para Modal e Impressão)
const ReceiptContent = ({ venda, itens }: { venda: any, itens: any[] }) => {
    if (!venda || !itens) return null;

    const total = venda.total || 0;
    const data = new Date(venda.created_at || Date.now()).toLocaleString('pt-BR');

    return (
        <div className="receipt-content font-mono text-xs leading-tight bg-white text-black p-2 max-w-[80mm] mx-auto">
            {/* Cabeçalho */}
            <div className="text-center mb-2 pb-2 border-b-2 border-dashed border-black">
                <h2 className="text-lg font-black uppercase tracking-wide mb-1">HORTIFRUTI BOM PREÇO</h2>
                <p className="text-[10px] uppercase font-bold">CNPJ: 00.000.000/0001-00</p>
                <p className="text-[10px] uppercase">Rua Comercial, 123 - Centro</p>
                <p className="text-[10px] uppercase">Salto de Pirapora - SP</p>
                <p className="text-[10px] uppercase mt-1">Tel: (15) 99999-9999</p>
                <p className="text-[10px] font-bold mt-2 border-t border-black pt-1">CUPOM NÃO FISCAL</p>
            </div>

            {/* Info Venda */}
            <div className="flex flex-col text-[10px] mb-2 font-bold uppercase">
                <div className="flex justify-between">
                    <span>Data: {data}</span>
                </div>
                <div className="flex justify-between">
                    <span>Venda: #{venda.numero_venda || venda.id?.substring(0, 8)}</span>
                </div>
            </div>
            <div className="border-b border-black mb-2"></div>

            {/* Lista de Itens */}
            <div className="mb-2">
                <div className="flex text-[10px] font-bold border-b border-black pb-1 mb-1">
                    <span className="w-8 text-center border-r border-black mr-1">ITEM</span>
                    <span className="flex-1 text-left uppercase">DESCRIÇÃO</span>
                    <span className="w-8 text-center border-l border-black ml-1">QTD</span>
                    <span className="w-12 text-right border-l border-black ml-1">TOTAL</span>
                </div>
                <div className="space-y-1">
                    {itens.map((item: any, idx: number) => (
                        <div key={idx} className="flex text-[10px] items-start">
                            <span className="w-8 text-center mr-1 font-bold">{(idx + 1).toString().padStart(3, '0')}</span>
                            <div className="flex-1 flex flex-col">
                                <span className="uppercase font-bold line-clamp-2">
                                    {item.nome || item.produto?.nome || `PRODUTO ${item.produto_id}`}
                                </span>
                                {item.preco_unitario && (
                                    <span className="text-[9px] text-gray-600">
                                        {item.quantidade} x R$ {Number(item.preco_unitario).toFixed(2)}
                                    </span>
                                )}
                            </div>
                            <span className="w-8 text-center ml-1 font-bold">
                                {item.tipo_venda === 'peso' ? Number(item.quantidade).toFixed(3) : item.quantidade}
                            </span>
                            <span className="w-12 text-right ml-1 font-bold">
                                {((Number(item.preco_unitario) || 0) * (Number(item.quantidade) || 0)).toFixed(2)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="border-b-2 border-dashed border-black mb-2"></div>

            {/* Totais */}
            <div className="flex justify-between items-center text-sm font-black mb-1 uppercase">
                <span>TOTAL A PAGAR</span>
                <span className="text-base">R$ {Number(total).toFixed(2)}</span>
            </div>

            {/* Detalhamento Pagamento */}
            <div className="border-t border-dashed border-black pt-1 mt-1 text-[10px] font-bold uppercase">
                {venda.payments && venda.payments.length > 0 ? (
                    <>
                        <div className="flex justify-between mb-1">
                            <span>Forma Pagamento:</span>
                            <span>MÚLTIPLO</span>
                        </div>
                        {venda.payments.map((p: any, idx: number) => (
                            <div key={idx} className="flex justify-between pl-2">
                                <span>- {p.method}:</span>
                                <span>R$ {Number(p.value).toFixed(2)}</span>
                            </div>
                        ))}
                    </>
                ) : (
                    <div className="flex justify-between">
                        <span>Forma Pagamento:</span>
                        <span>{venda.forma_pagamento || venda.paymentMethod}</span>
                    </div>
                )}

                {venda.moneyReceived && (
                    <>
                        <div className="border-t border-dotted border-black my-1"></div>
                        <div className="flex justify-between">
                            <span>Valor Recebido (Dinheiro):</span>
                            <span>R$ {Number(venda.moneyReceived).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Troco:</span>
                            <span>R$ {Number(venda.change).toFixed(2)}</span>
                        </div>
                    </>
                )}
            </div>

            {/* Rodapé */}
            <div className="text-center mt-4 pt-2 border-t-2 border-dashed border-black">
                <p className="text-[10px] font-bold uppercase">OBRIGADO PELA PREFERÊNCIA!</p>
                <p className="text-[8px] uppercase mt-1">VOLTE SEMPRE</p>
                <div className="mt-2 text-[8px] italic">
                    Desenvolvido por Fresh Fare POS
                </div>
            </div>
        </div>
    );
};

export const ReceiptModal = ({ isOpen, onClose, venda, itens, onPrint, autoPrint = false }: ReceiptModalProps) => {
    const { isConnected, printReceipt: printUsb } = usePrinter();
    const [mountPrintPortal, setMountPrintPortal] = useState(false);

    const handlePrint = async () => {
        // 1. Tenta impressão USB Direta
        if (isConnected) {
            const saleData = {
                items: itens.map(i => ({
                    name: i.nome || i.produto?.nome || 'Item',
                    quantity: i.quantidade,
                    price: i.preco_unitario
                })),
                paymentMethod: venda.forma_pagamento || venda.paymentMethod,
                payments: venda.payments,
                moneyReceived: venda.moneyReceived,
                change: venda.change
            };
            const success = await printUsb(saleData);
            if (success) return;
        }

        // 2. Fallback para Impressão do Navegador (CSS Media Print)
        // Monta o portal de impressão se não estiver montado
        setMountPrintPortal(true);

        // Pequeno delay para garantir que o React renderizou o portal
        setTimeout(() => {
            window.print();
            if (onPrint) onPrint();
            // Opcional: Desmontar depois? Melhor deixar montado enquanto o modal estiver aberto ou apenas hiding via CSS
        }, 100);
    };

    useEffect(() => {
        if (isOpen && autoPrint) {
            setTimeout(handlePrint, 500);
        }
    }, [isOpen, autoPrint]);

    // Garantir que o portal de impressão limpe ao fechar
    useEffect(() => {
        if (!isOpen) {
            setMountPrintPortal(false);
        } else {
            // Se abriu, já deixa preparado ou monta on-demand no clique
            setMountPrintPortal(true);
        }
    }, [isOpen]);

    if (!venda || !itens) return null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-md bg-white text-black overflow-hidden no-print">

                    <div className="max-h-[70vh] overflow-y-auto border border-gray-200 rounded-md shadow-inner bg-gray-50 my-4">
                        <div className="transform scale-90 origin-top">
                            <ReceiptContent venda={venda} itens={itens} />
                        </div>
                    </div>

                    <DialogFooter className="no-print mt-4">
                        <Button variant="outline" onClick={onClose}>Fechar</Button>
                        <Button onClick={handlePrint} className="gap-2">
                            <Printer className="h-4 w-4" /> Imprimir
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Portal de Impressão - Renderiza direto no Body para isolamento total */}
            {mountPrintPortal && createPortal(
                <div className="print-portal">
                    <ReceiptContent venda={venda} itens={itens} />
                    <style>{`
                        @media print {
                            /* Esconde tudo no body */
                            body > * {
                                display: none !important;
                            }
                            
                            /* Mostra apenas o portal de impressão */
                            body > .print-portal {
                                display: block !important;
                                position: absolute;
                                top: 0;
                                left: 0;
                                width: 80mm; /* Força largura térmica */
                                margin: 0;
                                padding: 0;
                                background: white;
                            }

                            /* Ajustes da página */
                            @page {
                                margin: 0;
                                size: 80mm auto; /* Tenta informar a impressora */
                            }
                        }
                        
                        /* Em tela normal, esconde o portal */
                        @media screen {
                            .print-portal {
                                display: none;
                            }
                        }
                    `}</style>
                </div>,
                document.body
            )}
        </>
    );
};
