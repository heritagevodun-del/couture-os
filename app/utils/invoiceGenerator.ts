import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Extension de type pour jsPDF (pour éviter les erreurs TS)
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
    advance: number; // NOUVEAU : L'avance versée
    status: string;
    client_order_number: number;
  };
}

// Fonction pour formater proprement les prix (ex: 10 000 FCFA)
const formatPrice = (amount: number, currency: string) => {
  return `${amount.toLocaleString("fr-FR")} ${currency}`;
};

export const generateInvoice = (data: InvoiceData) => {
  const doc = new jsPDF();
  const currency = data.shop.currency || "FCFA";
  const remaining = data.order.price - (data.order.advance || 0);

  // --- 1. EN-TÊTE (STYLE MODERNE) ---
  // Bande noire en haut (Optionnel, pour le style)
  // doc.setFillColor(0, 0, 0);
  // doc.rect(0, 0, 210, 20, 'F');

  // Nom Atelier
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(data.shop.name.toUpperCase(), 20, 30);

  // Info Atelier
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(data.shop.phone || "", 20, 38);
  doc.text(data.shop.address || "", 20, 43);
  doc.text(data.shop.email || "", 20, 48);

  // Titre FACTURE et Dates (Aligné droite)
  doc.setTextColor(0);
  doc.setFontSize(30);
  doc.setTextColor(220, 220, 220); // Gris très clair pour effet "Watermark"
  doc.text("FACTURE", 140, 35);

  doc.setTextColor(0); // Retour noir
  doc.setFontSize(10);
  const dateCreation = new Date(data.order.date).toLocaleDateString("fr-FR");
  const dateLivraison = data.order.deadline
    ? new Date(data.order.deadline).toLocaleDateString("fr-FR")
    : "Non définie";

  doc.text(`Date : ${dateCreation}`, 140, 45);
  doc.text(`N° Commande : #${data.order.client_order_number}`, 140, 50);

  // --- 2. INFO CLIENT (ENCADRÉ) ---
  doc.setDrawColor(200);
  doc.line(20, 55, 190, 55); // Ligne de séparation

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURÉ À :", 20, 65);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(data.client.name.toUpperCase(), 20, 72);

  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(data.client.phone || "", 20, 78);
  doc.text(data.client.city || "", 20, 83);

  // --- 3. TABLEAU DES ARTICLES ---
  autoTable(doc, {
    startY: 90,
    head: [["DESCRIPTION", "LIVRAISON PRÉVUE", "TOTAL"]],
    body: [
      [
        data.order.title +
          (data.order.description
            ? `\n\nDétails: ${data.order.description}`
            : ""),
        dateLivraison,
        formatPrice(data.order.price, currency),
      ],
    ],
    theme: "plain", // Style épuré
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    styles: {
      fontSize: 11,
      cellPadding: 6,
      valign: "middle",
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { halign: "center" },
      2: { halign: "right", fontStyle: "bold" },
    },
  });

  // --- 4. TOTAUX & ACOMPTE (LE CŒUR DU SYSTÈME) ---
  const finalY =
    (doc as unknown as jsPDFWithAutoTable).lastAutoTable.finalY + 10;

  // On dessine un petit tableau pour les totaux à droite
  const startXParams = 120;

  doc.setFontSize(11);
  doc.setTextColor(0);

  // Prix Total
  doc.text("Montant Total :", startXParams, finalY);
  doc.text(formatPrice(data.order.price, currency), 190, finalY, {
    align: "right",
  });

  // Acompte (En vert si payé)
  doc.setTextColor(0, 150, 0); // Vert
  doc.text("Avance / Acompte :", startXParams, finalY + 8);
  doc.text(
    `- ${formatPrice(data.order.advance || 0, currency)}`,
    190,
    finalY + 8,
    { align: "right" },
  );

  // Ligne de calcul
  doc.setDrawColor(0);
  doc.line(startXParams, finalY + 12, 190, finalY + 12);

  // Reste à payer (En rouge ou gras)
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("RESTE À PAYER :", startXParams, finalY + 20);
  doc.text(formatPrice(remaining, currency), 190, finalY + 20, {
    align: "right",
  });

  // Mention "PAYÉ" si solde nul
  if (remaining <= 0) {
    doc.setTextColor(0, 150, 0);
    doc.setFontSize(16);
    doc.text("SOLDE RÉGLÉ ✔", 20, finalY + 20);
  }

  // --- 5. PIED DE PAGE ---
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150);
  doc.text("Merci de votre confiance !", 105, pageHeight - 20, {
    align: "center",
  });
  doc.text(`Généré par CoutureOS - ${data.shop.name}`, 105, pageHeight - 15, {
    align: "center",
  });

  // Nom du fichier
  const fileName = `Facture_${data.order.title.replace(/\s+/g, "_")}_${data.client.name.replace(/\s+/g, "_")}.pdf`;
  doc.save(fileName);
};
