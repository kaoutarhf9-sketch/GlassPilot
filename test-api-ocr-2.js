const fs = require('fs');

async function testApi() {
  try {
    // Generate a 1280x720 red JPEG image encoded in base64
    // Using a minimal JPEG structure or just let's create a Buffer
    // Actually, I can just read a dummy file if one exists, but let's use the one from before
    const base64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
    
    // The previous 1x1 image crashed Tesseract internally and timed out. Let's see what happens.
    
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    const formData = new FormData();
    const blob = new Blob([u8arr], { type: mime });
    formData.append('file', blob, 'test.jpg');
    formData.append('type', 'attestation_assurance');
    
    console.log("Sending POST request to http://localhost:3000/api/ocr");
    const res = await fetch('http://localhost:3000/api/ocr', {
      method: 'POST',
      body: formData
    });
    
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
    
  } catch (err) {
    console.error("Test failed:", err);
  }
}

testApi();
