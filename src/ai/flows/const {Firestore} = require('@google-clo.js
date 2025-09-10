const {Firestore} = require('@google-cloud/firestore');

// Load service account from environment variable
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);

// Initialize Firestore
const firestore = new Firestore({
  projectId: serviceAccount.project_id,
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
});

export default async function handler(req, res) {
  try {
    const snapshot = await firestore.collection('users').get();
    const users = snapshot.docs.map(doc => doc.data());
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}