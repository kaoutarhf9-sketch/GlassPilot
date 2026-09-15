async function testBucket() {
  const url = 'https://snncnsmkoatduwfjpuna.supabase.co/storage/v1/object/public/documents/test.txt';
  const res = await fetch(url);
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response:", text);
}
testBucket();
