import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Adicionando tipos para jsPDF com autoTable, já que o typescript as vezes reclama
interface jsPDFWithAutoTable extends jsPDF {
    lastAutoTable: { finalY: number };
}

export const generateClosingReport = (caixaData: any) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;

    // --- HEADER DE EMPRESA ---
    doc.setFillColor(39, 174, 96); // Verde Base (#27ae60)
    doc.rect(0, 0, 210, 20, 'F');

    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Hortifruti Bom Preço', 15, 14);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('RELATÓRIO DE FECHAMENTO DE CAIXA', 130, 14);

    let currentY = 35;

    // --- INFO GERAL ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo da Operação', 15, currentY);

    currentY += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const dataAbertura = new Date(caixaData.data_abertura).toLocaleString('pt-BR');
    const dataFechamento = caixaData.data_fechamento
        ? new Date(caixaData.data_fechamento).toLocaleString('pt-BR')
        : new Date().toLocaleString('pt-BR');

    doc.text(`ID do Caixa: ${caixaData.caixa_id.slice(0, 8)}`, 15, currentY);
    doc.text(`Abertura: ${dataAbertura}`, 100, currentY);
    currentY += 6;
    doc.text(`Operador: ADMIN`, 15, currentY); // Idealmente pegar do profile, mas admin é default pos
    doc.text(`Fechamento: ${dataFechamento}`, 100, currentY);

    currentY += 15;

    // --- TABELA FINANCEIRA ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Movimento Financeiro', 15, currentY);
    currentY += 5;

    const financialData = [
        ['Fundo de Troco (Inicial)', `R$ ${Number(caixaData.valor_inicial || 0).toFixed(2)}`],
        ['Total de Vendas', `R$ ${Number(caixaData.total_vendas || 0).toFixed(2)}`],
        ['', ''], // Linha em branco
        ['Saldo em Dinheiro (Gaveta)', `R$ ${Number(caixaData.saldo_sistema || 0).toFixed(2)}`],
        ['Vendas em Cartão', `R$ ${Number(caixaData.saldo_cartao || 0).toFixed(2)}`],
        ['Vendas em PIX', `R$ ${Number(caixaData.saldo_pix || 0).toFixed(2)}`],
        ['', ''], // Linha em branco
        ['Valor Informado (Conferência)', `R$ ${Number(caixaData.valor_final_informado || 0).toFixed(2)}`],
        ['Diferença (Quebra)', `R$ ${Number(caixaData.quebra || 0).toFixed(2)}`],
    ];

    autoTable(doc, {
        startY: currentY,
        head: [['Descrição', 'Valor']],
        body: financialData,
        theme: 'grid',
        headStyles: { fillColor: [60, 60, 60], textColor: 255 },
        columnStyles: {
            0: { cellWidth: 120 },
            1: { cellWidth: 60, halign: 'right', fontStyle: 'bold' }
        },
        styles: { fontSize: 10, cellPadding: 3 },
    });

    currentY = doc.lastAutoTable.finalY + 15;

    // --- TABELA FORMAS DE PAGAMENTO ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalhamento por Forma de Pagamento', 15, currentY);
    currentY += 5;

    const pagamentosBody = (caixaData.vendas_por_pagamento || []).map((p: any) => [
        p.forma_pagamento.toUpperCase(),
        p.qtd,
        `R$ ${Number(p.total).toFixed(2)}`
    ]);

    if (pagamentosBody.length > 0) {
        autoTable(doc, {
            startY: currentY,
            head: [['Forma de Pagamento', 'Qtd. Vendas', 'Total']],
            body: pagamentosBody,
            theme: 'striped',
            headStyles: { fillColor: [39, 174, 96], textColor: 255 },
            columnStyles: {
                2: { halign: 'right' }
            },
            styles: { fontSize: 10 }
        });
        currentY = doc.lastAutoTable.finalY + 20;
    } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text('Nenhuma venda registrada neste período.', 15, currentY + 10);
        currentY += 20;
    }

    // --- RODAPÉ E ASSINATURA ---
    currentY += 20;
    doc.setLineWidth(0.5);
    doc.line(15, currentY, 85, currentY); // Linha Operador
    doc.line(105, currentY, 175, currentY); // Linha Gerente

    currentY += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Assinatura do Operador', 30, currentY);
    doc.text('Assinatura do Gerente', 120, currentY);

    // --- SAVE ---
    const fileName = `fechamento_caixa_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
};
