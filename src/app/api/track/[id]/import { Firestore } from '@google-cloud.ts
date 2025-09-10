import { Firestore } from '@google-cloud/firestore';

if (!process.env.SERVICE_ACCOUNT_JSON) {
  throw new Error('Missing SERVICE_ACCOUNT_JSON environment variable');
}

const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);

export const firestore = new Firestore({
  projectId: serviceAccount.project_id,
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
});