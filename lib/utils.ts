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

export const makeMarketConditionPrompt = (
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
