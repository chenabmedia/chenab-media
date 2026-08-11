import { getStorage, FirebaseStorage, ref } from 'firebase/storage';
import { firebaseApp } from './client';

export const storage: FirebaseStorage = getStorage(firebaseApp);

export function getArtistStorageRef(artistId: string, filename: string) {
  return ref(storage, `artists/${artistId}/${filename}`);
}

export function getReleaseStorageRef(releaseId: string, filename: string) {
  return ref(storage, `releases/${releaseId}/${filename}`);
}

export function getJournalStorageRef(postId: string, filename: string) {
  return ref(storage, `journal/${postId}/${filename}`);
}

export function getDemoStorageRef(demoId: string, filename: string) {
  return ref(storage, `demos/${demoId}/${filename}`);
}
