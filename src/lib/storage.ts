import { FileItem, FileType, StorageStats } from '../types';
import {
  loadFilesFromCloud,
  saveFileToCloud,
  deleteFileFromCloud,
  batchSaveFilesToCloud,
} from './firebase';

const DB_NAME = 'freecloud_storage_db';
const DB_VERSION = 1;
const META_STORE = 'files_metadata';
const BLOB_STORE = 'files_blobs';

const FREE_STORAGE_LIMIT_BYTES = 10 * 1024 * 1024 * 1024 * 1024; // 10 TB (10,240 GB) Free Cloud Storage

// Open or initialize IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(BLOB_STORE)) {
        db.createObjectStore(BLOB_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function detectFileType(fileName: string, mimeType: string = ''): FileType {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext) || mimeType.startsWith('image/')) {
    return 'image';
  }
  if (['mp4', 'webm', 'ogg', 'mov', 'mkv', 'avi'].includes(ext) || mimeType.startsWith('video/')) {
    return 'video';
  }
  if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(ext) || mimeType.startsWith('audio/')) {
    return 'audio';
  }
  if (ext === 'pdf' || mimeType === 'application/pdf') {
    return 'pdf';
  }
  if (['csv', 'xlsx', 'xls', 'tsv'].includes(ext)) {
    return 'spreadsheet';
  }
  if (['doc', 'docx', 'txt', 'md', 'rtf', 'odt'].includes(ext)) {
    return 'document';
  }
  if (['zip', 'rar', 'tar', 'gz', '7z', 'bz2'].includes(ext)) {
    return 'archive';
  }
  if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'py', 'java', 'cpp', 'c', 'rs', 'go', 'sh', 'sql', 'yaml', 'yml'].includes(ext)) {
    return 'code';
  }

  return 'other';
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(date);
  } catch {
    return isoString;
  }
}

// Convert dataURL to Blob
export function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) return null;
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    console.error('Failed to convert dataUrl to Blob', e);
    return null;
  }
}

// Generate thumbnail for images to allow instant preview across views
export function generateImageThumbnail(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(null);
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const canvas = document.createElement('canvas');
        const maxDim = 360;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
          return;
        }
      } catch (e) {
        console.warn('Thumbnail generation warning:', e);
      }
      resolve(null);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

