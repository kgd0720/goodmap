import { Applicant } from "../types";

export interface AnalysisDetails {
  typeCode: "A" | "B" | "C" | "D";
  typeName: string;
  recRegions: string[];
  recFranchiseStyles: string[];
  recStaffSetup: string[];
  recReason: string;
  resultComment: string;
  
  capitalLevel: number;
  capitalRec: string;
  capitalRecSize: string;
  
  personalityStrengths: string[];
  personalityRecOperation: string[];
  
  leadRank: "S" | "A" | "B" | "C";
  leadDuration: string;
  leadInstruction: string;
  recOpeningMonth: string;
  
  aiReport: string;
}

export function calculateAnalysis(app: Partial<Applicant> & { answers?: number[] }): AnalysisDetails {
  const rawFranchiseType = (app.franchiseType as string) || "신규 창업";
  const franchiseType = (rawFranchiseType === "브랜드전환" || rawFranchiseType === "브랜드 전환") ? "브랜드 전환" : "신규 창업";
  const answers = app.answers || [3, 3, 3, 3, 3, 3];
  const personality = app.personality || "외향형";
  const openingMonth = app.openingMonth || "2026-09";
  const name = app.name || "원장님";

  // 1. Core Career Type Classification
  // In "신규 창업": Q1 (Index 0) is Director experience, Q2 (Index 1) is Instructor experience.
  // In "브랜드 전환": Q4 (Index 3) is Director experience, Q5 (Index 4) is Instructor experience.
  let q1Value = 3; // default
  let q2Value = 3; // default

  if (franchiseType === "신규 창업") {
    q1Value = answers[0] !== undefined ? answers[0] : 3;
    q2Value = answers[1] !== undefined ? answers[1] : 3;
  } else {
    q1Value = answers[3] !== undefined ? answers[3] : 3;
    q2Value = answers[4] !== undefined ? answers[4] : 3;
  }

  // q1Value (Director Exp): 1=없음 or 타과목 운영, 2=초등영어학원 1년 미만 or 입시영어, 3=초등영어학원 1~3년, 4=초등영어학원 3년이상, 5=초등어학원 운영
  // q2Value (Instructor Exp): 1=전혀 없음, 2=1년 미만, 3=1~3년, 4=3~5년, 5=5년 이상
  const hasDirectorExp = q1Value >= 3;  // Solid experience as a director (1 year or more)
  const hasInstructorExp = q2Value >= 3; // Solid experience as an instructor (1 year or more)

  let typeCode: "A" | "B" | "C" | "D" = "A";
  let typeName = "";
  let recRegions: string[] = [];
  let recFranchiseStyles: string[] = [];
  let recStaffSetup: string[] = [];
  let recReason = "";
  let resultComment = "";

  // Dynamic assignment based on the owner's exact experience level rules provided by the user
  if (!hasDirectorExp && !hasInstructorExp) {
    // 1-1) No experience at all
    typeCode = "A";
    typeName = "실속 창업 준비형 (경험 없음)";
    recRegions = ["항아리 상권", "배후 단독 아파트 단지", "경쟁이 적고 배후가 밀집된 로컬 구역"];
    recFranchiseStyles = ["실속형 교습소", "소형 프랜차이즈 영어교실"];
    recStaffSetup = ["본사 정기 운영 슈퍼바이징 매칭", "파트타임 전문 강사 채용"];
    recReason = "원장 경영 실무와 어학 강의 경험이 모두 무경험 상태이므로 리스크를 최대로 억제해야 합니다.";
    resultComment = "원장님은 영어 강의 및 학원 경영 경험이 거의 없으시므로 소자본 개원이 적합합니다. 리스크 관리를 위해 초기 고정비 지출을 억제하고, 경쟁 학원의 세가 드센 중심가보다는 배후 거주 세대가 독점되는 '항아리 상권'에서 '중소형 실속형 교습소나 소형 공부방' 형태로 출발하여 운영 시스템을 본사와 함께 순환 체계화해 가는 전략이 가장 영리합니다.";
  } else if (!hasDirectorExp && hasInstructorExp) {
    // 1-2) Only Instructor experience (No/low director experience)
    typeCode = "C";
    typeName = "교육 실무 전문가형 (강사 경험 중심)";
    recRegions = ["안정형 항아리 상권", "복합 주거 배후 단지", "경쟁 구도가 느슨한 주거 밀집 상가"];
    recFranchiseStyles = ["밀착 학습형 영어교습소", "소형 영어 전문 학원"];
    recStaffSetup = ["초기 상담 전담 실장", "본사 제공 학업 상담 바인더 시스템 완비"];
    recReason = "수업 전문 역량은 매우 뛰어나 일대일 만족도가 크나, 복잡한 조직 경영이나 학원 상담 경험을 안전화하기 위해 경쟁이 덜한 항아리 상권을 권장합니다.";
    resultComment = "원장님은 축적된 강의 역량이 아주 우수하여 교실 장악력과 교육 성과는 바로 입증할 수 있는 우수형에 속합니다. 반면, 복잡한 신규 입생 학부모 개척 및 학원 보모 행정은 생소할 수 있으므로, 다수의 대형 프랜차이즈 간 경쟁이 살벌한 신도시 핵심가보다는 로컬 밀착 관리가 수월하고 배후 수요가 탄탄히 갇혀 있는 '항아리 상권'에서 '실속형 중소형(15~30평 내외)' 규모로 밀도 있게 출발하는 전략이 절대적으로 우수한 승률을 자랑합니다.";
  } else if (hasDirectorExp && hasInstructorExp) {
    // 2) Both Rich Instructor & Director experience
    typeCode = "D";
    typeName = "신도시 성장형 마스터 (원장·강사 올인원)";
    recRegions = ["계획 신도시 핵심 학원가", "대규모 신축 아파트 입주 단지", "프리미엄 교육 열기가 치열한 중심 상업지구"];
    recFranchiseStyles = ["초중등 정통 프리미엄 어학원", "중대형 거점 어학원"];
    recStaffSetup = ["수강 트래픽을 감당할 전임 강사진", "학원 관리자 전문 리더십 관리"];
    recReason = "풍부한 실무 강의력 and 세련된 학원 경영 마인드를 모두 완성도 있게 보유하여, 하이엔드 어학 프리미엄 니즈가 터지는 성장지대 추천이 제격입니다.";
    resultComment = "원장님은 직접 수강 지도가 가능한 엘리트 티칭 능력과 함께 학원 세무/상담/인력 조직 관리에 이르기까지 정평 난 경영 감각이 고루 화합된 최고 등급의 올라운더 원장님이십니다. 이러한 고스펙 자산은 이미 경쟁이 화포화된 저밀지역보다, 프리미엄 스피킹 및 초중등전문 영어학원 브랜드 가치를 위해 기꺼이 수강 단가를 지불하는 학부모들이 인입되는 '계획 신도시 및 대규모 택지지구'에서 '중형 이상의 웅장한 브랜드 학원(35평~50평형 이상)' 규모로 과감히 진출하여 로컬 랜드마크 학원으로 승격을 주도하기에 완벽히 타당합니다.";
  } else {
    // 3) Ambiguous Cases (e.g. Has Director experience, but Low English Instructor experience. Or others if unmatched)
    typeCode = "B";
    typeName = "시스템 경영 관리형 (경영 경험 중심)";
    recRegions = ["안정 주거형 상가 지구", "초·중학군 인접 중심보습 상권", "경쟁이 보통 수준인 복합 연합가"];
    recFranchiseStyles = ["관리 중심형 영어학원", "중형 영어 보습 어학원"];
    recStaffSetup = ["실력 있는 파트너 전임 강사 영입", "본사 자동 시스템 및 멀티미디어 교재 의존 모델 구현"];
    recReason = "조직 관리와 경영 시스템 구축력이 우수하므로, 원장 직강의 부재를 본사의 검증된 스마트 자동 학습 교재 및 우수 전임강사 위임 모델로 극복 가능한 안정형 보습 상권을 매칭합니다.";
    resultComment = "원장님은 조직원 통솔력과 경영 및 행정 기획력에 뛰어난 카리스마가 있으나, 직접적인 영어 직강 노하우는 영입 및 본사 솔루션의 힘이 필수적인 구조입니다. 따라서 무리한 신도시 확장식 베팅보다, 지역 중산층 아파트 인근에 풍부하게 검증된 '안정 주거 상권'에서 '실속형 중형 규모(25~45평 내외)'의 입지를 다진 후, 본 명문 교육 브랜드의 스마트 디바이스 어학 솔루션을 전면 도입하여 강사 이직에 휘둘리지 않고 통제 가능한 자동화 시스템 매장으로 쾌적하게 인입하셔야 안정적인 승산이 높습니다.";
  }

  // 2. Capital-Scale Recommendations
  // In "신규 창업": Q3 (Index 2) is capital
  // In "브랜드 전환": Q6 (Index 5) is capital
  let capitalValue = 3;
  if (franchiseType === "신규 창업") {
    capitalValue = answers[2] !== undefined ? answers[2] : 3;
  } else {
    capitalValue = answers[5] !== undefined ? answers[5] : 3;
  }

  let capitalRec = "";
  let capitalRecSize = "";

  if (franchiseType === "브랜드 전환") {
    // Brand Switch capital/size matching based on active center size (Index 1) and type (Index 0)
    const currentSizeIdx = answers[1] !== undefined ? answers[1] : 2;
    const currentTypeIdx = answers[0] !== undefined ? answers[0] : 3;

    // Physical blueprint matched to existing space
    switch (currentSizeIdx) {
      case 1:
        capitalRecSize = "소형 (30평 미만)";
        break;
      case 2:
        capitalRecSize = "소형 (30~40평)";
        break;
      case 3:
        capitalRecSize = "중형 (40~50평)";
        break;
      case 4:
        capitalRecSize = "중형 (50~70평)";
        break;
      case 5:
      default:
        capitalRecSize = "대형 (80평 이상)";
        break;
    }

    // Recommended converting form matched to current focus
    switch (currentTypeIdx) {
      case 1:
      case 2:
        capitalRec = "초·중등 정통 영어학원 전환 (융합형 모델)";
        break;
      case 3:
        capitalRec = "영어 단과 및 특화형 브랜드 전환 학원";
        break;
      case 4:
        capitalRec = "스마트 밀착형 고려대 협력 영어 전문학원";
        break;
      case 5:
      default:
        capitalRec = "프리미엄 하이엔드 어학원 브랜드 전환";
        break;
    }
  } else {
    // 2. Capital-Scale Recommendations for "신규 창업"
    // Sync scale matching with the user's career suggestion context for harmony
    if (!hasDirectorExp) {
      // Under low/no director experience, we strongly guide to mid-small cozy scale
      switch (capitalValue) {
        case 1:
          capitalRec = "실속형 영어 교습소";
          capitalRecSize = "중소형 규모 (12~18평형권)";
          break;
        case 2:
          capitalRec = "관리 밀착형 영어 교습소 / 소형 학원";
          capitalRecSize = "중소형 규모 (18~25평형권)";
          break;
        case 3:
        case 4:
        case 5:
        default:
          capitalRec = "내실 위주 주거단지 거점형 영어 학원";
          capitalRecSize = "실속 주거 특화 중소형 규모 (25~30평형권)";
          break;
      }
    } else {
      // Solid executive background allows expanding the physical blueprint safely
      switch (capitalValue) {
        case 1:
          capitalRec = "구획 최적화 실내 알찬 학사";
          capitalRecSize = "콤팩트 실속 규모 (20~28평형권)";
          break;
        case 2:
          capitalRec = "스마트 교안 거점 영어 학원";
          capitalRecSize = "중형 표준 규모 (28~35평형권)";
          break;
        case 3:
          capitalRec = "정통 하이엔드 어학원";
          capitalRecSize = "중형 주도 규모 (35~45평형권)";
          break;
        case 4:
          capitalRec = "거점 주도 멀티 어학 단지";
          capitalRecSize = "중대형 랜드마크 규모 (45~60평형권)";
          break;
        case 5:
        default:
          capitalRec = "시그니처 프리미엄 어학타운";
          capitalRecSize = "대형 스마트 캠퍼스 규모 (70평형 이상 대형)";
          break;
      }
    }
  }

  // 3. Personality Analysis
  let personalityStrengths: string[] = [];
  let personalityRecOperation: string[] = [];

  if (personality === "외향형") {
    personalityStrengths = ["학부모 상담", "학생 모집", "설명회 진행"];
    personalityRecOperation = ["원장 직강형", "설명회 중심 마케팅"];
  } else {
    personalityStrengths = ["학습관리", "시스템 운영", "교육품질 관리"];
    personalityRecOperation = ["관리형 원장", "상담실장 활용"];
  }

  // 4. Target Opening Month (Lead Rank) calculations
  // Fixed Current Month: 2026-06
  let leadRank: "S" | "A" | "B" | "C" = "C";
  let leadDuration = "";
  let leadInstruction = "";
  let recOpeningMonth = "";

  const rawSum = answers.reduce((acc, val) => acc + val, 0);
  const totalScoreSub = franchiseType === "브랜드 전환"
    ? (answers.length === 8 ? rawSum : Math.round(rawSum * 40 / 30))
    : rawSum;

  if (openingMonth === "없음") {
    leadDuration = "개원 시기 미정";
    leadInstruction = "장기적 상권 검토 및 자본 배정 우선 진행 권장";
    leadRank = "C";
    
    // Suggest based on score:
    if (franchiseType === "브랜드 전환") {
      if (totalScoreSub >= 36) {
        recOpeningMonth = "1~2개월이내 권장 (기본 소양 우수, 즉시 추진 가능)";
      } else if (totalScoreSub >= 30) {
        recOpeningMonth = "2~3개월이내 권장 (일부 보완 후 개원 가능)";
      } else if (totalScoreSub >= 23) {
        recOpeningMonth = "3~4개월이내 권장 (핵심 영역 보완 필요, 본사 지원 필수)";
      } else if (totalScoreSub >= 13) {
        recOpeningMonth = "4~6개월이내 권장 (전반적 준비 부족, 저비용 개원 검토)";
      } else {
        recOpeningMonth = "6개월 이상 권장 (개원 재검토 단계, 역량 강화 우선)";
      }
    } else {
      if (totalScoreSub >= 24) {
        recOpeningMonth = "1~2개월이내 권장 (기본 소양 우수, 즉시 추진 가능)";
      } else if (totalScoreSub >= 20) {
        recOpeningMonth = "2~3개월이내 권장 (일부 보완 후 개원 가능)";
      } else if (totalScoreSub >= 13) {
        recOpeningMonth = "3~4개월이내 권장 (핵심 영역 보완 필요, 본사 지원 필수)";
      } else if (totalScoreSub >= 7) {
        recOpeningMonth = "4~6개월이내 권장 (전반적 준비 부족, 소형·저비용 개원 검토)";
      } else {
        recOpeningMonth = "6개월 이상 권장 (개원 재검토 단계, 역량 강화 우선)";
      }
    }
  } else {
    try {
      const current = new Date("2026-06-13");
      const target = new Date(`${openingMonth}-15`);
      const diffMonths = (target.getFullYear() - current.getFullYear()) * 12 + (target.getMonth() - current.getMonth());

      if (diffMonths <= 2) {
        leadRank = "S";
        leadDuration = "개원 예정일까지 2개월 이내";
        leadInstruction = "개원 초읽기 단계 - 즉각 집중 컨설팅 착수 추천";
      } else if (diffMonths <= 3) {
        leadRank = "A";
        leadDuration = "2~3개월 이내";
        leadInstruction = "최적 준비 착수 단계 - 상세 지역 상권분석 및 입지선정 진행";
      } else if (diffMonths <= 6) {
        leadRank = "B";
        leadDuration = "3~6개월 이내";
        leadInstruction = "선행 준비 단계 - 본사 사업설명회 참석 및 자본 가이드라인 컨설팅";
      } else {
        leadRank = "C";
        leadDuration = "6개월 초과";
        leadInstruction = "장기 탐색 단계 - 지속적 유대 형성 및 개원 정기 정보 메일 전송";
      }

      // Check preparation vs chosen month
      const thresholdLimit = (franchiseType === "브랜드 전환") ? 23 : 13;
      if (totalScoreSub >= thresholdLimit) {
        recOpeningMonth = `${openingMonth} 권장 (준비 자양 우수하여 희망 시기 적절)`;
      } else {
        if (diffMonths <= 2) {
          recOpeningMonth = "2026-09 ~ 10 권장 (충분한 로컬 상권 실사 및 가맹 교육 권장)";
        } else {
          recOpeningMonth = `${openingMonth} 권장 (현행 계획 유지하며 본사 교육 집중)`;
        }
      }
    } catch (e) {
      leadRank = "C";
      leadDuration = "6개월 초과";
      leadInstruction = "장기 탐색 단계";
      recOpeningMonth = "2026-09 권장 (가장 완벽한 신학기 시즌)";
    }
  }

  // 5. Build dynamic composite Corporate General Opinion
  const aiReport = `${name} 원장님의 심사 분석 및 처방 결과 설명서입니다. ${resultComment}

현재 가용 자본 규모를 바탕으로 진단하였을 때, '${capitalRec}' 형태의 개원을 권장하며 공간 사이즈는 약 ${capitalRecSize} 규모가 가장 적합합니다.

원장님의 ${personality} 성향에 맞는 운영 방식인 '${personalityRecOperation.join(", ")}'을 추천해 드립니다. 특히 원장님이 강점을 보이실 [${personalityStrengths.join(", ")}] 영역을 적극 활용하시기를 독려해 드립니다.`;

  return {
    typeCode,
    typeName,
    recRegions,
    recFranchiseStyles,
    recStaffSetup,
    recReason,
    resultComment,
    capitalLevel: capitalValue,
    capitalRec,
    capitalRecSize,
    personalityStrengths,
    personalityRecOperation,
    leadRank,
    leadDuration,
    leadInstruction,
    recOpeningMonth,
    aiReport,
  };
}

