const fs = require('fs');

let content = fs.readFileSync('lib/pdfGenerator.js', 'utf8');

const regex = /\/\/ Cadre Garage \(Optionnel\)[\s\S]*?\/\/ ============================================================/m;

const newText = `// Cadre Garage (Optionnel)
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


    // ============================================================`;

content = content.replace(regex, newText);

fs.writeFileSync('lib/pdfGenerator.js', content);
console.log('Done!');
