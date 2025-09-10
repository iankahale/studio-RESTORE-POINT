import { firestore } from './firebase';

export async function getShipmentById(id: string) {
  try {
    const doc = await firestore.collection('shipments').doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('Firestore Error:', error);
    throw error;
  }
}