export function getQuestionFeedback(franchiseType: string, questionIndex: number, rawScore: number): { scoreText: string; comment: string } {
  const res = getQuestionFeedbackRaw(franchiseType, questionIndex, rawScore);
  const score = rawScore || 3;
  res.scoreText = score >= 4 ? "우수" : score === 3 ? "준수" : "검토필요";
  return res;
}

function getQuestionFeedbackRaw(franchiseType: string, questionIndex: number, rawScore: number): { scoreText: string; comment: string } {
  const normalizedScore = rawScore || 3;
  if (franchiseType === "신규 창업") {
    switch (questionIndex) {
      case 0: // Q1: 원장 경력
        return {
          scoreText: normalizedScore === 1 ? "없음 or 타과목 운영" : normalizedScore === 2 ? "초등영어학원 1년 미만 or 입시영어" : normalizedScore === 3 ? "초등영어학원 1~3년" : normalizedScore === 4 ? "초등영어학원 3년이상" : "초등어학원 운영",
          comment: normalizedScore === 1
            ? "원장 경영 경력이 충분치 않으므로 초기에는 무리한 확장보다는 세심한 직강 지도와 기초 정착에 매진해 수강 신뢰도를 구축해야 하며,"
            : normalizedScore === 2
            ? "소규모 로컬 학원 교육 경험이 있으나 전체 원장 리더십은 보완이 요망되므로 본사의 정기 경영 연수와 행정 오리엔테이션 수료를 권장하며,"
            : normalizedScore === 3
            ? "일정한 전업 학원 인프라 관록이 증명되었으므로 기존 수동 원무 방식에서 탈피해 본사 협동 전산 결제 및 바인더 시너지 구축에 신경 써야 하며,"
            : normalizedScore === 4
            ? "숙련된 학원 경영 마인드로 로컬 관리력이 매우 뛰어나므로 주변 중심가 경쟁 학원의 입지 구도를 완파하고 빠른 런칭을 도모해야 하며,"
            : "이미 오랜 학사 운영 전력을 거쳐 독보적 장악력을 지니고 계시므로 기존 로컬 기반에 본사 브랜드 패키지를 이식해 랜드마크관으로 승격해야 합니다."
        };
      case 1: // Q2: 영어 수업 경력
        return {
          scoreText: normalizedScore === 1 ? "전혀 없음" : normalizedScore === 2 ? "1년 미만" : normalizedScore === 3 ? "1~3년" : normalizedScore === 4 ? "3~5년" : "5년 이상",
          comment: normalizedScore === 1
            ? "영어 수업 경력이 전무하므로 관리중심으로 세밀하게 학생들을 관리하며, 경험이 많거나 스펙이 좋은 전문 강사를 전방에 배치하여 운영하는 구도를 지향하시고,"
            : normalizedScore === 2
            ? "수업 실무 경력이 1년 미만으로 초기 전문 교수 설계가 생소할 수 있어, 관리중심으로 세밀하게 학생들을 관리하며 경험이 많거나 스펙이 좋은 강사를 전방에 배치해 상호 시너지를 내는 형태로 운영하는 것을 권장하며,"
            : normalizedScore === 3
            ? "교사 수준 자립 티칭은 안정적이나 주임강사 체제로 확장하기 전까지는 본사 세이펜 학습 지도를 적극 병행하여 학습 표준화를 지향하며,"
            : normalizedScore === 4
            ? "완숙도 높은 영어 지도가 가능하고 학생 흡입력이 대단히 우수하므로 원장 직강 시그니처 마케팅을 전방위에 내걸어 초기 인입을 가려내야 하며,"
            : "최상위권 영어 강의 내공을 축적해 원장 직강의 신뢰도가 타사 추종을 불허하므로 프리미엄 최상위 레벨 반의 신설을 통해 높은 객단가를 도출하십시오."
        };
      case 2: // Q3: 창업 가능 자본
        return {
          scoreText: normalizedScore === 1 ? "5천만원 미만" : normalizedScore === 2 ? "5천만원~1억원" : normalizedScore === 3 ? "1억원~1억5천만원" : normalizedScore === 4 ? "1억5천만원~2억원" : "2억원 이상",
          comment: normalizedScore === 1
            ? "초기 가용 자본이 매우 협소하므로 무리한 단독 학원 임차 대신 컴팩트하고 알찬 원장 1인 교습소나 공부방 형태로 출발해 고정비를 억제해야 하고,"
            : normalizedScore === 2
            ? "중소형 교습 레이아웃 개척에 매칭되는 지표이므로 고액 인테리어 대신 노출성 좋은 입지 전면 사인물 및 간판 이미지에 중점을 두어야 하고,"
            : normalizedScore === 3
            ? "일반 상업 중심 학원가에 단독 인허가 평수를 구축하기 좋은 탄탄한 예산안이므로 본사의 안심 시공 견적 기준을 매칭해 드려야 하며,"
            : normalizedScore === 4
            ? "여유로운 투자 지표로 중대형 프리미엄 어학 공간 창출이 전격 가능하므로 최첨단 멀티미디어 기기와 고려대 브랜드 디자인 명패 가구를 전폭 이식하고,"
            : "풍부한 유동 자본금을 등에 업고 지역 메인 요지의 독점적 대형 테마 캠퍼스를 구축하여 완벽히 압도적인 대형 어학 타운을 그랜드 오픈해야 합니다."
        };
      case 3: // Q4: 학부모 상담 경험
        return {
          scoreText: normalizedScore === 1 ? "없음" : normalizedScore === 2 ? "재원생 학부모 상담" : normalizedScore === 3 ? "신규 학부모 상담" : "신규+재원생 학부모 상담",
          comment: normalizedScore === 1
            ? "학부모 유대 교감 경험이 부재해 초기 이탈 차단력이 떨어질 수 있어 본사가 제공하는 단계별 상담 매뉴얼과 안내 시나리오 대본집 마스터 훈련이 요구되며,"
            : normalizedScore === 2
            ? "간헐적 안부 유대 상담은 우수하나 신규 등록 전환율이 약할 수 있으므로, 설명회 연계 집중 리팩토링 자료와 클로징 클리닉 참여를 지향하며,"
            : normalizedScore === 3
            ? "신규 설명회 등 학생 모집 상담은 출중하나 장기 유지를 위한 정밀 로드맵 상담이 서툴 수 있어 고려대 세이펜 진단 리포트를 통한 주기적 상담을 처방하며,"
            : "신규 등록과 장기 정기 상담 모두 우수한 카리스마를 지녔으므로 본사의 고급 입시 진단 도구 및 브랜딩을 결합해 상담 성공률을 100%에 근접시키십시오."
        };
      case 4: // Q5: 수업계획 수립 및 시간표 작성
        return {
          scoreText: normalizedScore === 1 ? "없음" : normalizedScore === 2 ? "수업반 수업계획수립 경험" : normalizedScore === 3 ? "학원전체 수업계획 경험" : "학원전체 수업계획 +시간표 작성",
          comment: normalizedScore === 1
            ? "공실 낭비 없는 효율적 운영을 위해 본 연구소가 완성해 둔 30분 단위 초등 전용 학사 시간표 디자인과 커리큘럼 양식을 한 치의 오차 없이 복사 이식을 권장하며,"
            : normalizedScore === 2
            ? "단위 학급 수업 수립은 양호하나 레벨별 셔틀버스 연동 분할 시간표 설계가 어려울 수 있어 본사 전임 슈퍼바이저의 동선 배치 템플릿 제안을 병행하며,"
            : normalizedScore === 3
            ? "학부 전반의 커리큘럼 이수율과 학습 설계를 원만하게 조율할 수 있으므로 기존 기안에 고려대 초중등 레벨의 매칭 가이드를 해마다 매끄럽게 연결해야 하며,"
            : "교직 공간 및 공실 효율을 극대화하는 시간표 마스터이므로 런칭 극초기부터 원생 마진율을 극대화하고 강사 수급 생산성을 크게 견인하시길 지지합니다."
        };
      case 5: // Q6: 강사 및 스탭 관리
        return {
          scoreText: normalizedScore === 1 ? "없음" : normalizedScore === 2 ? "강사관리 경험" : normalizedScore === 3 ? "스탭관리 경험" : "강사+스탭 관리 경험",
          comment: normalizedScore === 1
            ? "근로 노무 미경험 지대이므로 조기 인력 채용 실패나 법적 노무 갈등을 차단할 본사 표준 안심 고용계약서 서식 안내와 기초 근로 요건 지도를 수립 중이며,"
            : normalizedScore === 2
            ? "교수 인력과의 소통 관리력은 뛰어나나 원무 행정이 번거로울 수 있어 본사의 전산 자동 자동 결제 솔루션 프로그램을 결착해 수고를 덜어야 하며,"
            : normalizedScore === 3
            ? "행정/마케팅 스탭 통솔은 우수하나 강사진의 교수 퀄리티 감리 및 주임 육성이 생소할 수 있으므로 본사 주임교사 자격인증 코스를 강사에게 필 위탁하며,"
            : "행정과 교수직 총괄 매니지먼트 역량이 극대화된 통합형 리더이므로, 인원 급증에 대응하는 전임강사 직무 분장 표준화 및 스페셜 원 운영 가이드라인을 전수합니다."
        };
      default:
        return { scoreText: "보통", comment: "본 항목에 대한 원장님의 답변을 기초로 맞춤형 전문 처방안을 산정 중입니다." };
    }
  } else {
    // 브랜드 전환
    switch (questionIndex) {
      case 0: // Q1: 현재 운영 형태
        return {
          scoreText: normalizedScore === 1 ? "유치원·어린이집" : normalizedScore === 2 ? "타과목 학원" : normalizedScore === 3 ? "종합학원" : normalizedScore === 4 ? "영어보습학원" : "어학원",
          comment: normalizedScore === 1
            ? "정규 초등 전문 어학 시스템으로 거듭나기 위한 공간 배치 및 브랜드 명패 전환을 수반해야 하고,"
            : normalizedScore === 2
            ? "비영어 중심에서 명문 어학 센터로 확장하기 위해 본사의 우수 영어 전임강사 매칭 지원 모델을 연계하며,"
            : normalizedScore === 3
            ? "종합 수강 패턴에서 고려대 영어 단일의 프리미엄 전문관으로 집중 마케팅하여 원 가치를 상승시키며,"
            : normalizedScore === 4
            ? "단순 보습 위주에서 하이엔드 어학 러닝센터로 한 차원 도약을 꾀하기 위해 본사의 전용 벽지 및 로비 리모델링 패키지를 융합하며,"
            : "어학원 노하우를 살려 고려대학교 영어전문 브랜드 프로그램과 결합하고, 지역 우위의 랜드마크 학원으로 도약하십시오."
        };
      case 1: // Q2: 현재 운영 공간 규모
        return {
          scoreText: normalizedScore === 1 ? "소형 (30평 미만)" : normalizedScore === 2 ? "소형 (30~40평)" : normalizedScore === 3 ? "중형 (40~50평)" : normalizedScore === 4 ? "중형 (50~70평)" : "대형 (80평 이상)",
          comment: normalizedScore === 1
            ? "공간이 협소하여 인허가 및 레벨별 분반 설계에 신경 써야 하며 본사 레이아웃 지원을 필히 확보하세요."
            : normalizedScore === 2
            ? "30~40평 전용 한계로 내부 유동 레이아웃 효율성을 조율하고 경량 벽체 간격을 조율할 필요가 있습니다."
            : normalizedScore === 3
            ? "적절히 조절 가능한 강의실 분할(경량 칸막이 또는 유리벽체)를 통해 최대 4개 교실과 랩실 구성을 권장합니다."
            : normalizedScore === 4
            ? "현재 공간이 중형 (50~70평) 규모로 안정적인 어학원 운영이 가능합니다. 레벨별 분반 구성과 상담 공간 분리 등 쾌적한 학습 환경 조성에 투자하세요."
            : "현재 공간이 대형 (80평 이상) 규모로 넓은 대학원급 어학원 운영이 가능합니다. 공간 세분화, 자체 강의실 구성, 대기 공간 등을 갖춰 고급화 프리미엄 이미지를 강화하세요."
        };
      case 2: // Q3: 재원생 규모
        return {
          scoreText: normalizedScore === 1 ? "30명 이하" : normalizedScore === 2 ? "30~50명" : normalizedScore === 3 ? "50~100명" : normalizedScore === 4 ? "100~200명" : "200명 이상",
          comment: normalizedScore === 1
            ? "소수 재원생 단계에서 간반 교체 및 프리미엄 간담회 등의 붐업 행사를 정조준하여 로컬 유지세를 대대적으로 재구성할 타이밍입니다."
            : normalizedScore === 2
            ? "재원생 30~50명 수준으로 브랜드 전환을 통해 단일 학생당 단가 및 브랜드 가치를 업그레이드하고 소개 추천제 입소문 마케팅의 부스터를 다실 구간입니다."
            : normalizedScore === 3
            ? "재원생 50~100명으로 안정적인 전환 기반을 갖추고 있습니다. 기존 학생 만족도를 유지하면서, 프랜차이즈의 고급 커리큘럼을 이식하여 시너지를 내십시오."
            : normalizedScore === 4
            ? "재원생 100~200명의 탄탄한 기반을 보유하고 있습니다. 브랜드 전환 후 프리미엄 수강료 책정이 가능하며, 고학년 심화반 신설로 객단가를 높이는 전략을 검토하세요."
            : "200명 이상의 대규모 재원생을 보유하고 있습니다. 브랜드 전환 시 중간 학부모층의 강력한 입소문 마케팅 역할을 해줄 것입니다. 전환 행사를 성대하게 기획하여 지역 내 화제성을 만드세요."
        };
      case 3: // Q4: 영어학원 원장 경력
        return {
          scoreText: normalizedScore === 1 ? "없음" : normalizedScore === 2 ? "1년 미만" : normalizedScore === 3 ? "1~3년" : normalizedScore === 4 ? "3~5년" : "5년 이상",
          comment: normalizedScore === 1
            ? "운영 행정이 아직 다소 불투명한 상태이므로 세무, 행정 지침서와 무료 서비스를 수시 참고하며 기초 기반을 다지십시오."
            : normalizedScore === 2
            ? "영어학원 원장 경력 1년 미만으로 초기 운영 지도가 일부 필요합니다. 본사 운영 매뉴얼과 정기 세미나를 매주 체크해 가면서 시행착오를 줄이십시오."
            : normalizedScore === 3
            ? "영어학원 원장 1~3년 경력으로 기본 운영 역량을 갖추고 있습니다. 브랜드 전환을 통해 기존의 원무 행정 비효율을 씻고 스마트 관리 체계로 쇄신하십시오."
            : normalizedScore === 4
            ? "영어학원 원장 3~5년 경력의 탄탄한 운영 노하우를 보유하고 있습니다. 브랜드 전환 시 기존 운영 경험을 새 시스템과 빠르게 접목시켜 시너지를 극대화하세요."
            : "영어학원 원장 5년 이상의 풍부한 경력을 보유하고 있습니다. 독립적인 운영 역량이 충분하므로 본사 가맹 시스템을 전략적 활용해 규모 확장에 집중하세요."
        };
      case 4: // Q5: 영어 수업 경력
        return {
          scoreText: normalizedScore === 1 ? "없음" : normalizedScore === 2 ? "1년 미만" : normalizedScore === 3 ? "1~3년" : normalizedScore === 4 ? "3~5년" : "5년 이상",
          comment: normalizedScore === 1
            ? "영어 수업 및 지도 경험이 없으므로 직접 교수 부담을 낮추고, 원장님께서는 관리중심으로 세밀하게 학생들을 관리하며 경험이 많거나 스펙이 좋은 우수 강사를 전방에 배치해 운영해 나가십시오."
            : normalizedScore === 2
            ? "영어 교육 현장 실무 경력이 1년 미만임에 따라 보강된 수업 신뢰도를 유지하기 위해, 직접 강의를 무리하게 소화하기보다는 관리중심으로 세밀하게 학생들을 관리하며 경험이 많거나 스펙이 좋은 강사를 전방에 배치해 운영하는 구도를 수립하십시오."
            : normalizedScore === 3
            ? "일정 수준 수업 가능. 영어 전문 교육 경력 형성에 유리하나, 전반적인 학습 품질 통제를 위해 보조강사 추가 배치를 시도하고 주임강사로 역할을 위임하십시오."
            : normalizedScore === 4
            ? "독립 수업 운영 가능. 정규와 파트 강사를 적절히 배치하여 학급 규모 확장에 기여하고, 수업 품질 관리에 전념하십시오."
            : "수업 품질 보장 가능, 원장 직강 시 학부모 신뢰도 상승 효과 기대"
        };
      case 5: // Q6: 브랜드 전환을 위해 투자 가능한 자본은?
        return {
          scoreText: normalizedScore === 1 ? "1천만원 미만" : normalizedScore === 2 ? "1천만원~3천만원" : normalizedScore === 3 ? "3천만원~5천만원" : normalizedScore === 4 ? "5천만원~7천만원" : "7천만원 이상",
          comment: normalizedScore === 1
            ? "현재 예산으로는 전반적인 개선보다 일부 개선이 가능한 예산이므로 극히 보수적인 부분 수선 리뉴얼 접근을 권유합니다."
            : normalizedScore === 2
            ? "현재 예산은 전반적인 개선보다 일부 개선이 가능한 예산이므로, 전체 교체보다는 선별된 부분 개선과 노후 설비 보완 위주로 스마트하게 자본을 배치하는 것을 권장합니다."
            : normalizedScore === 3
            ? "현재 예산으로는 전체적인 환경 개선이 가능하며 필요한 마케팅은 가능한 상태입니다."
            : normalizedScore === 4
            ? "전체적인 환경 개선과 마케팅이 가능한 상태입니다."
            : "충분한 자본력을 바탕으로 적극적인 운영과 활발한 마케팅 지원을 더해 프리미엄 개원 효과를 극대화할 수 있습니다."
        };
      case 6: // Q7: 지역내 학부모 소득(건강보험료 기준)?
        return {
          scoreText: normalizedScore === 1 ? "없음" : normalizedScore === 2 ? "월 10만원 내외" : normalizedScore === 3 ? "월 20만원 내외" : normalizedScore === 4 ? "월 30만원 내외" : "월 40만원 이상",
          comment: normalizedScore === 1
            ? "월 15만원 이상 수강료 책정 어려움. 저가형 그룹 수업 위주 구성, 교재비 분리 등 부담 완화 전략 필요"
            : normalizedScore === 2
            ? "월 20~25만원 수준 수강료 책정 가능. 형제 할인·장기등록 할인 등 유인책 병행 권장"
            : normalizedScore === 3
            ? "월 ~30만원까지 책정 가능"
            : normalizedScore === 4
            ? "월 ~35만원까지 책정 가능"
            : "월 ~40만원까지 책정 가능"
        };
      case 7: // Q8: 지역내 초등학생수?
        return {
          scoreText: normalizedScore === 1 ? "1,000명 미만" : normalizedScore === 2 ? "1,000~1,500명" : normalizedScore === 3 ? "1,500~2,500명" : normalizedScore === 4 ? "2,500~3,500명" : "3,500명 이상",
          comment: normalizedScore === 1
            ? "학령인구가 지나치게 적어 수익 구조 형성 어려움. 1~3년 이내 이동 필요"
            : normalizedScore === 2
            ? "단기 운영은 가능하나 성장 한계 명확. 인근 초등학교 신설 계획 등 인구 유입 요인 반드시 확인, 3~5년 이내 이동 필요"
            : normalizedScore === 3
            ? "안정적 초기 운영 가능. 입주계획 아파트가 없을시 5년 내 인근 확장 또는 이전 계획 병행 권장"
            : normalizedScore === 4
            ? "우수한 상권. 학교별 하교 시간·동선 분석으로 수강 시간대 최적화 가능, 5년이상 운영 가능"
            : "최상위 입지. 경쟁 학원 진입 가능성도 높으므로 차별화된 레벨 체계와 콘텐츠 확보가 핵심, 7년이상 운영가능"
        };
      default:
        return { scoreText: "보통", comment: "본 항목에 대한 원장님의 답변을 기초로 맞춤형 전문 처방안을 산정 중입니다." };
    }
  }
}

