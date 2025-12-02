import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../lib/firebase';
import type { SavedSchedule } from '../lib/types';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
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
    res.status(400).json({ error: 'ID가 필요합니다.' });
    return;
  }

  try {
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

    res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
  } catch (error) {
    console.error('API 오류:', error);
    res.status(500).json({ 
      error: '서버 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
}

