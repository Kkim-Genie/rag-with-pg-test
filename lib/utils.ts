import { customAlphabet } from "nanoid";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { MarketCondition, News } from "./types";
import dayjs from "dayjs";
import weekday from "dayjs/plugin/weekday";
import "dayjs/locale/ko";
dayjs.extend(weekday);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789");

export const makeMarketConditionPrompt = (date: string, contexts: News[]) => {
  // date: 'YYYY-MM-DD'
  const dateObj = dayjs(date).locale("ko");
  const weekdaysKor = [
    "월요일",
    "화요일",
    "수요일",
    "목요일",
    "금요일",
    "토요일",
    "일요일",
  ];
  const weekdayKor = weekdaysKor[dateObj.day() === 0 ? 6 : dateObj.day() - 1];
  const formattedTargetDate = dateObj.format("YYYY년 MM월 DD일");

  // Find previous Friday
  let prevFriday = dateObj;
  while (prevFriday.day() !== 5) {
    prevFriday = prevFriday.subtract(1, "day");
  }
  const prevFridayDate = prevFriday.format("YYYY년 MM월 DD일");

  const fullContent = contexts
    .map((news, idx) => `(${idx + 1}) ${news.content}`)
    .join("\n");

  return `
💡 역할: 당신은 금융 시장을 분석하는 전문가입니다. 제공된 데이터를 기반으로 객관적이고 명확한 방식으로 증시 요약을 작성하세요.

📌 **증시 요약**
다음의 데이터를 활용하여 "Fingoo 증시 요약"을 작성하세요. 제공된 데이터는 미국 증시 관련 뉴스 및 분석 자료입니다.

📌 **참고 날짜**: ${date}

### 🔥 **보고서 작성 가이드라인**:
📌 Fingoo 증시 요약
【Fingoo 증시 요약 ｜${formattedTargetDate} (${weekdayKor})】 

📌 **1. 핵심 요점** ( ~ ${formattedTargetDate} 기준)
- 주요 증시 변동 사항 (지수 상승/하락, 주요 원인)을 한 문장으로 요약하여 개조식으로 작성하세요.
- 시장 참여자들의 반응을 한 줄씩 정리하세요.
- 시장에 영향을 줄 수 있는 주요 인물의 발언 및 관련 뉴스를 포함하세요.

📌 **2. 증시 마감 요약** ( ~ ${prevFridayDate} 기준)
- 주요 지수 마감 수치 및 변동률 (S&P500, 나스닥100, 다우, 러셀2000 등)
- 해당 변동에 대한 실제 요인 설명

📌 **3. 경제 데이터 & 시장 반응** ( ~ ${formattedTargetDate} 기준)
- 미국 경제 데이터 발표 내용 및 시장 반응 (국채 수익률, 외환, 금, 원유 등 포함)
- 전문가의 반응 (기관, 이름, 코멘트 포함)

📌 **4. 개별 기업 뉴스** ( ~ ${prevFridayDate} 기준)
- 주가 변동이 있었던 기업, 주요 이슈 및 발언 포함

📌 **5. 금일 주요 일정** ( ~ ${date} 기준)
- ★★★ 이상 일정만 추출하여 정리

⚠ 반드시 주어진 데이터만을 사용하여 작성하세요. 추가적인 가정이나 창작은 하지 마세요.  
⚠ 정보의 출처를 절대 기입하지 마세요.  

"⚠ 본 Fingoo 증시 레포트는 공신력 있는 자료를 기반으로 하여 Fingoo 인공지능(AI) 기술을 사용하여 생성되었습니다."를 마지막에 출력해줘.

context : 
${fullContent}
`;
};

export const makeWeeklyReportPrompt = (
  date: string,
  newsContexts: News[],
  marketContexts: MarketCondition[]
) => {
  const fullContentNews = newsContexts
    .map((news, idx) => `(${idx + 1}) ${news.content}`)
    .join("\n");

  const fullContentMarket = marketContexts
    .map((market, idx) => `(${idx + 1}) ${market.content}`)
    .join("\n");

  return `
💡 역할: 당신은 금융 시장을 분석하는 전문가입니다. 제공된 데이터를 기반으로 객관적이고 명확한 방식으로 주간 증시 요약을 작성하세요.

    📌 **주간 증시 요약**
    다음의 데이터를 활용하여 "Fingoo 주간 증시 요약"을 작성하세요. 제공된 데이터는 ${dayjs(
      date
    )
      .subtract(6, "day")
      .format(
        "YYYY-MM-DD"
      )} ~ ${date} 기간 동안의 미국 증시 관련 뉴스 및 분석 자료입니다.

    📌 **보고서 기간**: ${dayjs(date)
      .subtract(6, "day")
      .format("YYYY-MM-DD")} ~ ${date}

    ...

    ⚠ **반드시 주어진 데이터만을 사용하여 작성하세요. 추가적인 가정이나 창작은 하지 마세요.**  
    ⚠ **정보의 정확성을 유지하며, 지나치게 극적인 표현은 피하세요.**  
    ⚠ **정보의 출처를 절대 기입하지 마세요.**  

    " ⚠ 본 Fingoo 주간 증시 레포트는 공신력 있는 자료를 기반으로 Fingoo AI 기술을 사용하여 생성되었습니다."를 마지막에 출력해 주세요.

    위 포멧에 맞춰서 {start_date} ~ {end_date} 기간의 아래 'context' 데이터를 참고하여 주간 시황을 작성하세요.
    시황 데이터 context: ${fullContentNews}
    뉴스 context: ${fullContentMarket}
`;
};