// Generate real 16-bit PCM Stereo WAV Audio Blob
export function generateSampleAudioBlob(): Blob {
  const sampleRate = 44100;
  const duration = 6;
  const numChannels = 2;
  const numSamples = sampleRate * duration;
  const blockAlign = numChannels * 2;
  const byteRate = sampleRate * blockAlign;
  const dataByteLength = numSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataByteLength);
  const view = new DataView(buffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataByteLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // 16-bit
  writeString(36, 'data');
  view.setUint32(40, dataByteLength, true);

  const chords = [
    [261.63, 329.63, 392.00, 523.25], // C Major
    [220.00, 261.63, 329.63, 440.00], // A Minor
    [174.61, 220.00, 261.63, 349.23], // F Major
    [196.00, 246.94, 293.66, 392.00], // G Major
  ];

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const chordIdx = Math.floor((t / duration) * chords.length) % chords.length;
    const chord = chords[chordIdx];
    const chordTime = t % (duration / chords.length);
    const env = Math.sin(Math.min(1, chordTime * 3) * Math.PI * 0.5) * Math.exp(-chordTime * 0.7);

    let left = 0;
    let right = 0;
    for (let k = 0; k < chord.length; k++) {
      const freq = chord[k];
      const pan = (k / (chord.length - 1)) * 1.6 - 0.8;
      const note = Math.sin(2 * Math.PI * freq * t) * 0.35 + Math.sin(4 * Math.PI * freq * t) * 0.08;
      left += note * (1 - pan * 0.4);
      right += note * (1 + pan * 0.4);
    }

    const bass = Math.sin(2 * Math.PI * (chord[0] * 0.5) * t) * 0.35 * env;
    left = Math.max(-1, Math.min(1, left * env * 0.28 + bass));
    right = Math.max(-1, Math.min(1, right * env * 0.28 + bass));

    view.setInt16(offset, left < 0 ? left * 0x8000 : left * 0x7fff, true);
    view.setInt16(offset + 2, right < 0 ? right * 0x8000 : right * 0x7fff, true);
    offset += 4;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

// Generate high resolution landscape photo data URL
export function generateSamplePhotoDataUrl(): string {
  if (typeof document === 'undefined') return '';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Sunset Sky
    const sky = ctx.createLinearGradient(0, 0, 0, 520);
    sky.addColorStop(0, '#09090b');
    sky.addColorStop(0.3, '#1e1b4b');
    sky.addColorStop(0.65, '#991b1b');
    sky.addColorStop(0.9, '#ea580c');
    sky.addColorStop(1, '#fef08a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1200, 520);

    // Glowing Sun
    ctx.beginPath();
    ctx.arc(600, 420, 70, 0, Math.PI * 2);
    ctx.fillStyle = '#fffbeb';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 50;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Distant Mountain
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(0, 520);
    ctx.lineTo(260, 270);
    ctx.lineTo(540, 480);
    ctx.lineTo(840, 310);
    ctx.lineTo(1200, 520);
    ctx.closePath();
    ctx.fill();

    // Foreground Mountains
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.moveTo(0, 520);
    ctx.lineTo(390, 350);
    ctx.lineTo(690, 460);
    ctx.lineTo(1020, 320);
    ctx.lineTo(1200, 520);
    ctx.closePath();
    ctx.fill();

    // Lake surface
    const lake = ctx.createLinearGradient(0, 520, 0, 800);
    lake.addColorStop(0, '#0c0a09');
    lake.addColorStop(0.5, '#1c1917');
    lake.addColorStop(1, '#09090b');
    ctx.fillStyle = lake;
    ctx.fillRect(0, 520, 1200, 280);

    // Lake Sun Reflection
    ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
    for (let y = 525; y < 790; y += 10) {
      const w = 60 + (y - 520) * 1.6;
      ctx.fillRect(600 - w / 2, y, w, 3.5);
    }

    // Title badge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.fillText('Alpine Twilight Panorama • 1200×800 HD', 40, 750);

    return canvas.toDataURL('image/jpeg', 0.88);
  } catch {
    return '';
  }
}

// Read File as Data URL (capped at 650KB to respect Firestore 1MB document limit)
function readFileAsDataURL(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    if (file.size > 650 * 1024) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

// Initial Sample Data Generator
function generateSeedItems(ownerId: string = 'yashu22'): { metadata: FileItem[]; blobs: Record<string, Blob> } {
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const twoDaysAgo = new Date(Date.now() - 172800000).toISOString();

  const welcomeContent = `# Welcome to FreeCloud Storage! 🚀

### 100% Free Forever Cloud Storage
Enjoy 10 TB of private, secure storage connected directly to your cloud storage database with zero subscription or credit card required.

---

### 🌟 Key Features:
- **Cloud Database Connected**: Your files are securely persisted to Firestore. They will NOT be deleted when you reload the website or clear browser history.
- **Drag & Drop Upload**: Upload multiple files or whole directories effortlessly.
- **Instant Preview**: View images, Markdown, text, spreadsheets, code, and documents directly.
- **Text & Code Editor**: Create and edit notes, markdown documents, and code with live saving.
- **Folder Organization**: Organize nested folders with custom color tags.
- **Search & Sort**: Real-time instant search and sorting by name, date, size, and type.
- **Trash Recovery**: Safely restore deleted files or empty trash permanently.
`;

  const resumeTxt = `CURRICULUM VITAE
-----------------------------
Name: Yashu
Email: d.yaswanthsujan@gmail.com
Storage: 10 TB Active Cloud Storage
Status: Cloud Database Persistent

Summary:
Cloud storage user with persistent file storage and fast multi-format previews.
`;

  const budgetCsv = `Category,Allocated,Actual,Difference,Notes
Cloud Storage Plan,0.00,0.00,0.00,Free 10 TB Forever
Internet Fiber,65.00,65.00,0.00,High-speed connectivity
Productivity Tools,25.00,20.00,+5.00,Active subscription
Software Licenses,45.00,45.00,0.00,Yearly renewable
Total,135.00,130.00,+5.00,Under budget!`;

  const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
  <defs>
    <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#09090b" />
      <stop offset="60%" stop-color="#27272a" />
      <stop offset="100%" stop-color="#dc2626" />
    </linearGradient>
    <linearGradient id="mountGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#18181b" />
      <stop offset="100%" stop-color="#09090b" />
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="url(#skyGrad)" />
  <circle cx="480" cy="110" r="45" fill="#fecaca" opacity="0.85" />
  <polygon points="50,400 240,160 410,400" fill="url(#mountGrad)" />
  <polygon points="260,400 420,210 570,400" fill="#18181b" opacity="0.9" />
  <polygon points="170,400 330,130 500,400" fill="#09090b" opacity="0.95" />
  <text x="50" y="360" fill="#ffffff" font-size="24" font-family="sans-serif" font-weight="bold">Yashu Cloud Storage • 10 TB</text>
</svg>`;

  const configJson = `{
  "appName": "FreeCloud Storage",
  "owner": "yashu22",
  "storageLimit": "10 TB",
  "cloudDatabase": "Firestore Active",
  "persistence": "Durable Cloud Storage",
  "version": "2.0.0"
}`;

  const folder1Id = 'folder_personal_docs';
  const folder2Id = 'folder_media_gallery';
  const folder3Id = 'folder_projects';

  const metadata: FileItem[] = [
    {
      id: folder1Id,
      name: 'Personal Documents',
      type: 'folder',
      mimeType: 'application/x-directory',
      size: 0,
      parentId: null,
      createdAt: twoDaysAgo,
      updatedAt: twoDaysAgo,
      starred: false,
      inTrash: false,
      color: 'indigo',
      ownerId,
    },
    {
      id: folder2Id,
      name: 'Media Gallery',
      type: 'folder',
      mimeType: 'application/x-directory',
      size: 0,
      parentId: null,
      createdAt: yesterday,
      updatedAt: yesterday,
      starred: false,
      inTrash: false,
      color: 'amber',
      ownerId,
    },
    {
      id: folder3Id,
      name: 'Project Assets',
      type: 'folder',
      mimeType: 'application/x-directory',
      size: 0,
      parentId: null,
      createdAt: now,
      updatedAt: now,
      starred: false,
      inTrash: false,
      color: 'emerald',
      ownerId,
    },
    {
      id: 'doc_welcome',
      name: 'Welcome_to_FreeCloud.md',
      type: 'document',
      mimeType: 'text/markdown',
      size: new Blob([welcomeContent]).size,
      parentId: null,
      createdAt: now,
      updatedAt: now,
      starred: true,
      inTrash: false,
      textData: welcomeContent,
      ownerId,
      shareSettings: {
        isShared: true,
        shareId: 'freecloud-welcome-guide',
        access: 'view',
        passwordProtected: false,
      },
    },
    {
      id: 'file_resume',
      name: 'Resume_Template.txt',
      type: 'document',
      mimeType: 'text/plain',
      size: new Blob([resumeTxt]).size,
      parentId: folder1Id,
      createdAt: twoDaysAgo,
      updatedAt: twoDaysAgo,
      starred: false,
      inTrash: false,
      textData: resumeTxt,
      ownerId,
    },
    {
      id: 'file_budget',
      name: 'Budget_Planner_2026.csv',
      type: 'spreadsheet',
      mimeType: 'text/csv',
      size: new Blob([budgetCsv]).size,
      parentId: folder1Id,
      createdAt: twoDaysAgo,
      updatedAt: twoDaysAgo,
      starred: true,
      inTrash: false,
      textData: budgetCsv,
      ownerId,
    },
    {
      id: 'file_wallpaper',
      name: 'Mountain_Twilight_Vector.svg',
      type: 'image',
      mimeType: 'image/svg+xml',
      size: new Blob([sampleSvg]).size,
      parentId: folder2Id,
      createdAt: yesterday,
      updatedAt: yesterday,
      starred: true,
      inTrash: false,
      textData: sampleSvg,
      ownerId,
    },
    {
      id: 'file_sample_photo',
      name: 'Alpine_Twilight_Panorama.jpg',
      type: 'image',
      mimeType: 'image/jpeg',
      size: 485200,
      parentId: folder2Id,
      createdAt: yesterday,
      updatedAt: yesterday,
      starred: true,
      inTrash: false,
      dataUrl: generateSamplePhotoDataUrl(),
      previewUrl: generateSamplePhotoDataUrl(),
      ownerId,
    },
    {
      id: 'file_sample_audio',
      name: 'Lofi_Ambient_Chimes.wav',
      type: 'audio',
      mimeType: 'audio/wav',
      size: 1058444,
      parentId: folder2Id,
      createdAt: yesterday,
      updatedAt: yesterday,
      starred: true,
      inTrash: false,
      ownerId,
    },
    {
      id: 'file_config',
      name: 'app_config.json',
      type: 'code',
      mimeType: 'application/json',
      size: new Blob([configJson]).size,
      parentId: folder3Id,
      createdAt: now,
      updatedAt: now,
      starred: false,
      inTrash: false,
      textData: configJson,
      ownerId,
    },
  ];

  const blobs: Record<string, Blob> = {
    doc_welcome: new Blob([welcomeContent], { type: 'text/markdown' }),
    file_resume: new Blob([resumeTxt], { type: 'text/plain' }),
    file_budget: new Blob([budgetCsv], { type: 'text/csv' }),
    file_wallpaper: new Blob([sampleSvg], { type: 'image/svg+xml' }),
    file_sample_audio: generateSampleAudioBlob(),
    file_config: new Blob([configJson], { type: 'application/json' }),
  };

  return { metadata, blobs };
}

/**
 * Initialize storage with Firestore Cloud Database integration:
 * - Checks Firestore database first so data survives reload, page clear, or history wipe
 * - Falls back to IndexedDB local cache if offline
 */
export async function initializeStorage(currentUser: string = 'yashu22'): Promise<FileItem[]> {
  const db = await openDB();

  // 1. Try loading from Firestore Cloud Database
  try {
    let cloudFiles = await loadFilesFromCloud(currentUser);
    // If no files found for new username yashu22, check if files existed under previous username yashu88 and transfer them seamlessly
    if (!cloudFiles || cloudFiles.length === 0) {
      try {
        const prevFiles = await loadFilesFromCloud('yashu88');
        if (prevFiles && prevFiles.length > 0) {
          cloudFiles = prevFiles.map((item) => ({
            ...item,
            ownerId: currentUser,
          }));
          await batchSaveFilesToCloud(cloudFiles);
        }
      } catch {
        // Continue if previous lookup fails
      }
    }

    if (cloudFiles && cloudFiles.length > 0) {
      // Sync fetched cloud files into local IndexedDB
      const transaction = db.transaction(META_STORE, 'readwrite');
      const metaStore = transaction.objectStore(META_STORE);
      cloudFiles.forEach((item) => metaStore.put(item));
      return cloudFiles;
    }
  } catch (cloudErr) {
    console.warn('Could not read from Firestore, falling back to local DB cache:', cloudErr);
  }

  // 2. Check local IndexedDB
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([META_STORE, BLOB_STORE], 'readwrite');
    const metaStore = transaction.objectStore(META_STORE);
    const countRequest = metaStore.count();

    countRequest.onsuccess = () => {
      if (countRequest.result === 0) {
        // Seed initial items
        const { metadata, blobs } = generateSeedItems(currentUser);
        const blobStore = transaction.objectStore(BLOB_STORE);

        metadata.forEach((item) => metaStore.put(item));
        Object.entries(blobs).forEach(([id, blob]) => blobStore.put(blob, id));

        transaction.oncomplete = () => {
          // Permanently save seed items to Firestore Cloud Storage database
          batchSaveFilesToCloud(metadata).catch((err) =>
            console.warn('Initial cloud storage sync notice:', err)
          );
          resolve(metadata);
        };
        transaction.onerror = () => reject(transaction.error);
      } else {
        const getAllRequest = metaStore.getAll();
        getAllRequest.onsuccess = () => {
          const localItems = getAllRequest.result as FileItem[];
          const itemsWithUser = localItems.map((item) => ({
            ...item,
            ownerId: item.ownerId || currentUser,
          }));

          // Asynchronously sync local items to Firestore
          batchSaveFilesToCloud(itemsWithUser).catch(() => {});
          resolve(itemsWithUser);
        };
        getAllRequest.onerror = () => reject(getAllRequest.error);
      }
    };

    countRequest.onerror = () => reject(countRequest.error);
  });
}

// Fetch all files
export async function getAllFiles(currentUser: string = 'yashu22'): Promise<FileItem[]> {
  try {
    const cloudFiles = await loadFilesFromCloud(currentUser);
    if (cloudFiles && cloudFiles.length > 0) return cloudFiles;
  } catch {
    // Fallback to IndexedDB
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(META_STORE, 'readonly');
    const store = transaction.objectStore(META_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as FileItem[]);
    request.onerror = () => reject(request.error);
  });
}

// Save an uploaded file to local DB and Firestore Cloud Database
export async function saveUploadedFile(
  file: File,
  parentId: string | null = null,
  currentUser: string = 'yashu22'
): Promise<FileItem> {
  const db = await openDB();
  const id = 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();
  const fileType = detectFileType(file.name, file.type);

  // Check if text/svg/json for textData preview
  let textData: string | null = null;
  const isTextLike =
    file.type.startsWith('text/') ||
    file.name.endsWith('.json') ||
    file.name.endsWith('.md') ||
    file.name.endsWith('.svg') ||
    file.name.endsWith('.csv') ||
    file.name.endsWith('.ts') ||
    file.name.endsWith('.js');

  if (isTextLike && file.size < 5 * 1024 * 1024) {
    try {
      textData = await file.text();
    } catch {
      textData = null;
    }
  }

  // If image, generate lightweight thumbnail for instant display in grid and details
  let previewUrl: string | null = null;
  if (fileType === 'image') {
    previewUrl = await generateImageThumbnail(file);
  }

  // If image/audio/media and <= 650KB, save dataURL to Firestore so it survives history clearing!
  let dataUrl: string | null = null;
  if (!textData && file.size <= 650 * 1024) {
    dataUrl = await readFileAsDataURL(file);
  }

  const newFileItem: FileItem = {
    id,
    name: file.name,
    type: fileType,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    parentId,
    createdAt: now,
    updatedAt: now,
    starred: false,
    inTrash: false,
    textData,
    dataUrl,
    previewUrl,
    ownerId: currentUser,
    shareSettings: {
      isShared: false,
      shareId: Math.random().toString(36).substring(2, 10),
      access: 'view',
      passwordProtected: false,
    },
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([META_STORE, BLOB_STORE], 'readwrite');
    const metaStore = transaction.objectStore(META_STORE);
    const blobStore = transaction.objectStore(BLOB_STORE);

    metaStore.put(newFileItem);
    blobStore.put(file, id);

    transaction.oncomplete = () => {
      // Save permanently to Firestore Cloud Database
      saveFileToCloud(newFileItem).catch((err) =>
        console.warn('Cloud save warning for uploaded file:', err)
      );
      resolve(newFileItem);
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

// Create a new folder
export async function createFolder(
  name: string,
  parentId: string | null = null,
  color: string = 'indigo',
  currentUser: string = 'yashu22'
): Promise<FileItem> {
  const db = await openDB();
  const id = 'folder_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  const folderItem: FileItem = {
    id,
    name: name.trim() || 'Untitled Folder',
    type: 'folder',
    mimeType: 'application/x-directory',
    size: 0,
    parentId,
    createdAt: now,
    updatedAt: now,
    starred: false,
    inTrash: false,
    color,
    ownerId: currentUser,
    shareSettings: {
      isShared: false,
      shareId: Math.random().toString(36).substring(2, 10),
      access: 'view',
      passwordProtected: false,
    },
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(META_STORE, 'readwrite');
    const store = transaction.objectStore(META_STORE);
    store.put(folderItem);

    transaction.oncomplete = () => {
      // Save permanently to Firestore Cloud Database
      saveFileToCloud(folderItem).catch((err) =>
        console.warn('Cloud save warning for folder:', err)
      );
      resolve(folderItem);
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

// Create a new text or markdown file
export async function createTextFile(
  name: string,
  content: string,
  parentId: string | null = null,
  currentUser: string = 'yashu22'
): Promise<FileItem> {
  const db = await openDB();
  const id = 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();
  const blob = new Blob([content], { type: 'text/markdown' });
  const fileType = detectFileType(name, 'text/markdown');

  const fileItem: FileItem = {
    id,
    name: name.trim() || 'Untitled Note.md',
    type: fileType,
    mimeType: 'text/markdown',
    size: blob.size,
    parentId,
    createdAt: now,
    updatedAt: now,
    starred: false,
    inTrash: false,
    textData: content,
    ownerId: currentUser,
    shareSettings: {
      isShared: false,
      shareId: Math.random().toString(36).substring(2, 10),
      access: 'view',
      passwordProtected: false,
    },
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([META_STORE, BLOB_STORE], 'readwrite');
    const metaStore = transaction.objectStore(META_STORE);
    const blobStore = transaction.objectStore(BLOB_STORE);

    metaStore.put(fileItem);
    blobStore.put(blob, id);

    transaction.oncomplete = () => {
      // Save permanently to Firestore Cloud Database
      saveFileToCloud(fileItem).catch((err) =>
        console.warn('Cloud save warning for text file:', err)
      );
      resolve(fileItem);
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

// Get Blob data for download or preview (with fallback to cloud dataUrl or textData if history cleared)
export async function getFileBlob(id: string, fallbackItem?: FileItem | null): Promise<Blob | null> {
  try {
    const db = await openDB();
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      const transaction = db.transaction(BLOB_STORE, 'readonly');
      const store = transaction.objectStore(BLOB_STORE);
      const request = store.get(id);

      request.onsuccess = () => resolve((request.result as Blob) || null);
      request.onerror = () => reject(request.error);
    });

    if (blob && blob.size > 0) return blob;
  } catch {
    // Local DB not available
  }

  // Generate real audio sample on the fly if needed
  if (id === 'file_sample_audio') {
    return generateSampleAudioBlob();
  }

  // Reconstruct from cloud textData or dataUrl if browser history or local DB was cleared
  let item = fallbackItem;
  if (!item) {
    try {
      const db = await openDB();
      item = await new Promise<FileItem | null>((resolve) => {
        const tx = db.transaction(META_STORE, 'readonly');
        const store = tx.objectStore(META_STORE);
        const req = store.get(id);
        req.onsuccess = () => resolve((req.result as FileItem) || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      // ignore
    }
  }

  if (item) {
    if (item.textData) {
      return new Blob([item.textData], { type: item.mimeType || 'text/plain' });
    }
    if (item.dataUrl) {
      return dataUrlToBlob(item.dataUrl);
    }
    if (item.previewUrl && item.previewUrl.startsWith('data:')) {
      return dataUrlToBlob(item.previewUrl);
    }
  }

  return null;
}

// Update file metadata
export async function updateFileMeta(id: string, updates: Partial<FileItem>): Promise<FileItem> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(META_STORE, 'readwrite');
    const store = transaction.objectStore(META_STORE);
    const request = store.get(id);

    request.onsuccess = () => {
      const existing = request.result as FileItem;
      if (!existing) {
        reject(new Error('File not found'));
        return;
      }
      const updated: FileItem = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      store.put(updated);
      transaction.oncomplete = () => {
        // Update in Firestore Cloud Database
        saveFileToCloud(updated).catch((err) =>
          console.warn('Cloud update warning:', err)
        );
        resolve(updated);
      };
    };

    request.onerror = () => reject(request.error);
  });
}

// Update text content and blob
export async function updateTextFileContent(id: string, content: string): Promise<FileItem> {
  const db = await openDB();
  const blob = new Blob([content], { type: 'text/plain' });

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([META_STORE, BLOB_STORE], 'readwrite');
    const metaStore = transaction.objectStore(META_STORE);
    const blobStore = transaction.objectStore(BLOB_STORE);

    const getReq = metaStore.get(id);
    getReq.onsuccess = () => {
      const existing = getReq.result as FileItem;
      if (!existing) {
        reject(new Error('File not found'));
        return;
      }
      const updated: FileItem = {
        ...existing,
        size: blob.size,
        textData: content,
        updatedAt: new Date().toISOString(),
      };
      metaStore.put(updated);
      blobStore.put(blob, id);
      transaction.oncomplete = () => {
        // Update in Firestore Cloud Database
        saveFileToCloud(updated).catch((err) =>
          console.warn('Cloud update warning:', err)
        );
        resolve(updated);
      };
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

// Move item to trash (and all nested children if folder)
export async function moveToTrash(id: string, allItems: FileItem[]): Promise<string[]> {
  const idsToTrash = collectFolderItemIds(id, allItems);
  const db = await openDB();
  const now = new Date().toISOString();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(META_STORE, 'readwrite');
    const store = transaction.objectStore(META_STORE);

    idsToTrash.forEach((targetId) => {
      const req = store.get(targetId);
      req.onsuccess = () => {
        const item = req.result as FileItem;
        if (item) {
          item.inTrash = true;
          item.trashedAt = now;
          store.put(item);
          // Sync trash state to Firestore
          saveFileToCloud(item).catch(() => {});
        }
      };
    });

    transaction.oncomplete = () => resolve(idsToTrash);
    transaction.onerror = () => reject(transaction.error);
  });
}

// Restore from trash
export async function restoreFromTrash(id: string, allItems: FileItem[]): Promise<string[]> {
  const idsToRestore = collectFolderItemIds(id, allItems);
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(META_STORE, 'readwrite');
    const store = transaction.objectStore(META_STORE);

    idsToRestore.forEach((targetId) => {
      const req = store.get(targetId);
      req.onsuccess = () => {
        const item = req.result as FileItem;
        if (item) {
          item.inTrash = false;
          item.trashedAt = null;
          store.put(item);
          // Sync restored state to Firestore
          saveFileToCloud(item).catch(() => {});
        }
      };
    });

    transaction.oncomplete = () => resolve(idsToRestore);
    transaction.onerror = () => reject(transaction.error);
  });
}

// Restore all items from trash
export async function restoreAllFromTrash(allItems: FileItem[]): Promise<string[]> {
  const trashedItems = allItems.filter((f) => f.inTrash);
  const idsToRestore = trashedItems.map((f) => f.id);
  if (idsToRestore.length === 0) return [];
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(META_STORE, 'readwrite');
    const store = transaction.objectStore(META_STORE);

    idsToRestore.forEach((targetId) => {
      const req = store.get(targetId);
      req.onsuccess = () => {
        const item = req.result as FileItem;
        if (item) {
          item.inTrash = false;
          item.trashedAt = null;
          store.put(item);
          saveFileToCloud(item).catch(() => {});
        }
      };
    });

    transaction.oncomplete = () => resolve(idsToRestore);
    transaction.onerror = () => reject(transaction.error);
  });
}

// Permanently delete item
export async function permanentlyDelete(id: string, allItems: FileItem[]): Promise<string[]> {
  const idsToDelete = collectFolderItemIds(id, allItems);
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([META_STORE, BLOB_STORE], 'readwrite');
    const metaStore = transaction.objectStore(META_STORE);
    const blobStore = transaction.objectStore(BLOB_STORE);

    idsToDelete.forEach((targetId) => {
      metaStore.delete(targetId);
      blobStore.delete(targetId);
      // Permanently remove from Firestore Cloud Database
      deleteFileFromCloud(targetId).catch(() => {});
    });

    transaction.oncomplete = () => resolve(idsToDelete);
    transaction.onerror = () => reject(transaction.error);
  });
}

// Empty entire trash
export async function emptyTrash(allItems: FileItem[]): Promise<string[]> {
  const trashedItems = allItems.filter((f) => f.inTrash);
  const idsToDelete = trashedItems.map((f) => f.id);
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([META_STORE, BLOB_STORE], 'readwrite');
    const metaStore = transaction.objectStore(META_STORE);
    const blobStore = transaction.objectStore(BLOB_STORE);

    idsToDelete.forEach((targetId) => {
      metaStore.delete(targetId);
      blobStore.delete(targetId);
      // Permanently delete from Firestore Cloud Database
      deleteFileFromCloud(targetId).catch(() => {});
    });

    transaction.oncomplete = () => resolve(idsToDelete);
    transaction.onerror = () => reject(transaction.error);
  });
}

// Helper: collect folder and all its recursive contents
function collectFolderItemIds(folderId: string, allItems: FileItem[]): string[] {
  const results: string[] = [folderId];
  const queue: string[] = [folderId];

  while (queue.length > 0) {
    const currentParent = queue.shift()!;
    const children = allItems.filter((i) => i.parentId === currentParent);
    for (const child of children) {
      results.push(child.id);
      if (child.type === 'folder') {
        queue.push(child.id);
      }
    }
  }

  return results;
}

// Trigger real browser download for a file
export async function triggerDownload(item: FileItem): Promise<void> {
  let blob = await getFileBlob(item.id, item);
  if (!blob && item.textData) {
    blob = new Blob([item.textData], { type: item.mimeType || 'text/plain' });
  }
  if (!blob && item.dataUrl) {
    blob = dataUrlToBlob(item.dataUrl);
  }
  if (!blob && item.previewUrl && item.previewUrl.startsWith('data:')) {
    blob = dataUrlToBlob(item.previewUrl);
  }

  if (!blob) {
    throw new Error(`File data for "${item.name}" is not currently available for download.`);
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = item.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Keep object URL active for 15 seconds to allow large downloads (video, audio, high-res photos) to start cleanly
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}

// Calculate storage stats
export function calculateStorage(items: FileItem[]): StorageStats {
  const activeItems = items.filter((f) => !f.inTrash && f.type !== 'folder');

  let images = 0;
  let documents = 0;
  let media = 0;
  let archives = 0;
  let other = 0;
  let usedBytes = 0;

  activeItems.forEach((file) => {
    usedBytes += file.size;
    switch (file.type) {
      case 'image':
        images += file.size;
        break;
      case 'document':
      case 'spreadsheet':
      case 'pdf':
        documents += file.size;
        break;
      case 'video':
      case 'audio':
        media += file.size;
        break;
      case 'archive':
        archives += file.size;
        break;
      default:
        other += file.size;
        break;
    }
  });

  return {
    usedBytes,
    totalBytes: FREE_STORAGE_LIMIT_BYTES,
    byType: {
      images,
      documents,
      media,
      archives,
      other,
    },
  };
}
