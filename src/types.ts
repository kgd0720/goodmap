export interface Applicant {
  id: string;
  appliedAt: string;
  name: string;
  birth: string;
  phone: string;
  region: string;
  openingMonth: string; // e.g. "2026-09"
  franchiseType: "신규 창업" | "브랜드 전환";
  operationType: "개인사업" | "동업" | "법인";
  englishMajor: "전공" | "비전공";
  personality: "내향형" | "외향형";
  englishSpeaking?: "유창" | "기본" | "불가";
  verificationCode: string;
  answers: number[]; // 6 answers, each 1 to 5
  totalScore: number;
  competencyRank: "S" | "A" | "B" | "C" | "D";
  leadRank: "S" | "A" | "B" | "C";
  counselorName: string;
  counselorStatus: "신규접수" | "1차상담" | "상권분석" | "설명회참석" | "계약진행" | "계약완료" | "보류";
  aiReport?: string;
  counselorOpinion?: string;
  inflowRoute?: string;
  mainConcern?: string;
  consultantInquiryRequested?: boolean;
  statusHistory?: { status: string; changedAt: string }[];
  // Budget Simulator Integrations
  desiredArea?: number;      // desired size in 'pyeong' (e.g., 20 - 100)
  regionalTier?: string;     // Tier 1, Tier 2, Tier 3 regional category
  calculatedBudget?: number; // total estimated setup cost in ten-thousand KRW
  myCapital?: number;        // applicant's available cash in ten-thousand KRW
}

export interface Question {
  id: string;
  text: string;
  options: {
    value: number;
    text: string;
  }[];
}
