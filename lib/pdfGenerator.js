import jsPDF from \'jspdf\';

export   const generatePDF = (dossier, signatureDataUrl) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const w = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const marginX = 20;
    const maxW = w - 2 * marginX;

    const client = dossier.clients;
    const garage = dossier.garages;
    const assurance = dossier.assurances;
    const dateSinistre = dossier.date_sinistre ? new Date(dossier.date_sinistre).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
    const dateAuj = new Date().toLocaleDateString('fr-FR');

    // -- HELPER 1 : Paragraphe intelligent --
    const writeText = (text, yPos, font = 'normal', size = 10) => {
      doc.setFont('helvetica', font);
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(text, maxW);
      doc.text(lines, marginX, yPos);
      return yPos + (lines.length * (size * 0.45)) + 4; // Calcule automatiquement l'espacement
    };

    // -- HELPER 2 : Pied de page discret et fixe --
    const printFooter = () => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      const footerText = `${garage?.nom_garage || ''} - ${garage?.adresse || ''} ${garage?.code_postal || ''} ${garage?.ville || ''} - SIRET : ${garage?.siret || ''}`;
      doc.text(footerText, w / 2, pageH - 10, { align: 'center' });
      doc.setTextColor(0, 0, 0); // Reset couleur
    };

    // -- HELPER 3 : Blocs de signature professionnels fixes en bas --
    const printSignatures = (yPos = 235, showGarage = false) => {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      
      // Cadre Client
      doc.rect(marginX, yPos, 75, 35);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Signature du client`, marginX + 5, yPos + 6);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Bon pour accord. Fait le ${dateAuj}`, marginX + 5, yPos + 11);
      if (signatureDataUrl) {
        doc.addImage(signatureDataUrl, 'PNG', marginX + 10, yPos + 13, 50, 20);
      }

      // Cadre Garage (Optionnel)
      if (showGarage) {
        const cx = w - marginX - 37.5;
        const cy = yPos + 17.5;
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.ellipse(cx, cy, 35, 15);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('LE RÉPARATEUR', cx, cy - 6, { align: 'center' });
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(garage?.nom_garage || '', cx, cy, { align: 'center' });
        doc.text('SIRET: ' + (garage?.siret || ''), cx, cy + 5, { align: 'center' });
        doc.text('Contrat: ' + (dossier?.num_contrat || 'N/A'), cx, cy + 10, { align: 'center' });
      }
    };


    // ============================================================
    // PAGE 1 : DÉCLARATION DE SINISTRE
    // ============================================================
    let y = 20;

    // En-tête Client & Assurance
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`${client?.prenom || ''} ${client?.nom || ''}`, marginX, y);
    doc.text(`${assurance?.nom?.toUpperCase() || 'ASSURANCE'}`, w - marginX, y, { align: 'right' });
    y += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(client?.adresse || '', marginX, y);
    y += 5;
    doc.text(`${client?.code_postal || ''} ${client?.ville || ''}`, marginX, y);
    y += 5;
    doc.text(client?.telephone || '', marginX, y);
    y += 10;

    doc.text(`N° Contrat :`, marginX, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`${dossier.num_contrat || 'Non renseigné'}`, marginX + 22, y);
    doc.setFont('helvetica', 'normal');
    y += 5;

    doc.text(`N° Sinistre :`, marginX, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`${dossier.num_sinistre || 'Non renseigné'}`, marginX + 22, y);
    doc.setFont('helvetica', 'normal');
    y += 5;

    doc.text(`Date du sinistre :`, marginX, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`${dateSinistre}`, marginX + 30, y);
    doc.setFont('helvetica', 'normal');
    y += 10;

    // Ligne séparatrice
    doc.setDrawColor(200, 200, 200);
    doc.line(marginX, y, w - marginX, y);
    y += 8;

    // Info Véhicule
    doc.setFont('helvetica', 'bold');
    doc.text('Véhicule', marginX, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Marque / Modèle : ${dossier.modele_vehicule || ''}`, marginX, y);
    y += 5;
    doc.text(`Immatriculation : ${dossier.immatriculation || ''}`, marginX, y);
    y += 12;

    doc.line(marginX, y, w - marginX, y);
    y += 15;

    // Titre
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('DÉCLARATION DE SINISTRE', w / 2, y, { align: 'center' });
    y += 15;

    // Paragraphes fluides
    y = writeText('Madame, Monsieur,', y, 'normal', 10);
    y += 2;
    y = writeText(`Je soussigné ${client?.prenom} ${client?.nom} demeurant à ${client?.adresse || ''} ${client?.code_postal || ''} ${client?.ville || ''}, déclare que conformément à l'Arrêté du 29 décembre 2014 relatif aux modalités d'information de l'assuré au moment du sinistre et à l'article L.211-5-1 du code des assurances, j'ai la faculté de choisir librement le réparateur professionnel auquel je souhaite recourir.`, y);
    y = writeText(`Je déclare également que mon véhicule ${dossier.modele_vehicule}, immatriculé ${dossier.immatriculation}, assuré auprès de votre compagnie d'assurance (contrat n° ${dossier.num_contrat || '____________'}) a subi un ${dossier.raison_sinistre || 'bris de glace'} le ${dateSinistre}. Vitrage concerné : ${dossier.type_vitrage || 'Pare-brise'}.`, y);
    y = writeText(`Mon vitrage étant endommagé et altérant ma visibilité (R316-1 et R316-3 du code de la route), je suis dans l'obligation de le remplacer en urgence chez mon réparateur ${garage?.nom_garage}.`, y);
    y = writeText(`Une fois la prestation réalisée, je vous prie de procéder au règlement de l'indemnité me revenant directement entre les mains de mon réparateur.`, y);
    y = writeText(`Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.`, y);

    printSignatures(235, true);
    printFooter();


    // ============================================================
    // PAGE 2 : NOTIFICATION DE CESSION
    // ============================================================
    doc.addPage();
    y = 20;

    doc.setFont('helvetica', 'bold');
    doc.text(`${client?.prenom || ''} ${client?.nom || ''}`, marginX, y);
    doc.text(garage?.nom_garage || '', w - marginX, y, { align: 'right' });
    y += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.text(client?.adresse || '', marginX, y);
    doc.text(garage?.adresse || '', w - marginX, y, { align: 'right' });
    y += 5;
    
    doc.text(`${client?.code_postal || ''} ${client?.ville || ''}`, marginX, y);
    doc.text(`${garage?.code_postal || ''} ${garage?.ville || ''}`, w - marginX, y, { align: 'right' });
    y += 5;
    
    doc.text(client?.telephone || '', marginX, y);
    doc.text(`SIRET: ${garage?.siret || ''}`, w - marginX, y, { align: 'right' });
    y += 12;

    doc.line(marginX, y, w - marginX, y);
    y += 10;

    doc.setFont('helvetica', 'bold');
    doc.text(`${assurance?.nom?.toUpperCase() || 'ASSURANCE'}`, marginX, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(`Contrat n°`, marginX, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`${dossier.num_contrat || 'Non renseigné'}`, marginX + 18, y);
    doc.setFont('helvetica', 'normal');
    y += 5;
    doc.text(`Sinistre n°`, marginX, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`${dossier.num_sinistre || 'Non renseigné'}`, marginX + 18, y);
    doc.setFont('helvetica', 'normal');
    y += 5;
    doc.text(`Accident du`, marginX, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`${dateSinistre}`, marginX + 22, y);
    doc.setFont('helvetica', 'normal');
    y += 5;
    doc.text(`Nature du sinistre :`, marginX, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`${dossier.raison_sinistre || dossier.type_vitrage || 'Bris de glace'}`, marginX + 32, y);
    doc.setFont('helvetica', 'normal');
    y += 12;

    doc.setFont('helvetica', 'italic');
    doc.text(`RECOMMANDÉE avec A/R - Le ${dateAuj}`, w / 2, y, { align: 'center' });
    y += 15;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('NOTIFICATION DE CESSION DE CRÉANCE', w / 2, y, { align: 'center' });
    y += 15;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Objet : Notification d'une cession de créance`, marginX, y);
    y += 10;

    y = writeText('Madame, Monsieur,', y, 'normal', 10);
    y += 2;
    y = writeText(`Je vous adresse, ci-joint, une convention de cession de créance que j'ai consentie au garage ${garage?.nom_garage}, conformément aux dispositions du Code civil.`, y);
    y = writeText(`En application de l'ordonnance n°2016-131 du 10 février 2016, la présente lettre recommandée avec accusé de réception vaut notification et suffit à faire valoir la convention de cession de créance annexée. Je vous demande de procéder au règlement du montant des réparations directement entre les mains de mon réparateur professionnel.`, y);
    y = writeText(`N'ayant plus qualité pour percevoir ce paiement, je vous invite à régler la somme due exclusivement auprès du réparateur désigné, à qui j'ai conféré tous pouvoirs nécessaires pour le recouvrement.`, y);
    
    printSignatures(235, false);
    printFooter();


    // ============================================================
    // PAGE 3 : CONVENTION DE CESSION
    // ============================================================
    doc.addPage();
    y = 25;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('CONVENTION DE CESSION DE CRÉANCE', w / 2, y, { align: 'center' });
    y += 7;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('(Article 1321 du Code Civil)', w / 2, y, { align: 'center' });
    y += 15;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Entre le Client/Assuré et le Réparateur professionnel —`, marginX, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`${assurance?.nom?.toUpperCase() || '____________'}`, marginX + 90, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
    
    doc.text(`N° de contrat :`, marginX, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`${dossier.num_contrat || '____________'}`, marginX + 25, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`— N° de sinistre :`, marginX + 60, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`${dossier.num_sinistre || '____________'}`, marginX + 90, y);
    doc.setFont('helvetica', 'normal');
    y += 6;

    doc.text(`Sinistre du :`, marginX, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`${dateSinistre}`, marginX + 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`— Nature :`, marginX + 50, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`${dossier.raison_sinistre || dossier.type_vitrage || 'Bris de glace'}`, marginX + 70, y);
    doc.setFont('helvetica', 'normal');
    y += 10;

    const articles = [
      { title: "Article 1 : Nature de la cession", text: `L'assuré a subi un sinistre dont les réparations sont couvertes par la police d'assurance émise par la compagnie d'assurance dont les références figurent ci-dessus. L'assuré déclare détenir un droit à indemnisation au titre des garanties souscrites et s'engage par la présente convention à céder à son réparateur l'ensemble de ses droits à indemnisation en guise de paiement de la remise en état de son véhicule.` },
      { title: "Article 2 : Engagement du réparateur", text: "Le réparateur s'engage à effectuer toutes les réparations liées au sinistre et nécessaires à la remise en état du véhicule conformément à l'ordre de réparation établi." },
      { title: "Article 3 : Franchise", text: `L'assuré reste redevable de la franchise contractuelle d'un montant de ${dossier.franchise_montant || 0} €.` },
      { title: "Article 4 : Opposabilité de la cession", text: "Conformément à l'article 1324 du code civil, la présente cession devient opposable à la compagnie d'assurance et aux tiers à compter de sa notification. Dès cette date, seul le réparateur est habilité à percevoir les sommes dues." }
    ];

    for (const art of articles) {
      y = writeText(art.title, y, 'bold');
      y = writeText(art.text, y);
      y += 2;
    }

    printSignatures(235, true);
    printFooter();


    // ============================================================
    // PAGE 4 : ORDRE DE RÉPARATION
    // ============================================================
    doc.addPage();
    y = 25;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('ORDRE DE RÉPARATION', w / 2, y, { align: 'center' });
    y += 15;

    doc.setFontSize(10);
    doc.text('LE CLIENT', marginX, y);
    doc.text('LE RÉPARATEUR', w - marginX, y, { align: 'right' });
    y += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`${client?.prenom} ${client?.nom}`, marginX, y);
    doc.text(`${garage?.nom_garage}`, w - marginX, y, { align: 'right' });
    y += 5;
    
    doc.text(`${client?.adresse || ''}`, marginX, y);
    doc.text(`${garage?.adresse || ''}`, w - marginX, y, { align: 'right' });
    y += 5;
    
    doc.text(`${client?.code_postal || ''} ${client?.ville || ''}`, marginX, y);
    doc.text(`${garage?.code_postal || ''} ${garage?.ville || ''}`, w - marginX, y, { align: 'right' });
    y += 15;

    y = writeText(`Atteste avoir été informé du libre choix de mon réparateur (art. L. 211-5-1) et donne ordre de réparation au réparateur désigné ci-dessus pour l'exécution des travaux suivants :`, y);
    y += 2;
    
    y = writeText(`Intervention : ${dossier.type_vitrage || 'Remplacement Vitrage'}`, y, 'bold', 12);
    y += 5;
    
    y = writeText(`Marque/Modèle : ${dossier.modele_vehicule}`, y, 'normal', 10);
    y = writeText(`Immatriculation : ${dossier.immatriculation}`, y);
    y = writeText(`Km : ${dossier.kilometrage || 'Non renseigné'}`, y);
    y += 10;

    y = writeText(`En cas de non-paiement ou de résiliation anticipée du contrat avant indemnisation par mon assureur, je m'engage à régler l'intégralité des frais engagés.`, y);

    printSignatures(235, true);
    printFooter();

    // ============================================================
    // PAGE 5 : DÉCLARATION D'INTERVENTION
    // ============================================================
    doc.addPage();
    y = 20;

    doc.setFont('helvetica', 'bold');
    doc.text(`${client?.prenom || ''} ${client?.nom || ''}`, marginX, y);
    doc.text(garage?.nom_garage || '', w - marginX, y, { align: 'right' });
    y += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.text(client?.adresse || '', marginX, y);
    doc.text(garage?.adresse || '', w - marginX, y, { align: 'right' });
    y += 5;
    
    doc.text(`${client?.code_postal || ''} ${client?.ville || ''}`, marginX, y);
    doc.text(`${garage?.code_postal || ''} ${garage?.ville || ''}`, w - marginX, y, { align: 'right' });
    y += 12;

    doc.line(marginX, y, w - marginX, y);
    y += 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Objet : Déclaration d'intervention pour impact ${dossier.type_vitrage || 'Pare-brise'}.`, marginX, y);
    y += 10;

    y = writeText('Madame, Monsieur,', y, 'normal', 10);
    y += 2;
    y = writeText(`Je soussigné(e) ${client?.prenom} ${client?.nom} déclare avoir reçu un impact sur le ${dossier.type_vitrage || 'Pare-brise'} de mon véhicule ${dossier.modele_vehicule} immatriculé ${dossier.immatriculation}, assuré auprès de ${assurance?.nom || '________'} (n° de police ${dossier.num_contrat || ''}, n° de sinistre ${dossier.num_sinistre || ''}).`, y);
    y = writeText(`Je déclare à ce jour avoir fait intervenir la société ${garage?.nom_garage} pour remplacer ${dossier.type_vitrage || 'Pare-brise'}.`, y);
    y = writeText(`Adresse d'intervention : ${client?.adresse || ''} , ${client?.code_postal || ''} ${client?.ville || ''} .`, y);
    y = writeText(`En cas de non-paiement ou de résiliation anticipée du contrat avant indemnisation par mon assureur, je m'engage à régler l'intégralité des frais engagés pour le remplacement. Le montant dû me sera communiqué par facture.`, y);
    y = writeText(`Je certifie sur l'honneur avoir signé la cession de créance le ${dateAuj}.`, y);
    y = writeText(`Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.`, y);

    printSignatures(235, false);
    printFooter();

    return doc;
  };

