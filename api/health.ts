import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './lib/firebase';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      // Firebase 연결 테스트
      await db.collection('_health').limit(1).get();
      
      res.status(200).json({
        status: 'ok',
        firebase: 'connected',
        message: 'Firebase Firestore가 정상적으로 연결되었습니다.',
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        firebase: 'not_connected',
        message: 'Firebase Firestore 연결에 실패했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        hint: 'FIREBASE_SERVICE_ACCOUNT 환경 변수가 설정되었는지 확인하세요.',
      });
    }
    return;
  }

  res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
}

