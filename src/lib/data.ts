'use server';

import type { AdminUser, Shipment, ShipmentUpdatePayload, PackingListForm, PackingListSubmission, AuctionItem, ChatMessage, FormField, SubmissionData, Permission, AuctionItemStatus, Bid, Bidder, ProfileUpdatePayload, AuctionItemCategory } from './types';
import { db } from './firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { collection, query, where, limit, getDocs } from "firebase/firestore";

const ADMIN_COLLECTION = 'admins';
const SHIPMENT_COLLECTION = 'shipments';
const PACKING_LIST_FORM_COLLECTION = 'packingListForms';
const AUCTION_ITEM_COLLECTION = 'auctionItems';
const CHAT_MESSAGE_COLLECTION = 'chatMessages';

// Helper to convert Firestore Timestamps to ISO strings
const convertTimestamps = (docData: any): any => {
    if (!docData) return docData;

    if (Array.isArray(docData)) {
        return docData.map(item => convertTimestamps(item));
    }

    if (docData instanceof Timestamp) {
        return docData.toDate().toISOString();
    }
    
    if (typeof docData === 'object' && docData !== null && Object.prototype.toString.call(docData) !== '[object Date]') {
        const newObj: { [key: string]: any } = {};
        for (const key in docData) {
            newObj[key] = convertTimestamps(docData[key]);
        }
        return newObj;
    }
    
    return docData;
};


// Seeding the first admin user if none exist
(async () => {
    try {
        const bblAdminRef = db.collection(ADMIN_COLLECTION).doc('default-super-admin-bbl');
        const bblAdminDoc = await bblAdminRef.get();

        if (!bblAdminDoc.exists) {
            console.log("No default admin 'BBL Group' found, creating...");
            const bblAdmin: Omit<AdminUser, 'id'> = {
                name: 'BBL Group',
                email: 'bblgroup@protonmail.com',
                role: 'Admin',
                password: 'Tsoka0000@#',
                avatarUrl: `https://placehold.co/100x100/7C3AED/FFFFFF/png?text=B`,
                permissions: ['dashboard', 'tracking', 'packing-list', 'auction-listing', 'chat', 'settings'],
            };
            await bblAdminRef.set(bblAdmin);
             console.log("Default super admin 'BBL Group' created.");
        }
    } catch (error) {
        console.error("Error seeding admin user:", error);
    }
})();

export async function getShipments(): Promise<Shipment[]> {
    const q = db.collection(SHIPMENT_COLLECTION).orderBy('lastUpdate', 'desc');
    const snapshot = await q.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) } as Shipment));
}

export async function getShipmentById(id: string): Promise<Shipment | undefined> {
    const searchTerm = decodeURIComponent(id).toLowerCase();
    
    // We will query by the auto-generated BBL-XXXXXX ID first (case-sensitive for ID)
    const docRef = db.collection(SHIPMENT_COLLECTION).doc(id);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
        return { id: docSnap.id, ...convertTimestamps(docSnap.data()) } as Shipment;
    }

    // Fallback to secondary numbers if no direct ID match
    const queries = [
        db.collection(SHIPMENT_COLLECTION).where('consignmentNumberLower', '==', searchTerm),
        db.collection(SHIPMENT_COLLECTION).where('shakersNumberLower', '==', searchTerm),
        db.collection(SHIPMENT_COLLECTION).where('clientNameLower', '==', searchTerm),
        db.collection(SHIPMENT_COLLECTION).where('clientEmail', '==', searchTerm)
    ];
    
    for (const q of queries) {
        const snapshot = await q.get();
        if (!snapshot.empty) {
            // In case of multiple matches (e.g., same name), return the most recent one.
            const doc = snapshot.docs.sort((a,b) => b.data().lastUpdate.toMillis() - a.data().lastUpdate.toMillis())[0];
            return { id: doc.id, ...convertTimestamps(doc.data()) } as Shipment;
        }
    }

    return undefined;
}

