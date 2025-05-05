'''
기업별 위클리 레포트 생성 및 supabase post 전체 코드입니다.
'''

import pandas as pd
import requests
from openai import OpenAI
from datetime import datetime, timedelta

def load_data(url, start_date, end_date):
    """API에서 데이터를 가져와 필터링 후, 기업별 그룹화"""
    response = requests.get(url)
    if response.status_code != 200:
        print(f"⚠️ 데이터 가져오기 실패: {response.status_code}")
        return pd.DataFrame()  # 빈 DataFrame 반환

    data = response.json()
    df = pd.DataFrame(data)

    # 'date' 컬럼을 datetime 형식으로 변환
    df["date"] = pd.to_datetime(df["date"], errors="coerce")

    # start_date, end_date 변환
    start_date = pd.to_datetime(start_date)
    end_date = pd.to_datetime(end_date)

    # 날짜 범위 필터링
    target_df = df[(df["date"] >= start_date) & (df["date"] <= end_date)]
    return target_df

def collect_company_news(target_df):
    """지정된 기업(Miraeasset, NewsToday, youtube_futuresnow) 뉴스 데이터 수집"""

    valid_companies = ["miraeasset", "newstoday", "youtube_futuresnow"]
    company_summaries = []

    for company in target_df['company'].unique():
        if company not in valid_companies:
            continue  # ⛔ 스킵

        # 해당 기업의 데이터 필터링
        company_data = target_df[target_df['company'] == company]

        news_sentences = [
            f"{row['date'].strftime('%Y-%m-%d')} - {row['title']}: {row['content']}" 
            for _, row in company_data.iterrows()
        ]

        full_summary = "\n".join(news_sentences)

        company_summaries.append({
            "company": company,
            "contet": full_summary
        })

    return company_summaries

def company_prompting(url, start_date, end_date):
    target_df = load_data(url, start_date, end_date)
    collected_news = collect_company_news(target_df)

    company_prompt = []

    for summary in collected_news:
        company_prompt.append({
            "company": summary['company'],
            "prompt": f"""
        💡 역할: 당신은 {summary['company']}의 금융 시장을 분석하는 전문가입니다. 제공된 데이터를 기반으로 객관적이고 명확한 방식으로 {summary['company']}의 주간 증시 요약을 작성하세요.

        📌 **{summary['company']}의 주간 증시 요약**
        제공된 데이터는 {start_date} ~ {end_date} 기간 동안의 {summary['company']} 관련 뉴스 및 분석 자료입니다.

        📌 **보고서 기간**: {start_date} ~ {end_date}

        📌 **주요 뉴스 요약**
        {summary['contet']}

        📌 **분석 내용 작성**
        - {summary['company']}의 주요 증시 변동 사항
        - 시장 반응 및 주요 인물 발언
        - 경제 지표 발표 및 영향을 분석
        - 개별 기업의 실적 및 정책 변화

        ⚠ 반드시 제공된 데이터만을 활용하세요. 추가적인 가정이나 창작을 하지 마세요.

        " ⚠ 본 Fingoo 주간 리포트는 Fingoo AI 기술을 사용하여 생성되었습니다."
        """
        })

    return company_prompt

def cal_cost(prompt_tokens, completion_tokens):

    # GPT-4o mini 가격 (USD per 1M tokens)
    input_price = 2.50 / 1_000_000  # 입력 토큰당 비용
    output_price = 10.00 / 1_000_000  # 출력 토큰당 비용

    # 비용 계산
    input_cost = prompt_tokens * input_price
    output_cost = completion_tokens * output_price
    total_cost = input_cost + output_cost
    return total_cost

def generate_weekly_reports(start_date, end_date):
    """모든 기업별 주간 보고서를 생성하는 함수"""
    client = OpenAI(api_key="YOUR_OPENAI_API_KEY")
    url = "http://localhost:3000/api/news/date"
    company_prompts = company_prompting(url, start_date, end_date)

    weekly_reports = {}

    for item in company_prompts:
        company = item["company"]
        prompt = item["prompt"]

        print(f"📊 {company}의 GPT 요청 실행 중...")

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "system", "content": "당신은 금융 시장 전문가입니다."},
                      {"role": "user", "content": prompt}]
        )

        weekly_reports[company] = response.choices[0].message.content

        prompt_tokens = response.usage.prompt_tokens
        completion_tokens = response.usage.completion_tokens
        print(f"{company} 주간 레포트 생성 코스트 :",cal_cost(prompt_tokens, completion_tokens))

        print(f"\n📌 {company}의 위클리 리포트 생성 완료!\n")

    return weekly_reports

if __name__ == "__main__":
    end_date = "2025-04-06"
    start_date = "2025-03-31"

    weekly_reports = generate_weekly_reports(start_date, end_date)

    if weekly_reports:
        print("✅ 모든 기업의 위클리 리포트 생성 완료!")
        print(weekly_reports)