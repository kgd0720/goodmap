import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import multer from "multer";
import { put } from "@vercel/blob";
import { calculateAnalysis, getQuestionFeedback, generateCounselorOpinion } from "./src/utils/analysis";
import { Question } from "./src/types";
import { NEW_FRANCHISE_QUESTIONS, BRAND_SWITCH_QUESTIONS } from "./src/data/questionsData";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));

// Initialize Gemini API client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// DB files paths
const SUBMISSIONS_FILE = path.join(process.cwd(), "submissions_db.json");
const CONSULTANTS_FILE = path.join(process.cwd(), "consultants_db.json");
const QUESTIONS_FILE = path.join(process.cwd(), "questions_db.json");
const COMMENTS_FILE = path.join(process.cwd(), "comments_db.json");
const BRAND_CONFIG_FILE = path.join(process.cwd(), "brand_config.json");

// Serve uploaded brochure files
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use("/uploads", express.static(UPLOADS_DIR));

// Configure multer storage for robust multipart file uploads
const multerFn = (typeof multer === "function" ? multer : (multer as any).default) as typeof multer;
const storage = multerFn.memoryStorage();
const upload = multerFn({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024 // 200MB limit
  }
});

// Seed a dummy PDF if it doesn't exist so initial downloads do not error out
const DUMMY_PDF_PATH = path.join(UPLOADS_DIR, "KY_Academy_Premium_Brochure_2026.pdf");
if (!fs.existsSync(DUMMY_PDF_PATH)) {
  fs.writeFileSync(
    DUMMY_PDF_PATH,
    "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 54 >>\nstream\nBT /F1 24 Tf 100 700 Td (KY Academy Premium Brochure) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000210 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n313\n%%EOF",
    "utf-8"
  );
}

interface Applicant {
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
  englishSpeaking?: "유창" | "기본" | "불가";
  personality: "내향형" | "외향형";
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
  desiredArea?: number;
  regionalTier?: string;
  calculatedBudget?: number;
  myCapital?: number;
}

interface OptionComment {
  franchiseType: "신규 창업" | "브랜드 전환";
  questionIndex: number;
  questionText: string;
  score: number;
  scoreText: string;
  comment: string;
}

// Initial mockup data to populate dashboard beautifully
const SEEDED_APPLICANTS: Applicant[] = [
  {
    id: "app-1",
    appliedAt: "2026-06-12T14:24:00.000Z",
    name: "정혜선",
    birth: "1985-04",
    phone: "010-4421-9981",
    region: "서울 서초구",
    openingMonth: "2026-08", // S lead (2 months)
    franchiseType: "신규 창업",
    operationType: "개인사업",
    englishMajor: "전공",
    englishSpeaking: "유창",
    personality: "외향형",
    verificationCode: "1004",
    answers: [5, 4, 4, 5, 4, 4], // total: 26
    totalScore: 26,
    competencyRank: "A",
    leadRank: "S",
    counselorName: "김고려 컨설턴트",
    counselorStatus: "상권분석",
    aiReport: "정혜선 원장님의 외향적 성향과 풍부한 상담 역량을 고려하였을 때, 학부모 설명회를 조기에 개최하여 서초구 지역의 교육열 높은 학부모 수요층을 신속하게 선점하는 전략을 극히 추천드립니다."
  },
  {
    id: "app-2",
    appliedAt: "2026-06-13T09:12:00.000Z",
    name: "박건우",
    birth: "1978-11",
    phone: "010-3882-1200",
    region: "경기도 안양시",
    openingMonth: "2026-09", // A lead (2-3 months)
    franchiseType: "브랜드 전환",
    operationType: "법인",
    englishMajor: "비전공",
    englishSpeaking: "기본",
    personality: "내향형",
    verificationCode: "2026",
    answers: [5, 5, 5, 4, 4, 5], // total: 28
    totalScore: 28,
    competencyRank: "S",
    leadRank: "A",
    counselorName: "이오픈 컨설턴트",
    counselorStatus: "계약진행",
    aiReport: "박건우 원장님은 이미 넓은 규모의 교육 시설과 다수의 재원생을 관리해 오신 고경력 운영자입니다. 브랜드 전환을 위한 1억 5천만 원 이상의 충분한 가용 자본을 갖추고 있으므로, 고급스러운 고려대학교 협력 브랜드 감성의 내부 리모델링과 프리미엄 클래스 신설에 집중함으로써 객단가를 상승시키는 리포지셔닝 캠페인이 성장에 핵심 윤활유가 될 것입니다."
  },
  {
    id: "app-3",
    appliedAt: "2026-06-11T16:05:00.000Z",
    name: "이지영",
    birth: "1992-09",
    phone: "010-8224-5151",
    region: "대구 수성구",
    openingMonth: "2026-11", // B lead (3-6 months)
    franchiseType: "신규 창업",
    operationType: "동업",
    englishMajor: "전공",
    englishSpeaking: "유창",
    personality: "외향형",
    verificationCode: "7777",
    answers: [2, 3, 3, 4, 3, 2], // total: 17
    totalScore: 17,
    competencyRank: "C",
    leadRank: "B",
    counselorName: "박성공 팀장",
    counselorStatus: "1차상담",
    aiReport: "이지영 원장님은 풍부한 전공 지식과 우수한 커뮤니케이션 능력을 보유하고 있으나, 학원 경영 및 스태프 관리 경험이 다소 축소되어 있습니다. 동업 형태의 경영을 기획하고 있으므로 동업자 간 확실한 업무 요율 및 지출 분사를 명문화하는 한편, 본사에서 개설하는 원장 직무 및 리더십 아카데미 패키지를 필수로 이수하는 로드맵이 보강되어야 합니다."
  },
  {
    id: "app-4",
    appliedAt: "2026-06-10T11:40:00.000Z",
    name: "최성호",
    birth: "1983-02",
    phone: "010-2771-5004",
    region: "부산 해운대구",
    openingMonth: "2027-02", // C lead (6+ months)
    franchiseType: "브랜드 전환",
    operationType: "개인사업",
    englishMajor: "전공",
    englishSpeaking: "불가",
    personality: "내향형",
    verificationCode: "1004",
    answers: [4, 4, 3, 3, 3, 2], // total: 19
    totalScore: 19,
    competencyRank: "B",
    leadRank: "C",
    counselorName: "김고려 컨설턴트",
    counselorStatus: "보류"
  }
];

