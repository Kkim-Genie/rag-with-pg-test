'''
데일리 시황 레포트 생성 및 supabase post 전체 코드입니다.
'''

import requests
import json
import pandas as pd
from datetime import datetime, timedelta
from openai import OpenAI

# ✅ 뉴스 가져오기
def get_news(date: str, company: str = None):
    url = "http://localhost:3000/api/news/date"
    params = {"date": date}
    if company:
        params["company"] = company

    response = requests.get(url, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ 뉴스 데이터를 불러오는 데 실패했습니다: {response.status_code}")
        return []
# ✅ 리포트 POST
def post_market_report(date, report):
    url = "http://localhost:3000/api/market-condition"
    headers = {"Content-Type": "application/json"}
    payload = {
        "date": date,
        "report": report,
    }
    try:
        response = requests.post(url, headers=headers, data=json.dumps(payload, ensure_ascii=False))
        if response.status_code == 200:
            print(f"✅ {date} 리포트 저장 완료")
        else:
            print(f"⚠️ 저장 실패: {response.status_code}, {response.text}")
    except requests.RequestException as e:
        print(f"❌ 요청 중 오류 발생: {e}")

# ✅ 날짜 기준 context 뉴스 구성
def get_context(target_date):
    date_obj = datetime.strptime(target_date, "%Y-%m-%d")
    weekday = date_obj.weekday()  # 0 = 월, ..., 6 = 일

    # ✅ 요일별 참고할 날짜 규칙 적용
    if weekday == 0:  # 월요일
        days = [0, 3] # 월요일, 저번주 금요일 참고
    elif weekday == 6:  # 일요일
        days = [0, 2] # 일요일, 저번주 금요일 참고
    elif weekday == 5:  # 토요일
        days = [0, 1] # 토요일, 저번주 금요일 참고
    else:  # 화, 수, 목, 금
        days = [0] # 당일만 참고

    context_news = []
    for d in days:
        lookup_date = date_obj - timedelta(days=d)
        lookup_str = lookup_date.strftime("%Y-%m-%d")

        for company in ["youtube_futuresnow", "miraeasset"]:
            news_items = get_news(lookup_str, company=company)
            if news_items:
                for item in news_items:
                    context_news.append(f"[{item['company']}] {item['title']}\n{item['content']}\n")

    return "\n".join(context_news)

# ✅ 프롬프트 생성 함수
def build_prompt(target_date, full_content):
    date_obj = datetime.strptime(target_date, "%Y-%m-%d")
    weekday_kor = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'][date_obj.weekday()]
    formatted_target_date = date_obj.strftime("%Y년 %m월 %d일")
    
    # 이전 금요일 날짜 계산 (월~일 어디든지 있어도 가장 가까운 과거 금요일)
    prev_friday = date_obj
    while prev_friday.weekday() != 4:
        prev_friday -= timedelta(days=1)
    prev_friday_date = prev_friday.strftime("%Y년 %m월 %d일")

    return f"""
💡 역할: 당신은 금융 시장을 분석하는 전문가입니다. 제공된 데이터를 기반으로 객관적이고 명확한 방식으로 증시 요약을 작성하세요.

📌 **증시 요약**
다음의 데이터를 활용하여 "Fingoo 증시 요약"을 작성하세요. 제공된 데이터는 미국 증시 관련 뉴스 및 분석 자료입니다.

📌 **참고 날짜**: {target_date}

### 🔥 **보고서 작성 가이드라인**:
📌 Fingoo 증시 요약
【Fingoo 증시 요약 ｜{formatted_target_date} ({weekday_kor})】 

📌 **1. 핵심 요점** ( ~ {formatted_target_date} 기준)
- 주요 증시 변동 사항 (지수 상승/하락, 주요 원인)을 한 문장으로 요약하여 개조식으로 작성하세요.
- 시장 참여자들의 반응을 한 줄씩 정리하세요.
- 시장에 영향을 줄 수 있는 주요 인물의 발언 및 관련 뉴스를 포함하세요.

📌 **2. 증시 마감 요약** ( ~ {prev_friday_date} 기준)
- 주요 지수 마감 수치 및 변동률 (S&P500, 나스닥100, 다우, 러셀2000 등)
- 해당 변동에 대한 실제 요인 설명

📌 **3. 경제 데이터 & 시장 반응** ( ~ {formatted_target_date} 기준)
- 미국 경제 데이터 발표 내용 및 시장 반응 (국채 수익률, 외환, 금, 원유 등 포함)
- 전문가의 반응 (기관, 이름, 코멘트 포함)

📌 **4. 개별 기업 뉴스** ( ~ {prev_friday_date} 기준)
- 주가 변동이 있었던 기업, 주요 이슈 및 발언 포함

📌 **5. 금일 주요 일정** ( ~ {target_date} 기준)
- ★★★ 이상 일정만 추출하여 정리

⚠ 반드시 주어진 데이터만을 사용하여 작성하세요. 추가적인 가정이나 창작은 하지 마세요.  
⚠ 정보의 출처를 절대 기입하지 마세요.  

"⚠ 본 Fingoo 증시 레포트는 공신력 있는 자료를 기반으로 하여 Fingoo 인공지능(AI) 기술을 사용하여 생성되었습니다."를 마지막에 출력해줘.

context : 
{full_content}
"""

# ✅ GPT 호출
def get_response(target_date, context):
    if not context.strip():
        return f"{target_date}에 사용할 뉴스가 부족하여 리포트를 생성할 수 없습니다."

    prompt = build_prompt(target_date, context)

    client = OpenAI(api_key="YOUR_OPENAI_API_KEY")
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
    )

    return response.choices[0].message.content.strip()

