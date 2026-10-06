import { NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';
import { extractDocumentData } from '@/lib/extractDocumentData';
const PDFParser = require("pdf2json");

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const nodeBuffer = Buffer.from(buffer);

    let text = "";

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      console.log(`[OCR] Extraction texte du PDF natif: ${file.name}`);
      try {
        text = await new Promise((resolve, reject) => {
          const pdfParser = new PDFParser(null, 1);
          pdfParser.on("pdfParser_dataError", errData => reject(errData.parserError));
          pdfParser.on("pdfParser_dataReady", () => {
            try {
              const raw = pdfParser.getRawTextContent();
              resolve(raw ? decodeURIComponent(raw) : "");
            } catch (e) {
              resolve(pdfParser.getRawTextContent() || "");
            }
          });
          pdfParser.parseBuffer(nodeBuffer);
        });
      } catch (err) {
        console.error("Erreur lecture PDF:", err);
      }
    }

    // Si le texte est vide (image ou PDF scanné sans texte sélectionnable)
    if (!text || text.trim().length === 0) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        console.log(`[OCR] Lancement Tesseract pour image...`);
        const ocrPromise = new Promise(async (resolve, reject) => {
          let worker;
          try {
            worker = await Tesseract.createWorker('fra');
            const ret = await worker.recognize(nodeBuffer);
            await worker.terminate();
            resolve(ret.data.text);
          } catch (err) {
            if (worker) await worker.terminate().catch(e => console.error(e));
            reject(err);
          }
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout OCR (20s)")), 20000)
        );

        try {
          text = await Promise.race([ocrPromise, timeoutPromise]);
        } catch (err) {
          console.warn("[OCR] Tesseract timeout ou erreur:", err.message);
        }
      }
    }

    console.log(`[OCR] Longueur texte extrait: ${text.length}`);
    const extractedData = extractDocumentData(text || "");

    return NextResponse.json({
      success: true,
      rawText: text ? text.substring(0, 500) : "",
      ...extractedData
    });

  } catch (error) {
    console.error("Erreur API OCR:", error);
    return NextResponse.json({ error: "Erreur lors de l'analyse du document" }, { status: 500 });
  }
}