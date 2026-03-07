const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const enrollFace = async (name, imageBlob) => {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('images', imageBlob, 'face.jpg');

  const response = await fetch(`${API_BASE}/api/face/enroll`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Enrollment failed');
  }

  return data;
};

export const verifyFace = async (imageBlob) => {
  const formData = new FormData();
  formData.append('image', imageBlob, 'face.jpg');

  const response = await fetch(`${API_BASE}/api/face/verify`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Verification failed');
  }

  return data;
};