function getSubmissions(): Applicant[] {
  try {
    if (fs.existsSync(SUBMISSIONS_FILE)) {
      const content = fs.readFileSync(SUBMISSIONS_FILE, "utf-8");
      const list = JSON.parse(content) as Applicant[];
      let updated = false;
      list.forEach((app) => {
        if (app.counselorOpinion === undefined || app.counselorOpinion === null) {
          app.counselorOpinion = "";
          updated = true;
        }
      });
      if (updated) {
        saveSubmissions(list);
      }
      return list;
    }
  } catch (error) {
    console.error("Failed to read submissions JSON, resetting memory store", error);
  }
  const withOpinions = SEEDED_APPLICANTS.map(app => ({
    ...app,
    counselorOpinion: app.counselorOpinion || ""
  }));
  try {
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(withOpinions, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write initial submissions database:", error);
  }
  return withOpinions;
}

function saveSubmissions(applicants: Applicant[]) {
  try {
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(applicants, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save to json file, saving in memory logic.", err);
  }
}

const SEEDED_CONSULTANTS: Record<string, string> = {
  "1004": "김고려 컨설턴트",
  "2026": "이오픈 컨설턴트",
  "7777": "박성공 팀장",
  "1234": "김진단 전임 컨설턴트",
  "9999": "우수창업 전임 팀장"
};

function getConsultants(): Record<string, string> {
  try {
    if (fs.existsSync(CONSULTANTS_FILE)) {
      const content = fs.readFileSync(CONSULTANTS_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Failed to read consultants JSON, resetting to default seed", error);
  }
  try {
    fs.writeFileSync(CONSULTANTS_FILE, JSON.stringify(SEEDED_CONSULTANTS, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write initial consultants database:", error);
  }
  return SEEDED_CONSULTANTS;
}

function saveConsultants(consultants: Record<string, string>) {
  try {
    fs.writeFileSync(CONSULTANTS_FILE, JSON.stringify(consultants, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save consultants to json file:", err);
  }
}

interface QuestionsDB {
  newFranchise: Question[];
  brandSwitch: Question[];
}

// Comments APIs - Fetch Comments
function getQuestions(): QuestionsDB {
  try {
    if (fs.existsSync(QUESTIONS_FILE)) {
      const content = fs.readFileSync(QUESTIONS_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Failed to read questions JSON, resetting memory store", error);
  }
  const defaultQuestions: QuestionsDB = {
    newFranchise: NEW_FRANCHISE_QUESTIONS,
    brandSwitch: BRAND_SWITCH_QUESTIONS
  };
  try {
    fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(defaultQuestions, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write initial questions database:", error);
  }
  return defaultQuestions;
}

function saveQuestions(data: QuestionsDB) {
  try {
    fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save questions to json file:", err);
  }
}

function calculateCompetency(score: number, franchiseType: string = "신규 창업"): "S" | "A" | "B" | "C" | "D" {
  if (franchiseType === "브랜드 전환" || franchiseType === "브랜드전환") {
    if (score >= 36) return "S";
    if (score >= 30) return "A";
    if (score >= 23) return "B";
    if (score >= 13) return "C";
    return "D";
  } else {
    if (score >= 24) return "S";
    if (score >= 20) return "A";
    if (score >= 13) return "B";
    if (score >= 7) return "C";
    return "D";
  }
}

function calculateLead(openingMonth: string): "S" | "A" | "B" | "C" {
  try {
    const current = new Date("2026-06-13");
    const target = new Date(`${openingMonth}-15`);
    const diffMonths = (target.getFullYear() - current.getFullYear()) * 12 + (target.getMonth() - current.getMonth());
    if (diffMonths <= 2) return "S";
    if (diffMonths <= 3) return "A";
    if (diffMonths <= 6) return "B";
    return "C";
  } catch (e) {
    return "C";
  }
}

// 1. Get Applicants API
app.get("/api/applicants", (req: Request, res: Response) => {
  const list = getSubmissions();
  res.json({ success: true, applicants: list });
});

// Clear Applicants API
app.delete("/api/applicants", (req: Request, res: Response) => {
  try {
    saveSubmissions([]);
    res.json({ success: true, message: "모든 신청자 데이터가 확실하게 삭제되었습니다." });
  } catch (error: any) {
    console.error("Clear applicants error:", error);
    res.status(500).json({ success: false, error: "신청자 데이터 전체 삭제 처리 중 오류가 발생했습니다." });
  }
});

// Delete Single Applicant API
app.delete("/api/applicants/:id", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentList = getSubmissions();
    const updatedList = currentList.filter((app: any) => app.id !== id);
    saveSubmissions(updatedList);
    res.json({ success: true, message: "선택한 신청자 데이터가 성공적으로 삭제되었습니다." });
  } catch (error: any) {
    console.error("Delete single applicant error:", error);
    res.status(500).json({ success: false, error: "신청자 개별 삭제 처리 중 오류가 발생했습니다." });
  }
});

// Delete Batch Applicants API
app.post("/api/applicants/batch-delete", (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      res.status(400).json({ success: false, error: "삭제할 신청자 ID 배열이 필요합니다." });
      return;
    }
    const currentList = getSubmissions();
    const updatedList = currentList.filter((app: Applicant) => !ids.includes(app.id));
    saveSubmissions(updatedList);
    res.json({ success: true, count: ids.length, message: "선택된 모든 신청자 데이터가 성공적으로 일괄 삭제되었습니다." });
  } catch (error: any) {
    console.error("Batch delete applicants error:", error);
    res.status(500).json({ success: false, error: "신청자 일괄 삭제 처리 중 오류가 발생했습니다." });
  }
});

// Reset Questions API
app.delete("/api/questions", (req: Request, res: Response) => {
  try {
    const defaultQuestions: QuestionsDB = {
      newFranchise: NEW_FRANCHISE_QUESTIONS,
      brandSwitch: BRAND_SWITCH_QUESTIONS
    };
    saveQuestions(defaultQuestions);
    res.json({ success: true, message: "모든 커스텀 질문 문항이 삭제되고 기본값으로 복원되었습니다." });
  } catch (error: any) {
    console.error("Clear questions error:", error);
    res.status(500).json({ success: false, error: "질문 문항 삭제/복원 처리 중 오류가 발생했습니다." });
  }
});

// Reset Comments API
app.delete("/api/comments", (req: Request, res: Response) => {
  try {
    const defaultComments = getSeedComments();
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(defaultComments, null, 2), "utf-8");
    res.json({ success: true, message: "모든 커스텀 처방 코멘트가 삭제되고 기본값으로 복원되었습니다." });
  } catch (error: any) {
    console.error("Clear comments error:", error);
    res.status(500).json({ success: false, error: "처방 코멘트 삭제/복원 처리 중 오류가 발생했습니다." });
  }
});

// Get Consultants API
app.get("/api/consultants", (req: Request, res: Response) => {
  res.json({ success: true, codes: getConsultants() });
});

// Save Consultants API
app.post("/api/consultants", (req: Request, res: Response) => {
  try {
    const { codes } = req.body;
    if (!codes || typeof codes !== "object") {
      res.status(400).json({ success: false, error: "올바른 컨설턴트 코드 맵이 필요합니다." });
      return;
    }
    saveConsultants(codes);

    // Sync submissions to reflect deleted or renamed consultants
    try {
      const submissions = getSubmissions();
      let submissionsUpdated = false;
      submissions.forEach((sub) => {
        const code = sub.verificationCode;
        if (code && code !== "없음" && code !== "미할당") {
          const matchedName = codes[code];
          if (matchedName) {
            if (sub.counselorName !== matchedName) {
              sub.counselorName = matchedName;
              submissionsUpdated = true;
            }
          } else {
            // Deleted consultant
            if (sub.counselorName !== "미할당") {
              sub.counselorName = "미할당";
              submissionsUpdated = true;
            }
          }
        }
      });
      if (submissionsUpdated) {
        saveSubmissions(submissions);
      }
    } catch (syncErr) {
      console.error("Failed to sync submissions context on saving consultants:", syncErr);
    }

    res.json({ success: true, codes: getConsultants() });
  } catch (error: any) {
    console.error("Save consultants error:", error);
    res.status(500).json({ success: false, error: "컨설턴트 저장 중 서버 오류가 발생했습니다." });
  }
});

// Update single applicant info (counselor / status changes)
const updateApplicantHandler = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const currentList = getSubmissions();
    const index = currentList.findIndex(app => app.id === id);
    if (index === -1) {
      res.status(404).json({ success: false, error: "해당 신청자를 찾을 수 없습니다." });
      return;
    }
    
    const existing = currentList[index];
    
    // Check if status is updated
    if (updates.counselorStatus && updates.counselorStatus !== existing.counselorStatus) {
      const history = existing.statusHistory ? [...existing.statusHistory] : [];
      if (history.length === 0) {
        history.push({
          status: existing.counselorStatus || "신규접수",
          changedAt: existing.appliedAt || new Date().toISOString()
        });
      }
      history.push({
        status: updates.counselorStatus,
        changedAt: new Date().toISOString()
      });
      updates.statusHistory = history;
    }
    
    currentList[index] = { ...existing, ...updates };
    saveSubmissions(currentList);
    res.json({ success: true, applicant: currentList[index] });
  } catch (error: any) {
    console.error("Update applicant error:", error);
    res.status(500).json({ success: false, error: "상담 상태 갱신 중 오류가 발생했습니다." });
  }
};

app.patch("/api/applicants/:id", updateApplicantHandler);
app.put("/api/applicants/:id", updateApplicantHandler);

// Dynamic Questions API - Fetch Questions
app.get("/api/questions", (req: Request, res: Response) => {
  res.json({ success: true, ...getQuestions() });
});

// Dynamic Questions API - Save Questions
app.post("/api/questions", (req: Request, res: Response) => {
  try {
    const { newFranchise, brandSwitch } = req.body;
    if (!newFranchise || !brandSwitch) {
      res.status(400).json({ success: false, error: "신규 창업 및 브랜드 전환 문항 리스트가 모두 필요합니다." });
      return;
    }
    saveQuestions({ newFranchise, brandSwitch });
    res.json({ success: true, message: "문항이 정상적으로 저장되었습니다." });
  } catch (error: any) {
    console.error("Save questions error:", error);
    res.status(500).json({ success: false, error: "문항 저장 처리 중 오류가 발생했습니다." });
  }
});

// Bulk Insert Applicants/Evaluations API
app.post("/api/applicants/bulk", (req: Request, res: Response) => {
  try {
    const { list, overwrite } = req.body;
    if (!list || !Array.isArray(list)) {
      res.status(400).json({ success: false, error: "올바른 신청자 리스트 배열이 필요합니다." });
      return;
    }

    const currentList = getSubmissions();
    const consultantsMap = getConsultants();

    const newApplicants = list.map((item: any) => {
      const franchiseType = item.franchiseType || "신규 창업";
      const normalizedFranchise = (franchiseType === "브랜드전환" || franchiseType === "브랜드 전환") ? "브랜드 전환" : "신규 창업";
      const expectedLength = normalizedFranchise === "브랜드 전환" ? 8 : 6;

      const answers: number[] = [];
      for (let i = 0; i < expectedLength; i++) {
        answers.push(Number(item.answers?.[i] !== undefined ? item.answers[i] : 3));
      }

      const rawScore = answers.reduce((acc, val) => acc + val, 0);
      const totalScore = normalizedFranchise === "브랜드 전환"
        ? (answers.length === 8 ? rawScore : Math.round(rawScore * 40 / 30))
        : rawScore;
      const competencyRank = calculateCompetency(totalScore, franchiseType);
      const openingMonth = String(item.openingMonth || "2026-09");
      const leadRank = calculateLead(openingMonth);
      const verificationCode = String(item.verificationCode || "1004");
      const rawCounselor = consultantsMap[verificationCode] || item.counselorName || "본사 전임 컨설턴트";
      const counselorName = rawCounselor.replace(/\s*\(비활성\)$/, "");

      const applicant: Applicant = {
        id: item.id || `app-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        appliedAt: item.appliedAt || new Date().toISOString(),
        name: String(item.name || "이름없음"),
        birth: String(item.birth || "1985-01"),
        phone: String(item.phone || "010-0000-0000"),
        region: String(item.region || ""),
        openingMonth,
        franchiseType: (franchiseType === "브랜드전환" || franchiseType === "브랜드 전환") ? "브랜드 전환" : "신규 창업",
        operationType: item.operationType || "개인사업",
        englishMajor: item.englishMajor || "비전공",
        englishSpeaking: item.englishSpeaking || "유창",
        personality: item.personality || "외향형",
        verificationCode,
        answers,
        totalScore,
        competencyRank,
        leadRank,
        counselorName,
        counselorStatus: item.counselorStatus || "신규접수",
        inflowRoute: item.inflowRoute || "기타",
        mainConcern: item.mainConcern || ""
      };

      const computedDetails = calculateAnalysis(applicant);
      applicant.aiReport = item.aiReport || computedDetails.aiReport;
      applicant.counselorOpinion = item.counselorOpinion || "";

      return applicant;
    });

    if (overwrite === true) {
      // Clear old database before inserting
      saveSubmissions(newApplicants);
      res.json({ success: true, count: newApplicants.length, cleared: true });
    } else {
      // Merge or Prepend safely, avoiding duplicated IDs
      const updatedList = [...newApplicants, ...currentList];
      const uniqueList: Applicant[] = [];
      const seen = new Set();
      updatedList.forEach(app => {
        if (!seen.has(app.id)) {
          seen.add(app.id);
          uniqueList.push(app);
        }
      });

      saveSubmissions(uniqueList);
      res.json({ success: true, count: newApplicants.length, cleared: false });
    }
  } catch (error: any) {
    console.error("Bulk submit applicants error:", error);
    res.status(500).json({ success: false, error: "신청자 데이터 일괄 등록 처리 중 오류가 발생했습니다." });
  }
});

// 2. Submit Diagnosis API
app.post("/api/applicants", async (req: Request, res: Response) => {
  try {
    const {
      name,
      birth,
      phone,
      region,
      openingMonth,
      franchiseType,
      operationType,
      englishMajor,
      englishSpeaking,
      personality,
      verificationCode,
      answers,
      inflowRoute,
      mainConcern,
      // Budget Simulator properties
      desiredArea,
      regionalTier,
      calculatedBudget,
      myCapital
    } = req.body;

    const normalizedFranchise = (franchiseType === "브랜드전환" || franchiseType === "브랜드 전환") ? "브랜드 전환" : "신규 창업";
    const expectedLength = normalizedFranchise === "브랜드 전환" ? 8 : 6;

    if (!name || !phone || !franchiseType || !answers || answers.length !== expectedLength) {
      res.status(400).json({ success: false, error: `필수 입력 항목이 누락되었거나 답변 개수(${answers?.length || 0})가 올바르지 않습니다.` });
      return;
    }

    const rawScore = answers.reduce((acc: number, val: number) => acc + val, 0);
    const totalScore = normalizedFranchise === "브랜드 전환"
      ? (answers.length === 8 ? rawScore : Math.round(rawScore * 40 / 30))
      : rawScore;
    const competencyRank = calculateCompetency(totalScore, franchiseType);
    const leadRank = calculateLead(openingMonth);
    
    const rawCounselor = getConsultants()[verificationCode] || "본사 전임 컨설턴트";
    const counselorName = rawCounselor.replace(/\s*\(비활성\)$/, "");

    const newApplicant: Applicant = {
      id: "app-" + Date.now(),
      appliedAt: new Date().toISOString(),
      name,
      birth,
      phone,
      region,
      openingMonth,
      franchiseType,
      operationType,
      englishMajor,
      englishSpeaking: englishSpeaking || "유창",
      personality,
      verificationCode,
      answers,
      totalScore,
      competencyRank,
      leadRank,
      counselorName,
      counselorStatus: "신규접수",
      inflowRoute: inflowRoute || "기타",
      mainConcern: mainConcern || "",
      desiredArea: desiredArea || 30,
      regionalTier: regionalTier || "Tier 2",
      calculatedBudget: calculatedBudget || 11000,
      myCapital: myCapital || 8000
    };

    // Set standard computed consulting report as default/fallback
    const computedDetails = calculateAnalysis(newApplicant);
    newApplicant.aiReport = computedDetails.aiReport;
    newApplicant.counselorOpinion = "";

    // If Gemini client is running under API Key, generate custom report right away
    if (ai) {
      try {
        const prompt = `
          영어학원 창업 희망자 자가 진단 정보를 바탕으로, 고려대학교 협력 브랜드 프리미엄 교육 컨설턴트의 톤앤매너(신뢰성, 격조 있는 문체, 구체적 액션 플랜)로 '맞춤형 개원 컨설팅 가이드라인'을 국문 5줄 내외로 작성해 주세요.
          
          희망자 프로필:
          - 이름: ${name} (원장님으로 지칭할 것)
          - 가입유형: ${franchiseType}
          - 가용 역량 총합 점수: ${totalScore}점
          - 역량 등급: ${competencyRank}등급
          - 개원 예정 일자: ${openingMonth}
          - 운영 형태: ${operationType}
          - 영어 전공 여부: ${englishMajor}
          - 영어 회화 역량: ${englishSpeaking || "유창"}
          - 원장 성향: ${personality}
          - 주된 고민사항: ${mainConcern || "없음"}
          - 세부 점수 리스트: ${answers.join(", ")} (6개 문항, 각각 1~5점)
          - 시뮬레이션 희망 평수: ${newApplicant.desiredArea}평
          - 희망 지역 등급: ${newApplicant.regionalTier} (Tier 1: 1급지, Tier 2: 2급지, Tier 3: 3급지)
          - 총 추정 창업 예산: ${newApplicant.calculatedBudget ? Math.round(newApplicant.calculatedBudget).toLocaleString() : 11000}만원
          - 원장님 가용 자본금: ${newApplicant.myCapital ? Math.round(newApplicant.myCapital).toLocaleString() : 8000}만원
          
          참고할 표준 진단 보고서:
          "${computedDetails.aiReport}"

          답변 수칙:
          - 반드시 존칭을 사용하며(원장님), 진정성 있고 설득력 높은 어휘를 선택해 주세요.
          - 표준 진단 보고서에 맞춰, 경력유형(${computedDetails.typeName}), 추천지역, 추천개원형태, 추천규모, 추천인력구성 및 성향을 자연스럽게 녹여내어 격조 있는 한글 문체로 다듬어 주십시오.
          - 원장님이 조율하고 계시는 시뮬레이터 수치(${newApplicant.desiredArea}평, 총 예산 약 ${newApplicant.calculatedBudget}만원, 자본금 ${newApplicant.myCapital}만원)를 참고하여 예산 범위가 안정적으로 적합한지, 혹은 추가 제안(예: 교습소 전환, 본사 연계 금융 솔루션 활용 융자 조달 등)이 필요한지 유익한 재무적 코멘트를 격조 있는 컨설팅 명목으로 따뜻하게 섞어주세요.
          - 원장님이 적어주신 주된 고민사항(${mainConcern || "없음"})을 따뜻하게 공감 혹은 해결할 수 있는 실질적인 조언이나 응원의 메시지를 한두 문장 자연스럽게 포함해야 합니다.
          - 리드 관리 등급이나 리드등급(예: S급 리드, A급 등) 등 '리드' 관련 등급 및 순위 용어는 답변 내용에 절대 노출하거나 언급하지 마십시오.
          - 마크다운을 섞지 않은 순수한 줄글(텍스트) 형태로 작성해 주십시오. (문장 구분은 자연스러운 쉼표 및 온점 사용)
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
        });

        if (response && response.text) {
          newApplicant.aiReport = response.text.trim();
        }
      } catch (geminiError: any) {
        // Gracefully handle Gemini errors (including 429 RESOURCE_EXHAUSTED / quota / depleted credits)
        const errMsg = geminiError?.message || String(geminiError);
        if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("prepayment credits") || errMsg.includes("depleted")) {
          console.warn("Gemini API credits depleted or quota exceeded (429). Falling back gracefully to pre-computed premium local analytics report.");
        } else {
          console.warn("Gemini report generation fallback activated:", errMsg);
        }
      }
    }

    // Save to database
    const submissionsList = getSubmissions();
    submissionsList.unshift(newApplicant);
    saveSubmissions(submissionsList);

    res.json({ success: true, applicant: newApplicant });
  } catch (error: any) {
    console.error("Submit applicant checkup error:", error);
    res.status(500).json({ success: false, error: "상담 검사지 제출 과정에서 오류가 발생했습니다." });
  }
});

function getSeedCommentForNewFranchise(questionIndex: number, score: number): string {
  return getQuestionFeedback("신규 창업", questionIndex, score).comment;
}

function getSeedCommentForBrandSwitch(questionIndex: number, score: number): string {
  return getQuestionFeedback("브랜드 전환", questionIndex, score).comment;
}

function getSeedComments(): OptionComment[] {
  const qdb = getQuestions();
  const list: OptionComment[] = [];

  // New Franchise
  qdb.newFranchise.forEach((q, qidx) => {
    for (let score = 1; score <= 5; score++) {
      const opt = q.options.find(o => o.value === score) || q.options[q.options.length - 1];
      const scoreText = opt ? opt.text : `선택지 ${score}`;
      list.push({
        franchiseType: "신규 창업",
        questionIndex: qidx,
        questionText: q.text,
        score: score,
        scoreText: scoreText,
        comment: getSeedCommentForNewFranchise(qidx, score)
      });
    }
  });

  // Brand Switch
  qdb.brandSwitch.forEach((q, qidx) => {
    for (let score = 1; score <= 5; score++) {
      const opt = q.options.find(o => o.value === score) || q.options[q.options.length - 1];
      const scoreText = opt ? opt.text : `선택지 ${score}`;
      list.push({
        franchiseType: "브랜드 전환",
        questionIndex: qidx,
        questionText: q.text,
        score: score,
        scoreText: scoreText,
        comment: getSeedCommentForBrandSwitch(qidx, score)
      });
    }
  });

  return list;
}

function getCommentsList(): OptionComment[] {
  try {
    if (fs.existsSync(COMMENTS_FILE)) {
      const content = fs.readFileSync(COMMENTS_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Failed to read comments JSON file:", err);
  }
  const defaultComments = getSeedComments();
  try {
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(defaultComments, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write initial comments JSON:", err);
  }
  return defaultComments;
}

// Comments APIs
app.get("/api/comments", (req: Request, res: Response) => {
  res.json({ success: true, comments: getCommentsList() });
});

app.post("/api/comments", (req: Request, res: Response) => {
  try {
    const { comments } = req.body;
    if (!comments || !Array.isArray(comments)) {
      res.status(400).json({ success: false, error: "올바른 코멘트 배열 데이터가 필요합니다." });
      return;
    }
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2), "utf-8");
    res.json({ success: true, message: "선택지별 처방 코멘트가 정상 저장되었습니다." });
  } catch (error: any) {
    console.error("Failed to save comments:", error);
    res.status(500).json({ success: false, error: "코멘트 저장 중 오류가 발생했습니다." });
  }
});

// Brand Configuration APIs
const DEFAULT_BRAND_CONFIG = {
  brochures: [
    {
      id: "b-default-1",
      title: "KY Academy 브랜드 가이드북",
      description: "KY Academy의 독보적인 8단계 커리큘럼, 맞춤 인테리어 및 본사 무상 개원 지원 패키지 총괄 요약 가이드북",
      url: "/uploads/KY_Academy_Premium_Brochure_2026.pdf",
      filename: "KY_Academy_Premium_Brochure_2026.pdf",
      uploadedAt: new Date().toISOString()
    }
  ],
  videos: [
    {
      id: "v-default-1",
      title: "KY Academy 브랜드 비전 & 창업 스토리",
      duration: "2분 30초",
      desc: "왜 학부모들은 수많은 어학원 중에서 KY Academy를 선택하는가? 10년간의 교육 설계와 브랜드 철학을 담은 프리미엄 메인 홍보 비디오입니다.",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      youtubeId: "dQw4w9WgXcQ",
      thumbnailBg: "from-[#0B3B24] to-[#14532D]"
    },
    {
      id: "v-default-2",
      title: "실제 가맹캠퍼스 원장 생생한 운영 스토리",
      duration: "3분 15초",
      desc: "개인 학원에서 KY 브랜드로 전환 후 3달 만에 원생 150명을 돌파한 대치캠퍼스 원장님의 진심 어린 실전 운영 노하우와 감동적인 스토리.",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      youtubeId: "dQw4w9WgXcQ",
      thumbnailBg: "from-[#C5A059]/40 to-[#0B3B24]"
    },
    {
      id: "v-default-3",
      title: "AI 멀티미디어 교실 & 스마트 수업 실전 시연",
      duration: "1분 50초",
      desc: "아이가 태블릿 앞에 앉아 스피킹 훈련을 하고, 실시간으로 교정 피드백 리포트가 학부모 모바일로 자동 발송되는 쾌적한 1인 스마트수업 체험 영상.",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      youtubeId: "dQw4w9WgXcQ",
      thumbnailBg: "from-[#1E293B] to-[#0F172A]"
    }
  ]
};

function getBrandConfig() {
  try {
    if (fs.existsSync(BRAND_CONFIG_FILE)) {
      const content = fs.readFileSync(BRAND_CONFIG_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Failed to read brand config, resetting to default:", err);
  }
  try {
    fs.writeFileSync(BRAND_CONFIG_FILE, JSON.stringify(DEFAULT_BRAND_CONFIG, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write initial brand config:", err);
  }
  return DEFAULT_BRAND_CONFIG;
}

function saveBrandConfig(config: any) {
  try {
    if (fs.existsSync(BRAND_CONFIG_FILE)) {
      try {
        const oldContent = fs.readFileSync(BRAND_CONFIG_FILE, "utf-8");
        const oldConfig = JSON.parse(oldContent);
        const oldBrochures = oldConfig.brochures || [];
        const newBrochures = config.brochures || [];
        
        // Find brochures that exist in the old configuration but are missing in the new one
        const deletedBrochures = oldBrochures.filter((oldB: any) => !newBrochures.some((newB: any) => String(newB.id).trim() === String(oldB.id).trim()));
        
        deletedBrochures.forEach((b: any) => {
          if (b.url && b.url.startsWith("/uploads/")) {
            try {
              const decodedUrl = decodeURIComponent(b.url);
              const fileName = path.basename(decodedUrl);
              // Protect the default sample file
              if (fileName !== "KY_Academy_Premium_Brochure_2026.pdf") {
                const filePath = path.join(UPLOADS_DIR, fileName);
                if (fs.existsSync(filePath)) {
                  fs.unlinkSync(filePath);
                  console.log(`Physically deleted orphan uploaded brochure file: ${filePath}`);
                }
              }
            } catch (urlErr) {
              console.error("Failed to decode or delete orphan file:", urlErr);
            }
          }
        });
      } catch (err) {
        console.error("Failed to clean up deleted brochure files from disk:", err);
      }
    }
    fs.writeFileSync(BRAND_CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save brand config:", err);
    throw err;
  }
}

app.get("/api/brand-config", (req: Request, res: Response) => {
  res.json({ success: true, config: getBrandConfig() });
});

app.post("/api/brand-config", (req: Request, res: Response) => {
  try {
    const { brochures, videos } = req.body;
    const currentConfig = getBrandConfig();
    
    // Support robust partial updates / merging to prevent data loss or validation crashes
    const finalBrochures = brochures !== undefined ? brochures : currentConfig.brochures;
    const finalVideos = videos !== undefined ? videos : currentConfig.videos;

    if (!finalBrochures && !finalVideos) {
      res.status(400).json({ success: false, error: "저장할 가맹브로슈어 혹은 홍보동영상 목록이 유효하지 않습니다." });
      return;
    }

    saveBrandConfig({ brochures: finalBrochures || [], videos: finalVideos || [] });
    res.json({ success: true, message: "브랜드 구성 정보가 본사 서버에 안전하게 보존되었습니다." });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "브랜드 구성 저장 실패: " + err.message });
  }
});

// Multer error handler for upload-brochure (must be 4-argument middleware)
const handleUploadBrochureSuccess = async (req: Request, res: Response) => {
  try {
    if (req.file) {
      let decodedName = req.file.originalname;
      try {
        const hasKorean = /[가-힣]/.test(req.file.originalname);
        if (!hasKorean) {
          const decoded = Buffer.from(req.file.originalname, "latin1").toString("utf8");
          if (/[가-힣]/.test(decoded)) {
            decodedName = decoded;
          }
        }
      } catch (e) {
        // fallback to original
      }
      const ext = path.extname(decodedName);
      const base = path.basename(decodedName, ext).replace(/[^a-zA-Z0-9가-힣_.-]/g, "_");
      const safeFilename = `${base}_${Date.now()}${ext}`;

      // Save file locally to uploads folder first
      const localPath = path.join(UPLOADS_DIR, safeFilename);
      fs.writeFileSync(localPath, req.file.buffer);

      let url = `/uploads/${safeFilename}`;

      // Try uploading to Vercel Blob if token is configured
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          const blob = await put(`uploads/${safeFilename}`, req.file.buffer, {
            access: 'public',
            addRandomSuffix: false,
          });
          if (blob && blob.url) {
            url = blob.url;
          }
        } catch (blobErr: any) {
          console.warn("Failed to upload to Vercel Blob, falling back to local file. Error:", blobErr.message);
        }
      }

      res.json({ success: true, filename: safeFilename, url });
      return;
    }
    res.status(400).json({ success: false, error: "파일이 수신되지 않았습니다." });
  } catch (err: any) {
    console.error("Multipart file upload error:", err);
    res.status(500).json({ success: false, error: "파일 업로드 실패: " + err.message });
  }
};

app.post("/api/upload-brochure", (req: Request, res: Response, next: any) => {
  upload.single("file")(req, res, (err: any) => {
    if (err) {
      // Handle multer-specific errors gracefully
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(413).json({ success: false, error: `파일이 너무 큽니다. 최대 200MB까지 업로드 가능합니다. (오류: ${err.message})` });
      } else {
        console.error("Multer upload error:", err);
        res.status(500).json({ success: false, error: "파일 업로드 처리 중 오류: " + err.message });
      }
      return;
    }
    handleUploadBrochureSuccess(req, res);
  });
});

app.post("/api/upload-brochure-base64", async (req: Request, res: Response) => {
  try {
    const { filename, base64Data } = req.body;
    if (!filename || !base64Data) {
      res.status(400).json({ success: false, error: "파일명과 파일 데이터(base64)가 필요합니다." });
      return;
    }

    // Strip base64 meta prefix if exists (e.g. "data:application/pdf;base64,")
    const cleanBase64 = base64Data.replace(/^data:.*?;base64,/, "");
    const buffer = Buffer.from(cleanBase64, "base64");
    
    // Create clean safe filename
    const ext = path.extname(filename);
    const base = path.basename(filename, ext).replace(/[^a-zA-Z0-9가-힣_.-]/g, "_");
    const safeFilename = `${base}_${Date.now()}${ext}`;
    
    // Save file locally to uploads folder first
    const localPath = path.join(UPLOADS_DIR, safeFilename);
    fs.writeFileSync(localPath, buffer);

    let url = `/uploads/${safeFilename}`;

    // Try uploading to Vercel Blob if token is configured
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(`uploads/${safeFilename}`, buffer, {
          access: 'public',
          addRandomSuffix: false,
        });
        if (blob && blob.url) {
          url = blob.url;
        }
      } catch (blobErr: any) {
        console.warn("Failed to upload to Vercel Blob, falling back to local file. Error:", blobErr.message);
      }
    }

    res.json({ success: true, filename: safeFilename, url });
  } catch (err: any) {
    console.error("Base64 file upload error:", err);
    res.status(500).json({ success: false, error: "파일 우회 업로드 실패: " + err.message });
  }
});

// Serve frontend assets
async function serveApp() {
  if (process.env.NODE_ENV !== "production") {
    // Integrate Vite development server middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Opening Map] Server running on http://localhost:${PORT}`);
  });
}

serveApp().catch((err) => {
  console.error("Failed to launch Express + Vite server:", err);
});