export async function addShipment(shipment: Omit<Shipment, 'id' | 'history' | 'lastUpdate'>): Promise<Shipment> {
    const trackingId = `BBL-${Math.floor(100000 + Math.random() * 900000)}`;

    const newShipmentData = {
        ...shipment,
        id: trackingId,
        lastUpdate: Timestamp.now(),
        consignmentNumberLower: shipment.consignmentNumber?.toLowerCase() || '',
        shakersNumberLower: shipment.shakersNumber?.toLowerCase() || '',
        clientNameLower: shipment.clientName?.toLowerCase() || '',
        history: [
            {
                status: 'Pending',
                date: Timestamp.now(),
                location: shipment.origin,
                remarks: 'Shipment created.',
            },
        ],
    };

    const docRef = db.collection(SHIPMENT_COLLECTION).doc(trackingId);
    await docRef.set(newShipmentData);

    // DEVELOPER NOTE: This simulates sending an email notification.
    // Replace this with your actual email service integration (e.g., SendGrid, Mailgun).
    if (shipment.clientEmail) {
        console.log(`(Simulated) Sending 'Shipment Created' email to ${shipment.clientEmail}. Tracking ID: ${trackingId}`);
    }
    
    const createdShipment = { 
        ...convertTimestamps(newShipmentData)
    } as Shipment;

    return createdShipment;
}

export async function updateShipment(id: string, updateData: ShipmentUpdatePayload): Promise<Shipment | undefined> {
    const docRef = db.collection(SHIPMENT_COLLECTION).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) return undefined;

    const originalShipment = docSnap.data() as any;

    const payload: { [key: string]: any } = {
        description: updateData.description,
        destination: updateData.destination,
        estimatedDeliveryDate: updateData.estimatedDeliveryDate,
        status: updateData.status,
        lastUpdate: Timestamp.now(),
        history: originalShipment.history || []
    };

    if (updateData.status && updateData.status !== originalShipment.status) {
        payload.history.unshift({
            status: updateData.status,
            date: Timestamp.now(),
            location: updateData.location || 'N/A',
            remarks: updateData.remarks || 'Status updated.',
        });

        // DEVELOPER NOTE: This simulates sending an email notification.
        // Replace this with your actual email service integration (e.g., SendGrid, Mailgun).
        if (originalShipment.clientEmail) {
            console.log(`(Simulated) Sending 'Status Update' email to ${originalShipment.clientEmail}. Your shipment ${id} is now: ${updateData.status}`);
        }
    }

    await docRef.update(payload);
    const updatedDoc = await docRef.get();
    return { id: updatedDoc.id, ...convertTimestamps(updatedDoc.data()) } as Shipment;
}

export async function deleteShipments(ids: string[]): Promise<void> {
    if (ids.length === 0) {
        return;
    }
    const batch = db.batch();
    ids.forEach(id => {
        const docRef = db.collection(SHIPMENT_COLLECTION).doc(id);
        batch.delete(docRef);
    });
    await batch.commit();
}


export async function getAdmins(): Promise<AdminUser[]> {
    const snapshot = await db.collection(ADMIN_COLLECTION).orderBy('name').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) } as AdminUser));
}

export async function getAdminById(id: string): Promise<AdminUser | undefined> {
    const docRef = db.collection(ADMIN_COLLECTION).doc(id);
    const docSnap = await docRef.get();
    return docSnap.exists ? { id: docSnap.id, ...convertTimestamps(docSnap.data()) } as AdminUser : undefined;
}

export async function getAdminByEmail(email: string): Promise<AdminUser | undefined> {
    const snapshot = await db.collection(ADMIN_COLLECTION)
        .where('email', '==', email.toLowerCase())
        .limit(1)
        .get();
    if (snapshot.empty) return undefined;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as AdminUser;
}