# ✅ 기존 리포트 존재 여부 확인
def is_report_exists(date: str):
    try:
        res = requests.get("http://localhost:3000/api/market-condition")
        if res.status_code == 200:
            existing = res.json()
            return any(item["date"] == date for item in existing)
    except Exception as e:
        print(f"⚠️ 기존 리포트 확인 실패: {e}")
    return False

# ✅ 실패 날짜 로그 저장
def log_failed_date(date_str: str):
    with open("failed_dates.txt", "a", encoding="utf-8") as f:
        f.write(f"{date_str}\n")

# ✅ 과거 방향 전체 리포트 생성 함수
def generate_and_post_all():
    start_date = datetime.today().date()  # 오늘부터 시작
    end_date = datetime.strptime("2024-11-14", "%Y-%m-%d").date()
    current_date = start_date

    while current_date >= end_date:
        date_str = current_date.strftime("%Y-%m-%d")
        print(f"\n📅 {date_str} 리포트 생성 중...")

        try:
            # ✅ 이미 존재하는 리포트인지 확인
            if is_report_exists(date_str):
                print(f"⚠️ {date_str} 이미 존재하는 리포트입니다. 건너뜁니다.")
                current_date -= timedelta(days=1)
                continue

            # ✅ context 구성
            context = get_context(date_str)
            if not context.strip():
                print(f"⚠️ {date_str} context 부족으로 리포트 생략")
                current_date -= timedelta(days=1)
                continue

            # ✅ GPT 호출 및 요약 생성
            report = get_response(date_str, context)

            # ✅ POST 요청
            df = pd.DataFrame([{
                "date": date_str,
                "content": report
            }])
            json_data = df.to_json(orient='records')
            data_dict = json.loads(json_data)

            url = "http://localhost:3000/api/market-condition"
            response = requests.post(url, json=data_dict)
            print(f"📡 POST 결과: {response.status_code}, {response.text}")

        except Exception as e:
            print(f"❌ {date_str} 처리 중 오류 발생: {e}")
            log_failed_date(date_str)  # 실패 날짜 기록

        current_date -= timedelta(days=1)  # ✅ 하루씩 과거로 이동

def generate_and_post_today():
    today_date = datetime.strptime("2025-01-14", "%Y-%m-%d").date()
    today = today_date.strftime("%Y-%m-%d")  # ✅ 문자열로 다시 변환

    print(f"\n📅 {today} 리포트 생성 중...")

    try:
        context = get_context(today)
        report = get_response(today, context)

        df = pd.DataFrame([{
            "date": today,
            "content": report
        }])

        json_data = df.to_json(orient='records')
        data_dict = json.loads(json_data)

        url = "http://localhost:3000/api/market-condition"
        response = requests.post(url, json=data_dict)
        print(f"📡 POST 결과: {response.status_code}, {response.text}")

    except Exception as e:
        print(f"❌ {today} 처리 중 오류 발생: {e}")

if __name__ == "__main__":
    generate_and_post_all()
    # generate_and_post_today()

# if __name__ == "__main__":
#     # 🔍 뉴스 데이터 로딩 테스트
#     test_date = "2025-04-04"
#     test_company = "youtube_futuresnow"

#     print(f"📡 {test_date} 뉴스 로딩 테스트 중...")
#     news = get_news(test_date, company=test_company)

#     if news:
#         print(f"✅ {test_date} 뉴스 {len(news)}건 로딩 성공!")
#         for item in news:
#             print(f"• [{item['company']}] {item['title']}")
#     else:
#         print(f"❌ {test_date} 뉴스 로딩 실패 또는 데이터 없음")