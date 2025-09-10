import { NextResponse } from 'next/server';
import { Firestore } from '@google-cloud/firestore';

let cached: Firestore | null = null;

export function getFirestoreInstance(): Firestore {
  if (cached) return cached;

  const raw = process.env.SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error('Missing SERVICE_ACCOUNT_JSON environment variable');
  }

  const serviceAccount = typeof raw === 'string' ? JSON.parse(raw) : raw;

  // Repair private_key newlines if they were escaped when stored
  const privateKey = (serviceAccount.private_key || '').replace(/\\n/g, '\n');

  cached = new Firestore({
    projectId: serviceAccount.project_id,
    credentials: {
      client_email: serviceAccount.client_email,
      private_key: privateKey,
    },
  });

  return cached;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const firestore = getFirestoreInstance();
    const doc = await firestore.collection('shipments').doc(id).get();
    if (!doc.exists) return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (error: any) {
    console.error('API Error:', error.message || error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}