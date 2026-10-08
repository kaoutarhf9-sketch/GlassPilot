import sharp from 'sharp';
import Tesseract from 'tesseract.js';
import { extractDocumentData } from './test_extractor_v2.js';

const imgPath = 'C:/Users/K.Hanafi/.gemini/antigravity/brain/d5801a19-e044-47f9-a1ed-155f8fe3a2be/.user_uploaded/media_1791290951270.jpg';

(async () => {
  try {
    console.log('Testing end-to-end OCR with sharp preprocessing...');
    const meta = await sharp(imgPath).metadata();

    // 1. Preprocess: upscale so characters are legible by Tesseract
    const targetWidth = Math.max(meta.width * 2.5, 1800);
    const processedBuf = await sharp(imgPath)
      .resize(Math.round(targetWidth), null, { kernel: 'lanczos3' })
      .grayscale()
      .normalize()
      .sharpen()
      .threshold(175) // binarize to clean up background artifacts
      .png()
      .toBuffer();

    console.log('Image preprocessed. Running Tesseract...');
    const worker = await Tesseract.createWorker('fra');
    // Mode 11 or 3
    await worker.setParameters({
      tessedit_pageseg_mode: '11',
    });

    const ret = await worker.recognize(processedBuf);
    await worker.terminate();

    console.log('--- RECOGNIZED TEXT LENGTH:', ret.data.text.length);
    const data = extractDocumentData(ret.data.text);
    console.log('--- EXTRACTED RESULT ---', data);
  } catch (err) {
    console.error('Error:', err);
  }
})();
