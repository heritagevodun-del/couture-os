import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Interface pour ajouter la propriété manquante au type jsPDF standard
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

interface InvoiceData {
  shop: {
    name: string;
    address: string;
    phone: string;
    email: string;
    currency: string;
  };
  client: {
    name: string;
    phone: string;
    city: string;
  };
  order: {
    id: string;
    title: string;
    date: string;
    deadline: string;
    description: string;
    price: number;
    status: string;
    client_order_number: number;
  };
}

export const generateInvoice = (data: InvoiceData) => {
  const doc = new jsPDF();
  const currency = data.shop.currency || "FCFA";

  // --- EN-TÊTE ---
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(data.shop.name.toUpperCase(), 20, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(data.shop.phone || "", 20, 28);
  doc.text(data.shop.address || "", 20, 33);

  doc.setFontSize(26);
  doc.setTextColor(200, 200, 200);
  doc.text("FACTURE", 150, 25);
  doc.setTextColor(0, 0, 0);

  // --- INFOS ---
  doc.setFontSize(11);

  doc.setFont("helvetica", "bold");
  doc.text("Facturé à :", 20, 50);
  doc.setFont("helvetica", "normal");
  doc.text(data.client.name, 20, 56);
  doc.text(data.client.phone || "", 20, 61);
  doc.text(data.client.city || "", 20, 66);

  const date = new Date().toLocaleDateString("fr-FR");
  const deadline = new Date(data.order.deadline).toLocaleDateString("fr-FR");

  doc.text(`Date : ${date}`, 140, 50);
  doc.text(`N° Commande : #${data.order.client_order_number}`, 140, 56);
  doc.text(`Livraison prévue : ${deadline}`, 140, 62);

  // --- TABLEAU ---
  autoTable(doc, {
    startY: 80,
    head: [["Description", "Statut", "Total"]],
    body: [
      [
        data.order.title +
          (data.order.description ? `\n(${data.order.description})` : ""),
        data.order.status.replace("_", " ").toUpperCase(),
        `${data.order.price.toLocaleString()} ${currency}`,
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
    styles: { fontSize: 11, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 100 },
      2: { halign: "right", fontStyle: "bold" },
    },
  });

  // --- TOTAUX ---
  // Correction ici : on cast doc en notre type personnalisé pour éviter l'erreur TS
  const finalY =
    (doc as unknown as jsPDFWithAutoTable).lastAutoTable.finalY + 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL À PAYER :`, 130, finalY);
  doc.setFontSize(14);
  doc.text(`${data.order.price.toLocaleString()} ${currency}`, 190, finalY, {
    align: "right",
  });

  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 100, 100);
  doc.text("Merci de votre confiance !", 105, 280, { align: "center" });

  const fileName = `Facture_${data.order.title.replace(/\s+/g, "_")}.pdf`;
  doc.save(fileName);
};