export function generateCounselorOpinion(app: Partial<Applicant> & { answers?: number[] }): string {
  const rawFranchiseType = (app.franchiseType as string) || "신규 창업";
  const franchiseType = (rawFranchiseType === "브랜드전환" || rawFranchiseType === "브랜드 전환") ? "브랜드 전환" : "신규 창업";
  const answers = app.answers || (franchiseType === "브랜드 전환" ? [3, 3, 3, 3, 3, 3, 3, 3] : [3, 3, 3, 3, 3, 3]);

  if (franchiseType === "신규 창업") {
    const q1Score = answers[0] || 3;
    const q2Score = answers[1] || 3;
    const q3Score = answers[2] || 3;
    const q4Score = answers[3] || 3;
    const q5Score = answers[4] || 3;
    const q6Score = answers[5] || 3;

    const f1 = getQuestionFeedback("신규 창업", 0, q1Score);
    const f2 = getQuestionFeedback("신규 창업", 1, q2Score);
    const f4 = getQuestionFeedback("신규 창업", 3, q4Score);
    const f5 = getQuestionFeedback("신규 창업", 4, q5Score);
    const f6 = getQuestionFeedback("신규 창업", 5, q6Score);

    let capText = "";
    switch (q3Score) {
      case 1: capText = "5천만원 미만"; break;
      case 2: capText = "5천만원~1억원"; break;
      case 3: capText = "1억원~1억5천만원"; break;
      case 4: capText = "1억5천만원~2억원"; break;
      case 5:
      default: capText = "2억원 이상"; break;
    }

    return `[1. 진단 총평]
원장님의 분석 및 진단내용을 전달드립니다. 학원 및 영어 교습 경험 수준은 '${f1.scoreText}' 수준으로 진단되었고, 실전 교수 역량 자산은 '${f2.scoreText}' 수준을 기록하고 있습니다. 전반적인 기조로 볼 때 개별 역량은 우수하지만 원격 학사 지원과 입지 결합에 따른 본사 연동 전략의 병행이 성공적인 개원의 핵심적인 분수령이 될 것입니다.

[2. 강점 분석]
- 우수한 실천 교수 역량 확보: '${f2.scoreText}' 점수로 검증된 원장님의 직강 전문성과 학생 흡입력은 초기 고정 고객 창출에 최적화된 강력한 자산입니다.
- 기본 학습 인프라 구축의 준비성: 기본적인 수업 전용 구성력과 교수법에 있어서 타사 프로그램보다 훨씬 빠른 브랜드 콘텐츠 내재화 및 기동 능력을 내포하고 있습니다.

[3. 핵심 보완 과제]
- 신규 학부모 마케팅 및 커뮤니티 상담력 관리: '${f4.scoreText}' 단계로 평가되는 상담 수치에 기반하여, 학부모 유치를 위한 설명회 및 단계별 대면 세션 극대화를 처방하며 ${f4.comment}
- 자체 수업계획 수립과 고정 시간표 자립성 수렴: '${f5.scoreText}' 상태에 따라, 초기 학습량 관리 및 학년 분할 시간표 설계 정착이 시급히 권장되며 ${f5.comment}
- 원무 행정 스태프 및 조력 강사 마스터 노무 지휘: '${f6.scoreText}' 단계로, 장기 영속성을 갖기 위한 체계적인 사내 노무 가이드와 업무 분장표 수립을 요하며 ${f6.comment}

[4. 개원 로드맵]
- 1단계 (즉시 진행): 본사 HQ 시니어 원장 집중 교습 및 1:1 티칭 밀착 클리닉 즉각 과정 수강 (고려대 연계 정규 교육과정 브리핑 마스터 교육)
- 2단계 (2개월 차): 오프닝맵 상권 세부 기하학적 분석과 유동 동선 실사를 거쳐 '아파트 3,000세대 가처분 안심 배후지' 중심의 최다 노출 1급 입지 최종 매칭
- 3단계 (3~4개월 차): 프리미엄 환경 구축을 위한 안심 표준 인테리어 인허가 시공 및 타겟 거주 선호도 분석에 비춘 우량 보조 지원 인력 채용 수급 기획
- 4단계 (5~6개월 차): 개원 직전 대강당 설명회 기획, 본사 마케팅 유저 인입 지원 패키지 전적 가동으로 사전 상담 예약 쿠폰 및 1차 마감반 선결제 유치 달성

[5. 컨설턴트 코멘트]
보유 가용 자금 범주인 '${capText}' 구역과 본사의 가중 성공 비율 가이드를 융합해 볼 때, ${q3Score <= 2 ? "소자본 교습소형 컴팩트 레이아웃으로 실질적 고정비를 억제하는 실속형 창업을 강력 추진해 드립니다." : "중심가 프리미엄 대형 클래스 배치를 통해 고려대학교 영어 브랜드의 지형지물적 정합성을 살린 웅장한 도전을 적극 지지합니다."} 본 분석처의 정밀 상권 비공개 특별 회람회에 조기 참석하시어 개원 지형 극대화 방안을 가다듬으십시오.`;

  } else {
    // 브랜드 전환
    const q1Score = answers[0] || 3;
    const q2Score = answers[1] || 3;
    const q3Score = answers[2] || 3;
    const q4Score = answers[3] || 3;
    const q5Score = answers[4] || 3;
    const q6Score = answers[5] || 3;
    const q7Score = answers[6] || 3;
    const q8Score = answers[7] || 3;

    const f1 = getQuestionFeedback("브랜드 전환", 0, q1Score);
    const f2 = getQuestionFeedback("브랜드 전환", 1, q2Score);
    const f3 = getQuestionFeedback("브랜드 전환", 2, q3Score);
    const f4 = getQuestionFeedback("브랜드 전환", 3, q4Score);
    const f5 = getQuestionFeedback("브랜드 전환", 4, q5Score);
    const f6 = getQuestionFeedback("브랜드 전환", 5, q6Score);
    const f7 = getQuestionFeedback("브랜드 전환", 6, q7Score);
    const f8 = getQuestionFeedback("브랜드 전환", 7, q8Score);

    return `[1. 진단 총평]
원장님의 분석 및 진단내용을 전달드립니다. 현재 운영 유형은 '${f1.scoreText}' 형태이며 기존 인계 실내 규격 상태는 '${f2.scoreText}' 수준으로, 신속한 승계 전환 개원에 있어 물리적 기반은 확보된 상태입니다. 고려대학교 브랜드 가치로의 현대적 탈바꿈을 위해 정형화된 공간의 리포지셔닝과 밀착 학습 콘텐츠 연동을 핵심 전제로 진단 결과가 도출되었습니다.

[2. 강점 분석]
- 기존 재원생 자산 보유 및 안정적인 초기 마케팅: '${f3.scoreText}' 단계의 수급 역량에 힘입어 신규 개원 초기 운영 적점 기간을 최소화하고 즉각적인 매출 선순환 정착이 가깝습니다.
- 총괄 원무 경영 숙련성: '${f4.scoreText}' 수준으로 증명된 원장님의 로컬 학원 운영 마스터리는 지역 주민 신뢰 점유에 막강한 강점으로 작용합니다.

[3. 핵심 보완 과제]
- 학원 전원 고려대학교 고품격 테마 변경 및 리모델링: '${f1.scoreText}' 형태를 고려대 전용 럭셔리 러닝센터로 연계 승격하기 위한 환경 전환 기준 준수를 처방하며 ${f1.comment}
- 강의용 교실 공간 분할 비율 조정: '${f2.scoreText}' 면적 요건에 맞춘 최적의 인원 수용성 설계를 진행해 평당 정원 가용성을 최대화해야 하며 ${f2.comment}
- 본사 최첨단 입시 영어 로드맵 이식: 원장님의 고유 지도 교수안과 본사의 고려대학교 연계 입시 영어 콘텐츠 완숙도('${f5.scoreText}')를 하이브리드로 통합 설계하고 ${f5.comment}

[4. 개원 로드맵]
- 1단계 (즉시 진행): 기존 재원생 이탈 0명 목표 수립 - 브랜드 가치를 활용한 '고려대 어학 테마 전환 및 학사 시스템 명품화 학부모 간담회' 비공개 특별 개최
- 2단계 (2개월 차): 전용 한계 실내 규격 정밀 실측을 통하여 최적의 학생 대면 강의실 동선 디자인 구성 및 고급 벽지·명패·사인물 승인 교체
- 3단계 (3개월 차): 고려대 정규 전문 커리큘럼 입도, 행정 학원 명칭 정식 변경을 인근 교육지원청에 등재 및 교재 온라인 주문 인프라 구축 완결
- 4단계 (4개월 차): 주변 신규 초등 학령 타겟 아파트 권역에 '명문 브랜드 확장 그랜드 런칭' 하이브리드 인입 광고 및 신규 수강 등록 프로모션 동시 실행

[5. 컨설턴트 코멘트]
월 보험 예산 지표인 '${f7.scoreText}' 영역과 주 고객 인구 자산 '${f8.scoreText}' 환경이 정합하므로, ${f6.comment} 가용한 예산 내에서 완벽한 명문관으로 환골탈태할 잠재력이 풍부합니다. 본사 전임 시니어 총괄 카운셀러와의 정밀 자금/입지 대면 미팅을 즉각 신청하셔서 상권 내 독점적 명품 랜드마크 학원의 탄탄한 지위를 선점해 보시길 권장드립니다.`;
  }
}

