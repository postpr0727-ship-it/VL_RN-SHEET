/**
 * API 연결 상태 확인 유틸리티
 */

export async function checkApiStatus(): Promise<{
  connected: boolean;
  message: string;
  error?: string;
}> {
  try {
    const response = await fetch('/api/health');
    const data = await response.json();
    
    if (response.ok && data.firebase === 'connected') {
      return {
        connected: true,
        message: 'Firebase가 정상적으로 연결되었습니다.',
      };
    } else {
      return {
        connected: false,
        message: 'Firebase 연결에 실패했습니다.',
        error: data.message || '알 수 없는 오류',
      };
    }
  } catch (error) {
    return {
      connected: false,
      message: 'API 서버에 연결할 수 없습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

export async function testScheduleAPI(): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    // 빈 목록 조회로 API 테스트
    const response = await fetch('/api/schedules');
    
    if (response.ok) {
      return {
        success: true,
        message: 'API가 정상적으로 작동합니다.',
      };
    } else {
      const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류' }));
      return {
        success: false,
        message: 'API 요청이 실패했습니다.',
        error: errorData.error || `HTTP ${response.status}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'API 서버에 연결할 수 없습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

