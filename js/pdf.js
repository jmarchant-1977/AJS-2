import { fileDB } from './fileDB.js';
export async function generarPDFIndividual(index) {
  const recibos = await fileDB.getRecibos();
  const r = recibos[index];
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();


  const qr = new QRious({ value: JSON.stringify(r), size: 50 });

  doc.setFontSize(14);
  doc.text("Recibo de Pago", 105, 20, null, null, 'center');
  doc.setFontSize(11);

  // primera fila F=45
  const f1=45;
  doc.text(`N° Control: ${r.numero}`, 10, f1); 
  doc.text(`Fecha: ${r.fecha}`, 50, f1);
  doc.text(`Monto: $${parseFloat(r.monto).toFixed(2)}`, 100, f1);
  //doc.text(`Fecha: ${r.fecha}`, 10, 52);
  doc.text(`Cliente: ${r.cliente}`, 10, 59);
  doc.text(`Concepto: ${r.concepto}`, 10, 66);
//  doc.text(`Monto: $${parseFloat(r.monto).toFixed(2)}`, 10, 73);
  doc.text(`Forma de Pago: ${r.pago}`, 10, 80);
  doc.text(`Observaciones: ${r.observaciones || '-'}`, 10, 87);

  doc.addImage(qr.toDataURL(), 'PNG', 160, 10, 20, 20);
  doc.save(`Recibo_${r.numero}.pdf`);
}

export async function generarPDFRecibos() {
  const recibos = await fileDB.getRecibos();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(12);
  doc.text("Listado de Recibos de Pago", 105, 10, null, null, 'center');

  let y = 20;
  recibos.forEach(r => {
    doc.text(`N°: ${r.numero} | Fecha: ${r.fecha} | Cliente: ${r.cliente} | Monto: $${parseFloat(r.monto).toFixed(2)}`, 10, y);
    y += 7;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  doc.save("Listado_Recibos.pdf");
}