export async function addAdmin(admin: Omit<AdminUser, 'id' | 'role' | 'password' | 'permissions' | 'avatarUrl' | 'invitationGeneratedAt'>): Promise<AdminUser> {
    const existingAdmin = await getAdminByEmail(admin.email);
    if (existingAdmin) {
        // If the pending admin already exists, just update their invitation timestamp.
        if (existingAdmin.role === 'Pending') {
            const updatedAdminData = { invitationGeneratedAt: Timestamp.now() };
            await db.collection(ADMIN_COLLECTION).doc(existingAdmin.id).update(updatedAdminData);
            return { ...existingAdmin, ...convertTimestamps(updatedAdminData) };
        }
        throw new Error("An admin with this email already exists.");
    }
    
    const newAdminData: Omit<AdminUser, 'id'> = {
      ...admin,
      email: admin.email.toLowerCase(),
      role: 'Pending',
      permissions: [],
      avatarUrl: `https://placehold.co/100x100/7C3AED/FFFFFF/png?text=${admin.name.charAt(0)}`,
      invitationGeneratedAt: Timestamp.now().toDate().toISOString(),
    };
    const docRef = await db.collection(ADMIN_COLLECTION).add(newAdminData);
    
    const createdAdmin = { ...convertTimestamps(newAdminData), id: docRef.id } as AdminUser;

    // DEVELOPER NOTE: Integrate your email service here.
    const setPasswordLink = `/set-password/${docRef.id}`;
    console.log(`(Simulated) Sending 'Set Password' email to ${createdAdmin.email} with link: ${setPasswordLink}`);

    return createdAdmin;
}

export async function setAdminPassword(id: string, password: string): Promise<AdminUser | undefined> {
    const docRef = db.collection(ADMIN_COLLECTION).doc(id);
    await docRef.update({ password, invitationGeneratedAt: null }); // Clear the invitation timestamp
    
    console.log(`(Simulated) Sending 'Ready for Approval' email to the main admin.`);
    return getAdminById(id);
}

export async function approveAdmin(id: string): Promise<AdminUser | undefined> {
    const docRef = db.collection(ADMIN_COLLECTION).doc(id);
    const adminDoc = await docRef.get();
    const adminData = adminDoc.data();

    if (!adminDoc.exists || !adminData?.password) {
         console.error("Approval failed: Admin not found or password not set.");
         return undefined;
    }
    if (adminData.role !== 'Pending') {
        console.warn(`Admin ${id} is already in role ${adminData.role}. No action taken.`);
        return { id: adminDoc.id, ...convertTimestamps(adminData) } as AdminUser;
    }
    
    // Assign only default permissions on approval. Super admin must grant more.
    const permissions: Permission[] = ['dashboard', 'chat'];
    await docRef.update({ role: 'Admin', permissions });
    
    console.log(`(Simulated) Sending 'Admin Approval' email to ${adminData?.email}`);
    return getAdminById(id);
}

export async function removeAdmin(id: string): Promise<void> {
    await db.collection(ADMIN_COLLECTION).doc(id).delete();
}


export async function updateAdminPermissions(id: string, permissions: Permission[]): Promise<AdminUser | undefined> {
    await db.collection(ADMIN_COLLECTION).doc(id).update({ permissions });
    return getAdminById(id);
}

export async function updateAdminProfile(id: string, data: Partial<Pick<AdminUser, 'avatarUrl'>>): Promise<AdminUser | undefined> {
    const docRef = db.collection(ADMIN_COLLECTION).doc(id);
    await docRef.update(data);
    return getAdminById(id);
}

export async function updateMyProfile(id: string, data: ProfileUpdatePayload): Promise<AdminUser | undefined> {
    const docRef = db.collection(ADMIN_COLLECTION).doc(id);
    const updateData: { [key: string]: any } = {};

    if (data.password && data.currentPassword) {
        const userDoc = await docRef.get();
        const user = userDoc.data() as AdminUser;
        if (user.password !== data.currentPassword) {
            throw new Error("Incorrect current password.");
        }
        updateData.password = data.password;
    }
    
    if (data.name) updateData.name = data.name;
    if (data.avatarUrl) updateData.avatarUrl = data.avatarUrl;
    
    if (Object.keys(updateData).length > 0) {
        await docRef.update(updateData);
    }
    
    return getAdminById(id);
}


