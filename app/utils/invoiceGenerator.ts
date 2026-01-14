import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Définition des types
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

  // --- FONCTION FORMATAGE PRIX ---
  // Met un espace entre les milliers (ex: 10 000)
  const formatPrice = (price: number) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  // --- 1. EN-TÊTE (ATELIER) ---
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(data.shop.name || "ATELIER COUTURE", 20, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(data.shop.address || "", 20, 27);
  doc.text(data.shop.phone || "", 20, 32);
  doc.text(data.shop.email || "", 20, 37);

  // --- 2. BLOC INFO FACTURE (DROITE) ---
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURE / REÇU", 190, 20, { align: "right" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  // Numéro de commande propre (#1, #2...)
  doc.text(`N° Commande : #${data.order.client_order_number}`, 190, 27, {
    align: "right",
  });
  doc.text(`Date : ${data.order.date}`, 190, 32, { align: "right" });

  // --- 3. INFOS CLIENT ---
  doc.setDrawColor(220);
  doc.line(20, 45, 190, 45);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURÉ À :", 20, 55);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(data.client.name.toUpperCase(), 20, 62);
  doc.text(data.client.city || "Ville non renseignée", 20, 67);
  doc.text(data.client.phone || "", 20, 72);

  // --- 4. TABLEAU DES PRESTATIONS ---
  const tableColumn = ["DESCRIPTION", "LIVRAISON", "MONTANT"];
  const tableRows = [
    [
      data.order.title +
        (data.order.description ? `\n\n${data.order.description}` : ""),
      new Date(data.order.deadline).toLocaleDateString("fr-FR"),
      `${formatPrice(data.order.price)} ${currency}`,
    ],
  ];

  autoTable(doc, {
    startY: 85,
    head: [tableColumn],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { halign: "center", cellWidth: 40 },
      2: { halign: "right", fontStyle: "bold" },
    },
    styles: {
      fontSize: 10,
      cellPadding: 6,
      lineColor: [230, 230, 230],
    },
  });

  // --- 5. TOTAL ET STATUT ---

  // CORRECTION PROPRE : On définit le type exact attendu au lieu de 'any'
  // Cela satisfait le linter TypeScript strict.
  const finalY =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 10;

  // Ligne de séparation
  doc.setDrawColor(0, 0, 0);
  doc.line(120, finalY, 190, finalY);

  // Statut
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const statusText =
    data.order.status === "termine" ? "PAYÉ / TERMINÉ" : "EN COURS";
  doc.text(`Statut : ${statusText}`, 20, finalY + 10);

  // Total
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL", 120, finalY + 10);

  doc.setFontSize(14);
  doc.text(`${formatPrice(data.order.price)} ${currency}`, 190, finalY + 10, {
    align: "right",
  });

  // --- 6. PIED DE PAGE ---
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.setFont("helvetica", "italic");
  doc.text("Merci de votre confiance !", 105, 280, { align: "center" });

  // Sauvegarder
  doc.save(
    `Facture_${data.client.name.replace(/\s/g, "_")}_CMD${
      data.order.client_order_number
    }.pdf`
  );
};
