import type { Holiday } from "./holidays";

/**
 * 공공데이터포털 API 또는 외부 API에서 공휴일 정보를 가져오는 유틸리티
 * 
 * 사용 방법:
 * 1. 공공데이터포털(https://www.data.go.kr)에서 '한국천문연구원_특일 정보' API 신청
 * 2. API 키 발급 후 환경변수에 저장
 * 3. 아래 fetchHolidaysFromAPI 함수 활성화
 */

/**
 * 공공데이터포털 API에서 공휴일 정보 가져오기
 * 
 * @param year 연도
 * @returns 공휴일 배열
 */
export async function fetchHolidaysFromAPI(year: number): Promise<Holiday[]> {
  try {
    // 옵션 1: 공공데이터포털 API (인증키 필요)
    // API 키는 환경변수 VITE_PUBLIC_DATA_API_KEY에 설정
    const apiKey = import.meta.env.VITE_PUBLIC_DATA_API_KEY;
    
    if (apiKey) {
      // CORS 문제로 인해 프록시 서버가 필요할 수 있음
      // Vercel Functions나 Netlify Functions를 통해 프록시 가능
      const url = `http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?solYear=${year}&ServiceKey=${encodeURIComponent(apiKey)}&_type=json&numOfRows=100`;
      
      try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.response?.body?.items?.item) {
          const items = Array.isArray(data.response.body.items.item) 
            ? data.response.body.items.item 
            : [data.response.body.items.item];
          
          return items.map((item: any) => ({
            month: parseInt(item.locdate.toString().substring(4, 6)),
            day: parseInt(item.locdate.toString().substring(6, 8)),
            name: item.dateName,
          }));
        }
      } catch (corsError) {
        // CORS 오류 시 프록시 서버를 통해 호출 시도
        console.log("CORS 오류 발생, 프록시 서버 필요");
        // TODO: Vercel Function 등 프록시 서버 구현 필요
      }
    }
    
    // 옵션 2: 무료 공휴일 API (CORS 없이 사용 가능한 경우)
    // 참고: 실제 API 엔드포인트로 교체 필요
    // const freeApiUrl = `https://api.example.com/holidays/kr/${year}`;
    // try {
    //   const response = await fetch(freeApiUrl);
    //   const data = await response.json();
    //   return data.holidays || [];
    // } catch (error) {
    //   console.error("무료 API 호출 실패:", error);
    // }
    
    // API 키가 없거나 실패한 경우 빈 배열 반환
    return [];
  } catch (error) {
    console.error("공휴일 API 호출 실패:", error);
    return [];
  }
}

/**
 * localStorage에 공휴일 데이터 캐시 저장
 */
export function saveHolidaysToCache(year: number, holidays: Holiday[]): void {
  if (typeof window === "undefined") return;
  
  try {
    const cache = JSON.parse(localStorage.getItem("holidaysCache") || "{}");
    cache[year] = {
      holidays,
      cachedAt: new Date().toISOString(),
    };
    localStorage.setItem("holidaysCache", JSON.stringify(cache));
  } catch (error) {
    console.error("공휴일 캐시 저장 실패:", error);
  }
}

/**
 * localStorage에서 공휴일 데이터 캐시 불러오기
 */
export function loadHolidaysFromCache(year: number): Holiday[] | null {
  if (typeof window === "undefined") return null;
  
  try {
    const cache = JSON.parse(localStorage.getItem("holidaysCache") || "{}");
    const cached = cache[year];
    
    if (cached && cached.holidays) {
      // 캐시된 지 30일 이내면 사용
      const cachedDate = new Date(cached.cachedAt);
      const now = new Date();
      const diffDays = (now.getTime() - cachedDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (diffDays < 30) {
        return cached.holidays;
      }
    }
  } catch (error) {
    console.error("공휴일 캐시 불러오기 실패:", error);
  }
  
  return null;
}

/**
 * 공휴일 데이터를 가져오는 통합 함수
 * 1. 캐시 확인
 * 2. 캐시가 없거나 오래되었으면 API 호출
 * 3. API 실패 시 기본 공휴일 반환
 */
export async function getHolidays(year: number): Promise<Holiday[]> {
  // 1. 캐시 확인
  const cached = loadHolidaysFromCache(year);
  if (cached) {
    return cached;
  }
  
  // 2. API 호출 시도
  const apiHolidays = await fetchHolidaysFromAPI(year);
  if (apiHolidays.length > 0) {
    saveHolidaysToCache(year, apiHolidays);
    return apiHolidays;
  }
  
  // 3. API 실패 시 null 반환 (호출자가 기본값 사용)
  return [];
}