export async function getPackingListForms(): Promise<PackingListForm[]> {
    const q = db.collection(PACKING_LIST_FORM_COLLECTION).orderBy('createdAt', 'desc');
    const snapshot = await q.get();
    const forms = await Promise.all(snapshot.docs.map(async (doc) => {
        const formData = doc.data();
        const submissionsSnapshot = await doc.ref.collection('submissions').orderBy('date', 'desc').get();
        const submissions = submissionsSnapshot.docs.map(subDoc => ({ id: subDoc.id, ...convertTimestamps(subDoc.data()) } as PackingListSubmission));
        return { id: doc.id, ...convertTimestamps(formData), submissions } as PackingListForm;
    }));
    return forms;
}

export async function getPackingListFormById(id: string): Promise<PackingListForm | undefined> {
    const docRef = db.collection(PACKING_LIST_FORM_COLLECTION).doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return undefined;

    const submissionsSnapshot = await docRef.collection('submissions').orderBy('date', 'desc').get();
    const submissions = submissionsSnapshot.docs.map(subDoc => ({ id: subDoc.id, ...convertTimestamps(subDoc.data()) } as PackingListSubmission));
    
    return { id: docSnap.id, ...convertTimestamps(docSnap.data()), submissions } as PackingListForm;
}

export async function createPackingListForm(data: Omit<PackingListForm, 'id' | 'submissions' | 'createdAt'>): Promise<PackingListForm> {
    const newFormData = { ...data, createdAt: Timestamp.now() };
    const docRef = await db.collection(PACKING_LIST_FORM_COLLECTION).add(newFormData);
    return { ...convertTimestamps(newFormData), id: docRef.id, submissions: [] } as PackingListForm;
}

export async function addPackingListSubmission(formId: string, submissionData: { submitter: {name: string, email: string}, data: SubmissionData }): Promise<PackingListSubmission> {
    const formRef = db.collection(PACKING_LIST_FORM_COLLECTION).doc(formId);
    const formDoc = await formRef.get();
    if (!formDoc.exists) {
        throw new Error("Form not found");
    }
    const formData = formDoc.data() as Omit<PackingListForm, 'id' | 'submissions'>;

    const newSubmissionData = {
        ...submissionData,
        date: Timestamp.now(),
    };
    const subCollectionRef = formRef.collection('submissions');
    const docRef = await subCollectionRef.add(newSubmissionData);

    const firstItemDescription = Object.values(submissionData.data)[0] as string;
    const shipmentDescription = `Packing list for ${formData.title}: ${firstItemDescription}...`;
    
    const tempShipment = await addShipment({
        clientName: submissionData.submitter.name,
        clientEmail: submissionData.submitter.email,
        consignmentNumber: formData.trackingNumber?.type === 'consignment' ? formData.trackingNumber.number : '',
        shakersNumber: formData.trackingNumber?.type === 'shakers' ? formData.trackingNumber.number : '',
        description: shipmentDescription,
        origin: 'Dubai',
        destination: 'Zimbabwe',
        shippingCompany: 'Beyond Borders Logistics',
        estimatedDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Pending',
    });
    
    console.log(`(Simulated) Auto-created shipment ${tempShipment.id} for ${submissionData.submitter.name}`);

    return { id: docRef.id, formId, ...submissionData, date: newSubmissionData.date.toDate().toISOString() };
}

export async function deletePackingListSubmissions(formId: string, submissionIds: string[]): Promise<void> {
    if (submissionIds.length === 0) {
        return;
    }
    const batch = db.batch();
    const formSubmissionsRef = db.collection(PACKING_LIST_FORM_COLLECTION).doc(formId).collection('submissions');
    submissionIds.forEach(id => {
        const docRef = formSubmissionsRef.doc(id);
        batch.delete(docRef);
    });
    await batch.commit();
}


