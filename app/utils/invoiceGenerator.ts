import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Définition des types pour TypeScript
interface InvoiceData {
  shop: {
    name: string;
    address: string;
    phone: string;
    email: string;
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
  };
}

export const generateInvoice = (data: InvoiceData) => {
  const doc = new jsPDF();

  // --- 1. EN-TÊTE (ATELIER) ---
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(data.shop.name || "Mon Atelier", 20, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(data.shop.address || "Adresse non renseignée", 20, 26);
  doc.text(data.shop.phone || "", 20, 31);
  doc.text(data.shop.email || "", 20, 36);

  // --- 2. TITRE DU DOCUMENT ---
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURE / REÇU", 150, 20, { align: "right" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  // On prend les 8 premiers caractères de l'ID pour faire court
  doc.text(
    `N° Commande : #${data.order.id.slice(0, 8).toUpperCase()}`,
    150,
    26,
    { align: "right" }
  );
  doc.text(`Date : ${new Date().toLocaleDateString("fr-FR")}`, 150, 31, {
    align: "right",
  });

  // --- 3. INFOS CLIENT ---
  doc.setDrawColor(200);
  doc.line(20, 45, 190, 45); // Ligne de séparation grise

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Facturé à :", 20, 55);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(data.client.name, 20, 62);
  doc.text(`${data.client.city} - ${data.client.phone}`, 20, 67);

  // --- 4. TABLEAU DES PRESTATIONS ---
  const tableColumn = ["Description", "Livraison prévue", "Prix Total"];
  const tableRows = [
    [
      data.order.title +
        (data.order.description ? `\n(${data.order.description})` : ""),
      new Date(data.order.deadline).toLocaleDateString("fr-FR"),
      `${data.order.price.toLocaleString()} FCFA`,
    ],
  ];

  autoTable(doc, {
    startY: 80,
    head: [tableColumn],
    body: tableRows,
    theme: "grid",
    headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
    styles: { fontSize: 11, cellPadding: 4 },
  });

  // --- 5. TOTAL ET STATUT ---

  /* CORRECTION STRICTE ICI :
     Au lieu de 'any', on définit précisément la structure attendue.
     On dit à TS : "doc est un jsPDF ET il a une propriété lastAutoTable"
  */
  const finalY =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 10;

  doc.setFontSize(12);
  doc.text(
    `Statut : ${data.order.status.toUpperCase().replace("_", " ")}`,
    20,
    finalY + 10
  );

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(
    `TOTAL : ${data.order.price.toLocaleString()} FCFA`,
    190,
    finalY + 10,
    { align: "right" }
  );

  // --- 6. PIED DE PAGE ---
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Merci de votre confiance !", 105, 280, { align: "center" });

  // Sauvegarder le fichier
  doc.save(
    `Facture_${data.client.name.replace(/\s/g, "_")}_${data.order.date}.pdf`
  );
};
