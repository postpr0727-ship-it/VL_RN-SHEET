import admin from 'firebase-admin';

// Firebase Admin 초기화 (환경 변수에서 서비스 계정 정보 가져오기)
if (!admin.apps.length) {
  try {
    // 방법 1: 환경 변수에 JSON 형태로 저장된 경우
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (serviceAccount) {
      // JSON 문자열을 파싱
      const serviceAccountJson = JSON.parse(serviceAccount);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountJson),
      });
    } else {
      // 방법 2: 환경 변수에 개별 필드로 저장된 경우
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

      if (projectId && privateKey && clientEmail) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            privateKey,
            clientEmail,
          }),
        });
      } else {
        throw new Error('Firebase 환경 변수가 설정되지 않았습니다.');
      }
    }
  } catch (error) {
    console.error('Firebase 초기화 오류:', error);
    throw error;
  }
}

export const db = admin.firestore();