export async function getAuctionItems(): Promise<AuctionItem[]> {
    const q = db.collection(AUCTION_ITEM_COLLECTION).orderBy('createdAt', 'desc');
    const snapshot = await q.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) } as AuctionItem));
}

async function getAuctionItemById(id: string): Promise<AuctionItem | undefined> {
    const docRef = db.collection(AUCTION_ITEM_COLLECTION).doc(id);
    const docSnap = await docRef.get();
    return docSnap.exists ? { id: docSnap.id, ...convertTimestamps(docSnap.data()) } as AuctionItem : undefined;
}

export async function addAuctionItem(item: Pick<AuctionItem, 'name' | 'description' | 'price' | 'imageUrls' | 'category' | 'status' | 'quantity'>): Promise<AuctionItem> {
    const newItemData: Omit<AuctionItem, 'id'> = {
      ...item,
      status: item.status || 'Listed',
      createdAt: Timestamp.now().toDate().toISOString(),
      bidHistory: [],
    };
    const docRef = await db.collection(AUCTION_ITEM_COLLECTION).add(newItemData);
    return { ...convertTimestamps(newItemData), id: docRef.id } as AuctionItem;
}

export async function addAuctionItemsBatch(items: Pick<AuctionItem, 'name' | 'description' | 'price' | 'imageUrls' | 'category' | 'status' | 'quantity'>[]): Promise<AuctionItem[]> {
    const collectionRef = db.collection(AUCTION_ITEM_COLLECTION);
    const newItems: AuctionItem[] = [];

    // Firestore batch supports max 500 operations.
    const chunks = [];
    for (let i = 0; i < items.length; i += 500) {
        chunks.push(items.slice(i, i + 500));
    }

    for (const chunk of chunks) {
        const batch = db.batch();
        const chunkNewItems: Omit<AuctionItem, 'id'>[] = [];

        chunk.forEach(item => {
            const docRef = collectionRef.doc(); // Create a new document reference with an auto-generated ID
            const newItemData: Omit<AuctionItem, 'id'> = {
                ...item,
                status: item.status || 'Listed',
                createdAt: Timestamp.now().toDate().toISOString(),
                bidHistory: [],
            };
            batch.set(docRef, newItemData);
            chunkNewItems.push({ ...newItemData, id: docRef.id });
        });

        await batch.commit();
        // After commit, convert timestamps for the returned data
        newItems.push(...chunkNewItems.map(item => convertTimestamps(item) as AuctionItem));
    }

    return newItems;
}


export async function updateAuctionItem(id: string, data: Partial<Omit<AuctionItem, 'id'>>): Promise<AuctionItem | undefined> {
    const docRef = db.collection(AUCTION_ITEM_COLLECTION).doc(id);
    await docRef.update(data);
    return getAuctionItemById(id);
}

export async function deleteAuctionItems(ids: string[]): Promise<void> {
    if (ids.length === 0) {
        return;
    }
    const batch = db.batch();
    ids.forEach(id => {
        const docRef = db.collection(AUCTION_ITEM_COLLECTION).doc(id);
        batch.delete(docRef);
    });
    await batch.commit();
}

export async function publishAuctionItems(ids: string[]): Promise<void> {
    if (ids.length === 0) {
        return;
    }
    const batch = db.batch();
    ids.forEach(id => {
        const docRef = db.collection(AUCTION_ITEM_COLLECTION).doc(id);
        batch.update(docRef, { status: 'Listed' });
    });
    await batch.commit();
}

