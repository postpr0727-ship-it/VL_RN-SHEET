import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirestore } from '../lib/firebase';
import type { SavedSchedule } from '../lib/types';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,PUT,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'ID가 필요합니다.' });
    }

    try {
    // Firebase 초기화 및 연결 확인
    const { db, error: firebaseError } = getFirestore();
    
    if (firebaseError || !db) {
      return res.status(500).json({
        error: 'Firebase 초기화 오류',
        details: firebaseError?.message || 'Firebase 데이터베이스를 초기화할 수 없습니다.',
        hint: 'Vercel Dashboard > Settings > Environment Variables에서 FIREBASE_SERVICE_ACCOUNT 환경 변수를 확인하고, 재배포하세요.',
      });
    }
    
    const scheduleRef = db.collection('schedules').doc(id);

    if (req.method === 'GET') {
      // 특정 근무표 가져오기
      const doc = await scheduleRef.get();

      if (!doc.exists) {
        res.status(404).json({ error: '근무표를 찾을 수 없습니다.' });
        return;
      }

      const schedule = {
        id: doc.id,
        ...doc.data(),
      } as SavedSchedule;

      res.status(200).json(schedule);
      return;
    }

    if (req.method === 'DELETE') {
      // 근무표 삭제
      const doc = await scheduleRef.get();

      if (!doc.exists) {
        res.status(404).json({ error: '근무표를 찾을 수 없습니다.' });
        return;
      }

      await scheduleRef.delete();

      res.status(200).json({ message: '근무표가 삭제되었습니다.', deletedId: id });
      return;
    }

    if (req.method === 'PUT') {
      // 근무표 업데이트
      const doc = await scheduleRef.get();

      if (!doc.exists) {
        res.status(404).json({ error: '근무표를 찾을 수 없습니다.' });
        return;
      }

      const updateData: Partial<SavedSchedule> = req.body;
      
      const updateDoc = {
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      await scheduleRef.update(updateDoc);

      const updated = await scheduleRef.get();
      const updatedSchedule = {
        id: updated.id,
        ...updated.data(),
      } as SavedSchedule;

      res.status(200).json(updatedSchedule);
      return;
    }

      return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
    } catch (error) {
      console.error('API 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      
      // Firebase 초기화 오류인지 확인
      if (errorMessage.includes('Firebase') || errorMessage.includes('환경 변수')) {
        return res.status(500).json({ 
          error: 'Firebase 연결 오류',
          details: errorMessage,
          hint: 'FIREBASE_SERVICE_ACCOUNT 환경 변수가 올바르게 설정되었는지 확인하세요. Vercel Dashboard > Settings > Environment Variables에서 확인하세요.'
        });
      } else {
        return res.status(500).json({ 
          error: '서버 오류가 발생했습니다.',
          details: errorMessage
        });
      }
    }
  } catch (globalError) {
    // 최상위 예외 처리 (함수가 크래시되지 않도록)
    console.error('Handler 최상위 오류:', globalError);
    return res.status(500).json({
      error: 'Serverless Function 오류',
      message: '예기치 않은 오류가 발생했습니다.',
      details: globalError instanceof Error ? globalError.message : '알 수 없는 오류',
    });
  }
}

