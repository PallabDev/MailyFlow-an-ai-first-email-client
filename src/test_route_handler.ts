import { GET } from './app/api/emails/route';
import { NextRequest } from 'next/server';

async function main() {
  console.log("Invoking API handler GET...");
  try {
    const req = new NextRequest('http://localhost:3000/api/emails?limit=2&folder=inbox');
    const response = await GET(req);
    console.log("Status:", response.status);
    const data = await response.json();
    console.log("Data emails:", JSON.stringify(data.emails, null, 2));
  } catch (error) {
    console.error("Error invoking route handler:", error);
  }
}

main();