export async function placeBidOnItem(id: string, bidAmount: number, bidder: Bidder): Promise<AuctionItem | undefined> {
    const docRef = db.collection(AUCTION_ITEM_COLLECTION).doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) throw new Error("Item not found");

    const item = docSnap.data() as AuctionItem;
    const currentBid = item.currentBid || item.price;
    if (bidAmount <= currentBid) {
        throw new Error("Bid must be higher than the current price.");
    }
    
    const newBid: Bid = {
        amount: bidAmount,
        bidder: bidder,
        timestamp: Timestamp.now().toDate().toISOString()
    }

    const newHistory = item.bidHistory ? [...item.bidHistory, newBid] : [newBid];

    await docRef.update({
        currentBid: bidAmount,
        status: 'BidOn',
        highestBidder: bidder,
        bidHistory: newHistory
    });

    const updatedDoc = await docRef.get();
    return { id: updatedDoc.id, ...convertTimestamps(updatedDoc.data()) } as AuctionItem;
}

export async function finalizeAuctionItem(id: string): Promise<AuctionItem | undefined> {
    const docRef = db.collection(AUCTION_ITEM_COLLECTION).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
        throw new Error("Item not found");
    }

    const item = docSnap.data() as AuctionItem;
    if (item.status !== 'BidOn' || !item.highestBidder) {
        throw new Error("This item has no bids or has already been sold.");
    }

    await docRef.update({ status: 'Sold' });
    
    // DEVELOPER NOTE: Integrate your email service here.
    console.log(`(Simulated) Sending 'Congratulations & Pay Now' email to ${item.highestBidder.email} for item "${item.name}".`);
    
    return getAuctionItemById(id);
}


// Chat Functions
const tagRegex = /(#BBL-[\w-]+|#auc-[\w-]+|#insights|#tracking|#packing-list|#auction-listing|#settings)/g;

const menuTagMap: Record<string, string> = {
    '#insights': '/admin',
    '#tracking': '/admin/tracking',
    '#packing-list': '/admin/packing-list',
    '#auction-listing': '/admin/auction-listing',
    '#settings': '/admin/settings',
};

function renderMessage(message: string): string {
    return message.replace(tagRegex, (match) => {
        const linkClass = "text-accent underline hover:text-accent/80";
        if (match.startsWith('#BBL-')) {
            const id = match.substring(1);
            return `<a href="/track/${id}" target="_blank" class="${linkClass}">${match}</a>`;
        }
        if (match.startsWith('#auc-')) {
            return `<a href="/auction" class="${linkClass}">${match}</a>`;
        }
        if (menuTagMap[match]) {
            return `<a href="${menuTagMap[match]}" class="${linkClass}">${match}</a>`;
        }
        return match;
    });
}

export async function getChatMessages(): Promise<ChatMessage[]> {
    const q = db.collection(CHAT_MESSAGE_COLLECTION).orderBy('timestamp', 'asc');
    const snapshot = await q.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) } as ChatMessage));
}

export async function addChatMessage(message: string, adminEmail: string): Promise<ChatMessage> {
    const admin = await getAdminByEmail(adminEmail);
    if (!admin) throw new Error("Admin not found");

    const newMessageData = {
        adminId: admin.id,
        adminName: admin.name,
        avatarUrl: admin.avatarUrl,
        message,
        messageHtml: renderMessage(message),
        timestamp: Timestamp.now(),
    };
    const docRef = await db.collection(CHAT_MESSAGE_COLLECTION).add(newMessageData);
    return { ...convertTimestamps(newMessageData), id: docRef.id };
}

export async function updateChatMessage(id: string, message: string): Promise<ChatMessage | undefined> {
    const docRef = db.collection(CHAT_MESSAGE_COLLECTION).doc(id);
    await docRef.update({
        message,
        messageHtml: renderMessage(message),
    });
    const updatedDoc = await docRef.get();
    return { id: updatedDoc.id, ...convertTimestamps(updatedDoc.data()) } as ChatMessage;
}

export async function deleteChatMessage(id: string): Promise<void> {
    await db.collection(CHAT_MESSAGE_COLLECTION).doc(id).delete();
}

export async function clearChatHistory(): Promise<void> {
    const snapshot = await db.collection(CHAT_MESSAGE_COLLECTION).get();
    if (snapshot.empty) {
        return;
    }
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
}
