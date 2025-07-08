// Simple localStorage service for saving/loading infographics
import { InfographicCardData } from '../types';

const STORAGE_KEY = 'savedInfographic';

export function saveInfographic(data: InfographicCardData[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadInfographic(): InfographicCardData[] | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearInfographic() {
  localStorage.removeItem(STORAGE_KEY);
}
