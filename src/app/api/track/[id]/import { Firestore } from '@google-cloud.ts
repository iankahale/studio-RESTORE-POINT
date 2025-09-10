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