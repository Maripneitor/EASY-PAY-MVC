import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateFinancialReport = (data: any) => {
    const doc = new jsPDF();
    const { user, stats, transactions } = data;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(59, 130, 246); // Primary color
    doc.text('EASY-PAY', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('REPORTE FINANCIERO MENSUAL', 14, 30);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 160, 30);

    // User Info
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 35, 196, 35);
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Usuario: ${user?.nombre || 'N/A'}`, 14, 45);
    doc.text(`Email: ${user?.email || 'N/A'}`, 14, 52);

    // Summary Table
    autoTable(doc, {
        startY: 60,
        head: [['Concepto', 'Monto']],
        body: [
            ['Total Transaccionado', `$${Number(stats?.total_spent || 0).toLocaleString()}`],
            ['A favor (Por cobrar)', `$${Number(stats?.owed_to_user || 0).toLocaleString()}`],
            ['Deudas (Por pagar)', `$${Number(stats?.user_owes || 0).toLocaleString()}`],
            ['Balance Neto', `$${(Number(stats?.owed_to_user || 0) - Number(stats?.user_owes || 0)).toLocaleString()}`],
        ],
        headStyles: { fillColor: [59, 130, 246] }
    });

    // History Table
    if (transactions && transactions.length > 0) {
        doc.setFontSize(14);
        doc.text('Historial de Transacciones', 14, (doc as any).lastAutoTable.finalY + 15);
        
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 20,
            head: [['Fecha', 'Descripción', 'Categoría', 'Estado', 'Monto']],
            body: transactions.map((tx: any) => [
                tx.date,
                tx.description,
                tx.category,
                tx.status === 'completed' ? 'Aprobado' : 'Pendiente',
                `$${tx.amount.toFixed(2)}`
            ]),
            theme: 'striped',
            headStyles: { fillColor: [71, 85, 105] }
        });
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Generado automáticamente por Easy-Pay. Todos los derechos reservados.', 14, 285);
        doc.text(`Página ${i} de ${pageCount}`, 180, 285);
    }

    doc.save(`Reporte_EasyPay_${new Date().getMonth() + 1}_${new Date().getFullYear()}.pdf`);
};
