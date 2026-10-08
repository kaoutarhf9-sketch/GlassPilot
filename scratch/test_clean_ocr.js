import sharp from 'sharp';
import Tesseract from 'tesseract.js';
import { extractDocumentData } from './test_extractor_v2.js';

const imgPath = 'C:/Users/K.Hanafi/.gemini/antigravity/brain/d5801a19-e044-47f9-a1ed-155f8fe3a2be/.user_uploaded/media_1791290951270.jpg';

(async () => {
  const meta = await sharp(imgPath).metadata();

  // Test 1: Grayscale + normalize + linear contrast
  const buf1 = await sharp(imgPath)
    .resize(Math.round(meta.width * 3), null, { kernel: 'lanczos3' })
    .grayscale()
    .normalize()
    .linear(1.2, -10)
    .png()
    .toBuffer();

  const worker = await Tesseract.createWorker('fra');
  // Default automatic PSM 3
  const res = await worker.recognize(buf1);
  await worker.terminate();

  console.log('--- TEXT WITH LINEAR CONTRAST (PSM 3) ---');
  console.log(res.data.text.substring(0, 1500));
  console.log('--- EXTRACTED ---');
  console.log(extractDocumentData(res.data.text));
})();
