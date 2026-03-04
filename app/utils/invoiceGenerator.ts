import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Extension de type pour jsPDF (pour éviter les erreurs TS sur autoTable)
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

export interface InvoiceData {
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
    advance: number;
    status: string;
    // 🛡️ CORRECTION TS : Accepte à la fois les anciens nombres (1) et les nouveaux IDs (A9F2)
    client_order_number: string | number;
  };
}

// 🛡️ DESIGN SYSTEM : Formatage identique à l'interface web
const formatPrice = (amount: number, currency: string) => {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} ${currency}`;
};

export const generateInvoice = (data: InvoiceData) => {
  const doc = new jsPDF();
  const currency = data.shop.currency || "FCFA";
  const remaining = data.order.price - (data.order.advance || 0);

  // --- COULEURS COUTURE OS ---
  // Or : #D4AF37 -> RGB(212, 175, 55)
  // Noir Absolu : RGB(17, 17, 17)

  // --- 1. EN-TÊTE (STYLE LUXE) ---

  // Bande décorative Or en haut du document
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 0, 210, 8, "F");

  // Nom Atelier
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 17, 17);
  doc.text(data.shop.name.toUpperCase(), 20, 28);

  // Info Atelier
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(data.shop.phone || "", 20, 36);
  doc.text(data.shop.address || "", 20, 41);
  doc.text(data.shop.email || "", 20, 46);

  // Titre FACTURE (Effet Watermark subtil)
  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(240, 240, 240); // Très gris très clair
  doc.text("FACTURE", 130, 32);

  // Dates et N° alignés à droite
  doc.setTextColor(17, 17, 17);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const dateCreation = new Date(data.order.date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const dateLivraison = data.order.deadline
    ? new Date(data.order.deadline).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Non définie";

  doc.text(`Date : ${dateCreation}`, 130, 41);
  doc.setFont("helvetica", "bold");
  doc.text(`N° Commande : #${data.order.client_order_number}`, 130, 46);

  // --- 2. INFO CLIENT (ENCADRÉ ÉLÉGANT) ---
  doc.setDrawColor(212, 175, 55); // Ligne Or
  doc.setLineWidth(0.5);
  doc.line(20, 55, 190, 55);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(150);
  doc.text("FACTURÉ À :", 20, 65);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 17, 17);
  doc.setFontSize(12);
  doc.text(data.client.name.toUpperCase(), 20, 72);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(data.client.phone || "", 20, 78);
  doc.text(data.client.city || "", 20, 83);

  // --- 3. TABLEAU DES ARTICLES ---
  autoTable(doc, {
    startY: 95,
    head: [["DESCRIPTION", "LIVRAISON PRÉVUE", "TOTAL"]],
    body: [
      [
        data.order.title +
          (data.order.description
            ? `\n\nNotes: ${data.order.description}`
            : ""),
        dateLivraison,
        formatPrice(data.order.price, currency),
      ],
    ],
    theme: "plain",
    headStyles: {
      fillColor: [17, 17, 17], // Noir Absolu
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "left", // Plus élégant que centré pour la description
    },
    styles: {
      fontSize: 10,
      cellPadding: 8,
      valign: "middle",
      textColor: [50, 50, 50],
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { halign: "center" },
      2: { halign: "right", fontStyle: "bold", textColor: [17, 17, 17] },
    },
    // Bordure inférieure subtile pour le tableau
    willDrawCell: function (data) {
      if (
        data.row.section === "body" &&
        data.row.index === data.table.body.length - 1
      ) {
        doc.setDrawColor(230, 230, 230);
        doc.line(
          data.cell.x,
          data.cell.y + data.cell.height,
          data.cell.x + data.cell.width,
          data.cell.y + data.cell.height,
        );
      }
    },
  });

  // --- 4. TOTAUX & ACOMPTE ---
  const finalY =
    (doc as unknown as jsPDFWithAutoTable).lastAutoTable.finalY + 15;
  const startXParams = 120;

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");

  // Prix Total
  doc.text("Montant Total :", startXParams, finalY);
  doc.setTextColor(17, 17, 17);
  doc.text(formatPrice(data.order.price, currency), 190, finalY, {
    align: "right",
  });

  // Acompte
  doc.setTextColor(100);
  doc.text("Avance perçue :", startXParams, finalY + 8);
  doc.setFont("helvetica", "bold");
  // Utilisation subtile du Or pour l'acompte (positif pour le tailleur)
  doc.setTextColor(212, 175, 55);
  doc.text(
    `- ${formatPrice(data.order.advance || 0, currency)}`,
    190,
    finalY + 8,
    { align: "right" },
  );

  // Ligne de calcul
  doc.setDrawColor(200, 200, 200);
  doc.line(startXParams, finalY + 13, 190, finalY + 13);

  // Reste à payer
  doc.setTextColor(17, 17, 17);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("RESTE À PAYER :", startXParams, finalY + 23);
  doc.text(formatPrice(remaining, currency), 190, finalY + 23, {
    align: "right",
  });

  // Mention "PAYÉ" si solde nul
  if (remaining <= 0) {
    // Un vert très chic et foncé
    doc.setTextColor(46, 125, 50);
    doc.setFontSize(14);
    // On dessine un petit badge
    doc.setDrawColor(46, 125, 50);
    doc.roundedRect(20, finalY + 13, 50, 12, 2, 2);
    doc.text("SOLDE RÉGLÉ", 45, finalY + 21, { align: "center" });
  }

  // --- 5. PIED DE PAGE ---
  const pageHeight = doc.internal.pageSize.height;

  // Ligne Or en bas
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.5);
  doc.line(20, pageHeight - 30, 190, pageHeight - 30);

  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100);
  doc.text(
    "Merci de votre confiance. Pour toute question concernant cette facture, merci de nous contacter.",
    105,
    pageHeight - 22,
    { align: "center" },
  );

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180);
  doc.text(
    `Document généré via Couture OS - L'outil des créateurs`,
    105,
    pageHeight - 15,
    { align: "center" },
  );

  // Nom du fichier ultra-propre
  const cleanOrderTitle = data.order.title.replace(/[^a-zA-Z0-9]/g, "_");
  const cleanClientName = data.client.name.replace(/[^a-zA-Z0-9]/g, "_");
  const fileName = `Facture_${cleanOrderTitle}_${cleanClientName}.pdf`;

  doc.save(fileName);
};
