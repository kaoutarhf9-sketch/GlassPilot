const fs = require('fs');

async function testApi() {
  try {
    // Generate a simple 1x1 JPEG in base64
    const base64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
    
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    // Instead of using the browser File/FormData, we use node-fetch and standard FormData
    // Since we are in Node, let's just make a POST request with the raw body to a test endpoint
    // Or just use the native FormData (available in Node 18+)
    
    const formData = new FormData();
    const blob = new Blob([u8arr], { type: mime });
    formData.append('file', blob, 'test.jpg');
    formData.append('type', 'attestation_assurance');
    
    console.log("Sending POST request to http://localhost:3000/api/ocr");
    const res = await fetch('http://localhost:3000/api/ocr', {
      method: 'POST',
      body: formData
    });
    
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text);
    
  } catch (err) {
    console.error("Test failed:", err);
  }
}

testApi();
