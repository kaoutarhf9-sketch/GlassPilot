const Tesseract = require('tesseract.js');
const fs = require('fs');

async function testOcr() {
  console.log("Creating worker...");
  try {
    const worker = await Tesseract.createWorker('fra', 1, {
      logger: m => console.log(m)
    });
    console.log("Worker created successfully!");
    
    // Create a dummy image
    // We don't need a real image, we just want to see if createWorker fails.
    await worker.terminate();
  } catch (err) {
    console.error("FAILED:", err);
  }
}

testOcr();
