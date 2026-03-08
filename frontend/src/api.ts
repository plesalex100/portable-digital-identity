/// <reference types="vite/client" />

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface UserData {
  fullName?: string;
  name?: string;
  passportNumber?: string;
  nationality?: string;
  flightNumber?: string;
  airline?: string;
  departure?: string;
  arrival?: string;
  gate?: string;
}

interface EnrollResponse {
  message?: string;
  code?: string;
  data?: unknown;
}

export const enrollFace = async (userData: UserData, imageBlob: Blob): Promise<EnrollResponse> => {
  const formData = new FormData();
  formData.append('name', userData.fullName || userData.name || '');
  formData.append('images', imageBlob, 'face.jpg');
  if (userData.passportNumber) formData.append('passportNumber', userData.passportNumber);
  if (userData.nationality) formData.append('nationality', userData.nationality);
  if (userData.flightNumber) formData.append('flightNumber', userData.flightNumber);
  if (userData.airline) formData.append('airline', userData.airline);
  if (userData.departure) formData.append('departure', userData.departure);
  if (userData.arrival) formData.append('arrival', userData.arrival);
  if (userData.gate) formData.append('gate', userData.gate);

  const response = await fetch(`${API_BASE}/api/face/enroll`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(data.message || 'Enrollment failed');
  }

  return data;
};

export const checkPassenger = async (passportNumber: string) => {
  const response = await fetch(`${API_BASE}/api/passengers/check/${encodeURIComponent(passportNumber)}`);
  return response.json();
};

export const verifyFace = async (imageBlob, checkpoint = 'check-in') => {
  const formData = new FormData();
  formData.append('image', imageBlob, 'face.jpg');
  formData.append('checkpoint', checkpoint);

  const response = await fetch(`${API_BASE}/api/face/verify`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(data.message || 'Verification failed');
  }

  return data;
};
