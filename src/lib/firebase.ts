import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const addRegistration = async (data: { fullName: string, email: string, phone: string, category: string }) => {
  return await addDoc(collection(db, 'registrations'), {
    ...data,
    createdAt: serverTimestamp()
  });
};

export const addGalleryItem = async (data: { title: string, imageUrl: string, year: string }) => {
  return await addDoc(collection(db, 'gallery'), {
    ...data,
    createdAt: serverTimestamp() // Ensure this matches firestore rule request.time
  });
};

export const subscribeToGallery = (callback: (items: any[]) => void) => {
  const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => {
      const dbData = doc.data();
      // Ensure we don't crash if createdAt is null initially
      return { id: doc.id, ...dbData };
    });
    callback(items);
  });
};
