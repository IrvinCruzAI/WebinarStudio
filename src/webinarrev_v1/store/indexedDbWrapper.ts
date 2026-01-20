import { TranscriptData, ArtifactData } from '../contracts';

const DB_NAME = 'wrv1_storage';
const DB_VERSION = 2;
const TRANSCRIPTS_STORE = 'transcripts';
const ARTIFACTS_STORE = 'artifacts';
const DRAFTS_STORE = 'drafts';

export interface DraftData {
  draft_id: string;
  title: string;
  build_transcript: string;
  intake_transcript: string;
  operator_notes: string;
  cta_mode: string;
  audience_temperature: string;
  webinar_length_minutes: number;
  created_at: number;
  updated_at: number;
}

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(TRANSCRIPTS_STORE)) {
        db.createObjectStore(TRANSCRIPTS_STORE, { keyPath: 'project_id' });
      }

      if (!db.objectStoreNames.contains(ARTIFACTS_STORE)) {
        db.createObjectStore(ARTIFACTS_STORE, { keyPath: 'artifact_id' });
      }

      if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
        db.createObjectStore(DRAFTS_STORE, { keyPath: 'draft_id' });
      }
    };
  });
}

export async function writeTranscript(
  projectId: string,
  data: Omit<TranscriptData, 'project_id'>
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TRANSCRIPTS_STORE], 'readwrite');
    const store = transaction.objectStore(TRANSCRIPTS_STORE);
    const request = store.put({ project_id: projectId, ...data });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function readTranscript(
  projectId: string
): Promise<TranscriptData | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TRANSCRIPTS_STORE], 'readonly');
    const store = transaction.objectStore(TRANSCRIPTS_STORE);
    const request = store.get(projectId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const result = request.result;
      if (result) {
        const { project_id, ...data } = result;
        resolve(data as TranscriptData);
      } else {
        resolve(null);
      }
    };
  });
}

export async function writeArtifact(
  artifactId: string,
  data: Omit<ArtifactData, 'artifact_id'>
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([ARTIFACTS_STORE], 'readwrite');
    const store = transaction.objectStore(ARTIFACTS_STORE);
    const request = store.put({ artifact_id: artifactId, ...data });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function readArtifact(
  artifactId: string
): Promise<ArtifactData | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([ARTIFACTS_STORE], 'readonly');
    const store = transaction.objectStore(ARTIFACTS_STORE);
    const request = store.get(artifactId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const result = request.result;
      if (result) {
        const { artifact_id, ...data } = result;
        resolve(data as ArtifactData);
      } else {
        resolve(null);
      }
    };
  });
}

export async function deleteTranscript(projectId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TRANSCRIPTS_STORE], 'readwrite');
    const store = transaction.objectStore(TRANSCRIPTS_STORE);
    const request = store.delete(projectId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function deleteArtifact(artifactId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([ARTIFACTS_STORE], 'readwrite');
    const store = transaction.objectStore(ARTIFACTS_STORE);
    const request = store.delete(artifactId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function listArtifacts(
  projectId: string,
  runId: string
): Promise<string[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([ARTIFACTS_STORE], 'readonly');
    const store = transaction.objectStore(ARTIFACTS_STORE);
    const request = store.getAllKeys();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const allKeys = request.result as string[];
      const prefix = `${projectId}:${runId}:`;
      const matchingKeys = allKeys.filter(key => key.startsWith(prefix));
      resolve(matchingKeys);
    };
  });
}

export async function saveDraft(draftData: DraftData): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DRAFTS_STORE], 'readwrite');
    const store = transaction.objectStore(DRAFTS_STORE);
    const request = store.put(draftData);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function loadDraft(draftId: string): Promise<DraftData | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DRAFTS_STORE], 'readonly');
    const store = transaction.objectStore(DRAFTS_STORE);
    const request = store.get(draftId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      resolve(request.result || null);
    };
  });
}

export async function deleteDraft(draftId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DRAFTS_STORE], 'readwrite');
    const store = transaction.objectStore(DRAFTS_STORE);
    const request = store.delete(draftId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function listAllDrafts(): Promise<DraftData[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DRAFTS_STORE], 'readonly');
    const store = transaction.objectStore(DRAFTS_STORE);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      resolve(request.result || []);
    };
  });
}
