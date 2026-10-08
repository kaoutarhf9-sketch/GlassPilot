import sharp from 'sharp';
import Tesseract from 'tesseract.js';
import { extractDocumentData } from './test_extractor_v2.js';

const imgPath = 'C:/Users/K.Hanafi/.gemini/antigravity/brain/d5801a19-e044-47f9-a1ed-155f8fe3a2be/.user_uploaded/media_1791290951270.jpg';

(async () => {
  const meta = await sharp(imgPath).metadata();

  // Upscale 3.5x with thresholding
  const processed = await sharp(imgPath)
    .resize(Math.round(meta.width * 3.5), null, { kernel: 'lanczos3' })
    .threshold(175)
    .png()
    .toBuffer();

  const worker = await Tesseract.createWorker('fra');
  await worker.setParameters({
    tessedit_pageseg_mode: '11',
  });
  const res = await worker.recognize(processed);
  await worker.terminate();

  console.log('--- RAW PSM 11 OCR TEXT ---');
  console.log(res.data.text);
  console.log('---------------------------');

  const result = extractDocumentData(res.data.text);
  console.log('FINAL EXTRACTED:', result);
})();