export interface StatusHistoryEntry {
  status: string;
  changedAt: string;
}

export function getFullStatusHistory(app: Applicant): StatusHistoryEntry[] {
  const start = app.appliedAt || new Date().toISOString();
  
  if (app.statusHistory && app.statusHistory.length > 0) {
    return [...app.statusHistory].sort((a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime());
  }
  
  const stages = ["신규접수", "1차상담", "상권분석", "설명회참석", "계약진행", "계약완료", "보류"];
  const currentIdx = stages.indexOf(app.counselorStatus || "신규접수");
  
  const history: StatusHistoryEntry[] = [];
  const startTime = new Date(start).getTime();
  
  if (currentIdx <= 0) {
    history.push({ status: "신규접수", changedAt: start });
  } else {
    const now = Date.now();
    const elapsed = now - startTime;
    const numSteps = currentIdx; 
    let currentTime = startTime;
    
    for (let i = 0; i <= currentIdx; i++) {
      const stage = stages[i];
      if (i === currentIdx) {
        history.push({ status: stage, changedAt: new Date(currentTime).toISOString() });
      } else {
        const stepMs = Math.min(24 * 60 * 60 * 1000, Math.floor(elapsed / (numSteps + 1)));
        currentTime += stepMs;
        history.push({ status: stage, changedAt: new Date(currentTime).toISOString() });
      }
    }
  }
  return history;
}

export function isStagnated(app: Applicant): { stagnated: boolean; days: number; reason: string; thresholdDays: number } {
  if (app.counselorStatus === "계약완료" || app.counselorStatus === "보류") {
    return { stagnated: false, days: 0, reason: "", thresholdDays: 0 };
  }

  const history = getFullStatusHistory(app);
  const currentStatus = app.counselorStatus || "신규접수";
  const activeEntry = [...history].reverse().find(h => h.status === currentStatus) || history[history.length - 1];
  
  if (!activeEntry) {
    return { stagnated: false, days: 0, reason: "", thresholdDays: 0 };
  }

  const enteredTime = new Date(activeEntry.changedAt).getTime();
  const elapsedMs = Date.now() - enteredTime;
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);

  let thresholdDays = 2; 
  let reason = "";

  switch (currentStatus) {
    case "신규접수":
      thresholdDays = 1; // 24 hours
      reason = "신규 접수 미조치";
      break;
    case "1차상담":
      thresholdDays = 2; // 48 hours
      reason = "상담 후속 조치 지연";
      break;
    case "상권분석":
      thresholdDays = 3; // 72 hours
      reason = "상권 가맹 타당성 보정 지연";
      break;
    case "설명회참석":
      thresholdDays = 2; // 48 hours
      reason = "설명회 이수 후 후속 지연";
      break;
    case "계약진행":
      thresholdDays = 4; // 96 hours
      reason = "최종 계약 체결 지연";
      break;
    default:
      thresholdDays = 3;
      reason = "업무 병목 정체";
  }

  if (elapsedDays >= thresholdDays) {
    return { stagnated: true, days: elapsedDays, reason, thresholdDays };
  }

  return { stagnated: false, days: elapsedDays, reason: "", thresholdDays };
}
