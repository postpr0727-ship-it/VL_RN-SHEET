const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '알 수 없는 오류가 발생했습니다.' }));
    throw new Error(error.error || `API 요청 실패: ${response.status}`);
  }

  return response.json();
}

export async function getSchedules() {
  return apiRequest('/schedules');
}

export async function getSchedule(id: string) {
  return apiRequest(`/schedules/${id}`);
}

export async function saveScheduleToAPI(scheduleData: any) {
  return apiRequest('/schedules', {
    method: 'POST',
    body: JSON.stringify(scheduleData),
  });
}

export async function deleteScheduleFromAPI(id: string) {
  return apiRequest(`/schedules/${id}`, {
    method: 'DELETE',
  });
}

export async function updateSchedule(id: string, scheduleData: any) {
  return apiRequest(`/schedules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(scheduleData),
  });
}

