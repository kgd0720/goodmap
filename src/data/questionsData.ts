import { Question } from "../types";

export const NEW_FRANCHISE_QUESTIONS: Question[] = [
  {
    id: "new-q1",
    text: "원장 경력이 있나요?",
    options: [
      { value: 1, text: "없음 or 타과목 운영" },
      { value: 2, text: "초등영어학원 1년 미만 or 입시영어" },
      { value: 3, text: "초등영어학원 1~3년" },
      { value: 4, text: "초등영어학원 3년이상" },
      { value: 5, text: "초등어학원 운영" }
    ]
  },
  {
    id: "new-q2",
    text: "영어 수업 경력이 있나요?",
    options: [
      { value: 1, text: "전혀 없음" },
      { value: 2, text: "1년 미만" },
      { value: 3, text: "1~3년" },
      { value: 4, text: "3~5년" },
      { value: 5, text: "5년 이상" }
    ]
  },
  {
    id: "new-q3",
    text: "현재 창업 가능 자본은 어느 정도인가요?",
    options: [
      { value: 1, text: "5천만원 미만" },
      { value: 2, text: "5천만원~1억원" },
      { value: 3, text: "1억원~1억5천만원" },
      { value: 4, text: "1억5천만원~2억원" },
      { value: 5, text: "2억원 이상" }
    ]
  },
  {
    id: "new-q4",
    text: "학부모 상담 경험이 있나요?",
    options: [
      { value: 1, text: "없음" },
      { value: 2, text: "재원생 학부모 상담" },
      { value: 3, text: "신규 학부모 상담" },
      { value: 4, text: "신규+재원생 학부모 상담" }
    ]
  },
  {
    id: "new-q5",
    text: "수업계획 수립 및 시간표 작성 경험이 있나요?",
    options: [
      { value: 1, text: "없음" },
      { value: 2, text: "수업반 수업계획수립 경험" },
      { value: 3, text: "학원전체 수업계획 경험" },
      { value: 4, text: "학원전체 수업계획 +시간표 작성" }
    ]
  },
  {
    id: "new-q6",
    text: "강사 및 스탭 관리 경험이 있나요?",
    options: [
      { value: 1, text: "없음" },
      { value: 2, text: "강사관리 경험" },
      { value: 3, text: "스탭관리 경험" },
      { value: 4, text: "강사+스탭 관리 경험" }
    ]
  }
];

export const BRAND_SWITCH_QUESTIONS: Question[] = [
  {
    id: "brand-q1",
    text: "현재 운영 형태는 무엇인가요?",
    options: [
      { value: 1, text: "유치원·어린이집" },
      { value: 2, text: "타과목 학원" },
      { value: 3, text: "종합학원" },
      { value: 4, text: "영어보습학원" },
      { value: 5, text: "어학원" }
    ]
  },
  {
    id: "brand-q2",
    text: "현재 운영 공간 규모는?",
    options: [
      { value: 1, text: "소형 (30평 미만)" },
      { value: 2, text: "소형 (30~40평)" },
      { value: 3, text: "중형 (40~50평)" },
      { value: 4, text: "중형 (50~70평)" },
      { value: 5, text: "대형 (80평 이상)" }
    ]
  },
  {
    id: "brand-q3",
    text: "현재 재원생 규모는?",
    options: [
      { value: 1, text: "30명 이하" },
      { value: 2, text: "30~50명" },
      { value: 3, text: "50~100명" },
      { value: 4, text: "100~200명" },
      { value: 5, text: "200명 이상" }
    ]
  },
  {
    id: "brand-q4",
    text: "영어학원 원장 경력이 있나요?",
    options: [
      { value: 1, text: "없음" },
      { value: 2, text: "1년 미만" },
      { value: 3, text: "1~3년" },
      { value: 4, text: "3~5년" },
      { value: 5, text: "5년 이상" }
    ]
  },
  {
    id: "brand-q5",
    text: "영어 수업 경력이 있나요?",
    options: [
      { value: 1, text: "없음" },
      { value: 2, text: "1년 미만" },
      { value: 3, text: "1~3년" },
      { value: 4, text: "3~5년" },
      { value: 5, text: "5년 이상" }
    ]
  },
  {
    id: "brand-q6",
    text: "브랜드 전환을 위해 투자 가능한 자본은?",
    options: [
      { value: 1, text: "1천만원 미만" },
      { value: 2, text: "1천만원~3천만원" },
      { value: 3, text: "3천만원~5천만원" },
      { value: 4, text: "5천만원~7천만원" },
      { value: 5, text: "7천만원 이상" }
    ]
  },
  {
    id: "brand-q7",
    text: "지역내 학부모 소득(건강보험료 기준)은?",
    options: [
      { value: 1, text: "없음" },
      { value: 2, text: "월 10만원 내외 (약 월 400만원)" },
      { value: 3, text: "월 20만원 내외 (약 월 700만원)" },
      { value: 4, text: "월 30만원 내외 (약 월 900만원)" },
      { value: 5, text: "월 40만원 이상(약 월 1000만원 이상)" }
    ]
  },
  {
    id: "brand-q8",
    text: "지역내 초등학생수는?",
    options: [
      { value: 1, text: "1,000명 미만" },
      { value: 2, text: "1,000~1,500명" },
      { value: 3, text: "1,500~2,500명" },
      { value: 4, text: "2,500~3,500명" },
      { value: 5, text: "3,500명 이상" }
    ]
  }
];

export const COMPETENCY_GRADES = {
  S: { min: 27, max: 30, label: "S등급", desc: "즉시 개원 가능", flow: "영어학원 창업을 위한 역량이 매우 우수합니다. 수업, 운영, 상담 및 조직관리 경험이 충분하여 성공 가능성이 높습니다." },
  A: { min: 23, max: 26, label: "A등급", desc: "우수", flow: "창업 역량이 우수합니다. 일부 보완을 통해 안정적인 개원이 가능합니다." },
  B: { min: 19, max: 22, label: "B등급", desc: "보완 후 개원 가능", flow: "창업 가능성은 있으나 운영 시스템과 학생 모집 전략에 대한 보완이 필요합니다." },
  C: { min: 15, max: 18, label: "C등급", desc: "준비 필요", flow: "개원 전 교육 및 실무 경험 확보를 추천합니다." },
  D: { min: 0, max: 14, label: "D등급", desc: "창업 역량 보완 필요", flow: "현재 단계에서는 충분한 준비 후 창업을 검토하는 것을 추천합니다." }
};

export const LEAD_GRADES = {
  S: { label: "S급 리드", duration: "개원 예정일까지 2개월 이내", desc: "개원 초읽기 단계 - 즉각 집중 컨설팅 착수 추천" },
  A: { label: "A급 리드", duration: "2~3개월 이내", desc: "최적 준비 착수 단계 - 상세 지역 상권분석 및 입지선정 진행" },
  B: { label: "B급 리드", duration: "3~6개월 이내", desc: "선행 준비 단계 - 본사 사업설명회 참석 및 자본 가이드라인 컨설팅" },
  C: { label: "C급 리드", duration: "6개월 이상", desc: "장기 탐색 단계 - 지속적 유대 형성 및 개원 정기 정보 메일 전송" }
};
