import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirestore } from './lib/firebase';

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
      // Firebase 초기화 및 연결 확인
      const { db, error } = getFirestore();
      
      if (error || !db) {
        return res.status(500).json({
          status: 'error',
          firebase: 'initialization_failed',
          message: 'Firebase 초기화에 실패했습니다.',
          error: error?.message || 'Firebase 데이터베이스를 초기화할 수 없습니다.',
          hint: 'Vercel Dashboard > Settings > Environment Variables에서 FIREBASE_SERVICE_ACCOUNT 환경 변수를 확인하고, 재배포하세요.',
          details: error?.stack || undefined,
        });
      }

      // Firebase 연결 테스트
      try {
        await db.collection('_health').limit(1).get();
        
        return res.status(200).json({
          status: 'ok',
          firebase: 'connected',
          message: 'Firebase Firestore가 정상적으로 연결되었습니다.',
        });
      } catch (testError) {
        return res.status(500).json({
          status: 'error',
          firebase: 'connection_failed',
          message: 'Firebase Firestore 연결 테스트에 실패했습니다.',
          error: testError instanceof Error ? testError.message : '알 수 없는 오류',
          hint: 'Firestore 데이터베이스가 생성되었는지, 서비스 계정 키가 올바른지 확인하세요.',
          details: testError instanceof Error ? testError.stack : undefined,
        });
      }
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        firebase: 'unknown_error',
        message: '예기치 않은 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        details: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
}

