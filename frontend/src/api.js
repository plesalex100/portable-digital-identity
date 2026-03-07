export const saveBiometricData = (userData) => {
  console.log('// TEAM: Biometric data POST request mock initialized with data:', userData);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, biometricToken: 'BIO-SECURE-79X' });
    }, 2000);
  });
};
