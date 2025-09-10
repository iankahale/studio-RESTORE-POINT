import { NextResponse } from 'next/server';
import { Firestore } from '@google-cloud/firestore';

const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);

const firestore = new Firestore({
  projectId: serviceAccount.project_id,
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
});

export async function GET(request, { params }) {
  try {
    const doc = await firestore.collection('track').doc(params.id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(doc.data());
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}