import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  getDocFromServer,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { FileItem } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the exact Database ID from configuration
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection function as instructed in SKILL.md
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is offline or unreachable.');
    }
    return false;
  }
}

// Strip undefined values from objects before writing to Firestore
function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean;
}

const CLOUD_COLLECTION = 'cloud_files';

/**
 * Load all files for the user from Firestore database
 */
export async function loadFilesFromCloud(ownerId: string): Promise<FileItem[]> {
  const path = CLOUD_COLLECTION;
  try {
    const q = query(collection(db, path), where('ownerId', '==', ownerId));
    const snapshot = await getDocs(q);
    const items: FileItem[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as FileItem;
      items.push(data);
    });
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Save or update a single file/folder document in Firestore
 */
export async function saveFileToCloud(item: FileItem): Promise<void> {
  const docPath = `${CLOUD_COLLECTION}/${item.id}`;
  try {
    const cleanData = sanitizeForFirestore(item);
    await setDoc(doc(db, CLOUD_COLLECTION, item.id), cleanData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * Delete a file document from Firestore
 */
export async function deleteFileFromCloud(fileId: string): Promise<void> {
  const docPath = `${CLOUD_COLLECTION}/${fileId}`;
  try {
    await deleteDoc(doc(db, CLOUD_COLLECTION, fileId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

/**
 * Batch save multiple files/folders to Firestore (e.g., initial seed sync)
 */
export async function batchSaveFilesToCloud(items: FileItem[]): Promise<void> {
  if (items.length === 0) return;
  const path = CLOUD_COLLECTION;
  try {
    const batch = writeBatch(db);
    for (const item of items) {
      const docRef = doc(db, CLOUD_COLLECTION, item.id);
      batch.set(docRef, sanitizeForFirestore(item), { merge: true });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Real-time listener for user's files from Firestore
 */
export function subscribeToUserCloudFiles(
  ownerId: string,
  onData: (files: FileItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = CLOUD_COLLECTION;
  const q = query(collection(db, path), where('ownerId', '==', ownerId));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: FileItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as FileItem);
      });
      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}
