'''
위클리 레포트 생성 테스트용 코드입니다.
'''

from openai import OpenAI
from datetime import datetime, timedelta
import requests
import json

def get_news(date):
    url = "http://localhost:3000/api/news/date"
    response = requests.get(url, params={"date": date})
    data = response.json()
    return data

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
            print(f"✅ 시장 시황이 성공적으로 저장되었습니다. ({date})")
        else:
            print(f"⚠️ 저장 실패: {response.status_code}, {response.text}")
    except requests.RequestException as e:
        print(f"❌ 요청 중 오류 발생: {e}")

def get_context(target_date):
    date_obj = datetime.strptime(target_date, "%Y-%m-%d")

    # 📌 요일별 조회 날짜 설정
    if date_obj.weekday() == 0:  # 월요일
        analysis_date = (date_obj - timedelta(days=3)).strftime("%Y-%m-%d")
        crawl_dates = [target_date, analysis_date]
    elif date_obj.weekday() == 6:  # 일요일
        analysis_date = (date_obj - timedelta(days=2)).strftime("%Y-%m-%d")
        crawl_dates = [target_date, analysis_date]
    elif date_obj.weekday() == 5:  # 토요일
        analysis_date = (date_obj - timedelta(days=1)).strftime("%Y-%m-%d")
        crawl_dates = [target_date, analysis_date]
    else:
        analysis_date = target_date
        crawl_dates = [target_date]

    youtube_content, miraeasset_content = "", ""

    for crawl_date in crawl_dates:
        news_items = get_news(crawl_date)
        for item in news_items:
            company = item.get("company", "")
            title = item.get("title", "")
            content = item.get("content", "")

            if company == "youtube_futuresnow":
                youtube_content += f"[{crawl_date} 유튜브 데이터]:\n{content}\n\n"
            elif company == "miraeasset":
                miraeasset_content += f"[{crawl_date} 증권사 시황]:\n레포트 제목: {title}\n레포트 본문: {content}\n\n"

    return youtube_content + miraeasset_content

def prompting(target_date):
    date_obj = datetime.strptime(target_date, "%Y-%m-%d")

    if date_obj.weekday() == 0:
        formatted_target_date = (date_obj - timedelta(days=1)).strftime("%Y-%m-%d")
        prev_friday_date = (date_obj - timedelta(days=3)).strftime("%Y-%m-%d")
    elif date_obj.weekday() == 6:
        formatted_target_date = (date_obj - timedelta(days=1)).strftime("%Y-%m-%d")
        prev_friday_date = (date_obj - timedelta(days=2)).strftime("%Y-%m-%d")
    else:
        formatted_target_date = (date_obj - timedelta(days=1)).strftime("%Y-%m-%d")
        prev_friday_date = formatted_target_date

    full_content = get_context(target_date)

    question = f"""
    💡 역할: 당신은 금융 시장을 분석하는 전문가입니다. 제공된 데이터를 기반으로 객관적이고 명확한 방식으로 증시 요약을 작성하세요.

    📌 **증시 요약**
    다음의 데이터를 활용하여 "Fingoo 증시 요약"을 작성하세요. 제공된 데이터는 미국 증시 관련 뉴스 및 분석 자료입니다.

    📌 **참고 날짜**: {target_date}

    ### 🔥 **보고서 작성 가이드라인**:
    주어진 데이터를 활용하여 다음과 같은 구조로 증시 요약을 작성하세요. ❗ 모든 내용은 제공된 데이터에서만 추출하여 작성하세요.

    📌 Fingoo 증시 요약
    【Fingoo 증시 요약 ｜YYYY년 MM월 DD일 (요일)】 
    (날짜는 아래의 참고 날짜를 활용하여 작성하세요. 요일 또한 주어진 데이터에서 참고 날짜의 요일을 정확히 찾아야합니다.)
    참고 날짜 : {target_date}
    (예시 : 참고 날짜 : 2025-03-10
    -> 【Fingoo 증시 요약 ｜2025년 03월 10일 (월요일)】 
    )
    
   📌 **1. 핵심 요점** ( ~ {formatted_target_date} 기준)
    - 주요 증시 변동 사항 (지수 상승/하락, 주요 원인)을 한 문장으로 요약하여 개조식으로 작성하세요.
    - 시장 참여자들의 반응을 한 줄씩 정리하세요.
    - 시장에 영향을 줄 수 있는 주요 인물의 발언 및 관련 뉴스를 포함하세요. (예: 일론 머스크 인터뷰, 트럼프 발언 등)

    (예시: 
    - 주요 지수, 일제히 급락. 나스닥 -4.0%, S&P 500 -2.7%
    - 대형 기술주 시총 1천100조원 증발. 경기침체 우려 커짐
    - 트럼프 "침체 가능성" 언급. 시장 불안 가중
    - 일론 머스크 "X(구 트위터) 대규모 사이버 공격 발생" 발언
    - 연준 관계자 "경기 둔화 신호 명확해짐" 경고
    )

    📌 **2. 증시 마감 요약** ( ~ {prev_friday_date} 기준)
    - S&P 500, 나스닥, 다우존스 등의 마감 수치 및 변동률
        - 마감 수치의 상승, 하락 및 변동률 등은 제공된 데이터를 활용하여 작성하세요
        (예시 : 
        제공된 데이터 : 다우 +0.52%, 나스닥 -0.71%, S&P500 +0.52%, 러셀2000 -0.43%
        아래의 형식으로 수정하여 제공 : 
        ✅ 주요 지수 & 자산 가격 변동
            • S&P500 🔼(+0.55%)
                • 5,614.56
            • 나스닥100 🔽(-0.71%)
                • 19,430.95
            • 다우 🔼(+0.52%)
                • 41,911.71
            • 러셀2000 🔽(-0.43%)
                • 2,019.07
        )
    - 해당 변동에 대한 주요 이유
        - 증시 변동 요인을 기술할 때, 단순한 '우려'나 '불확실성' 같은 일반적인 표현을 피하고, 실제 원인(예: 연방 정부 감축, 관세 부과 등)을 구체적으로 명시하라.
        (예시: 
        ✅ 증시 흐름 요약
            • 주요 이슈 1: (예) "장 초반 변동성 확대 → 장중 S&P500 및 나스닥 1% 하락"
            • 주요 이슈 2: (예) "연준 파월 의장의 경제 낙관적 발언 이후 증시 반등")
        )


    📌 **3. 경제 데이터 & 시장 반응** ( ~ {formatted_target_date} 기준)
    - 미국 경제 데이터 발표 내용 (예: 비농업 고용지표, 실업률의 상승/하락 및 변동률 등)
    - 해당 데이터가 시장에 미친 영향 및 해석 (전문가의 반응 등)
        - 국채 수익률, 외환 시장, 원자재(금, 원유, 천연가스) 변동 내역을 반드시 포함
        - 공포 지수(VIX) 변동 및 주요 기관의 경기 침체 확률 전망 포함
        - 경제 데이터 발표 내용 및 해석은 제공된 데이터를 활용하여 작성하세요. 
        - 만약 관련된 내용이 없다면 추가적인 가정이나 창작을 통해 답변하지마세요.
        (출력 포멧: 
        📝 전문가 반응
        •	[기관명] [전문가 이름]
        o	"핵심 코멘트 요약"
        •	[기관명] [전문가 이름]
        o	"핵심 코멘트 요약"

        출력 예시 : 
        📝 전문가 반응
        • 씨티그룹 스튜어트 카이저
        o “추가 하락 위험이 존재. 백악관의 신호로 시장이 단기적인 고통을 감수해야 한다.”
        • E*Trade 크리스 라킨
        o “현재 거의 모든 이슈가 관세 이슈에 밀려 시장 변동성을 확대하고 있다.”
        )

    📌 **4. 개별 기업 뉴스** ( ~ {prev_friday_date} 기준)
    - 주요 기업들의 주가 변동 요인 및 특징 (예: 실적 발표, 정책 변화)
    - 시장 심리에 영향을 줄 수 있는 주요 비즈니스 리더의 발언 포함
    - 상승/하락 주요 기업 및 그 이유
        - 기업들의 주가 변동 및 요인 및 특징과 상승/하락은 제공된 데이터를 활용하여 작성하세요. 
        - 만약 관련된 내용이 없다면 추가적인 가정이나 창작을 통해 답변하지마세요.
        (예시: 
        ✅ 주요 종목별 뉴스 & 주가 변동
        •	[기업명] ([티커]) +X.XX%
        o	(예) "트럼프 대통령의 조선업 지원 발표 → HII 주가 12.3% 급등"
        •	[기업명] ([티커])
        o	(예) "애플, 신형 맥북 에어 및 맥 스튜디오 출시"
        •	[기업명] ([티커])
        o	(예) "노보노디스크, 체중 감량제 ‘위고비’ 할인 판매 시작"
        )

    📌 **5. 금일 주요 일정** ( ~ {target_date} 기준)
    - 금일 발표될 경제 지표 및 이벤트
        - 주로 원문 형태는 아래와 같습니다.
            【25년 03월 11일 (화)｜주요 일정】 - {target_date}의 열정만을 가져와 주세요.
    - 시장에서 중요하게 여길 만한 요소
        - 여러개의 일정 중에서 별표(★)가 세개 이상인 일정들만 가져와 주세요.
        - 향후에 대한 이벤트 및 연설등에 대한 내용은 제공된 데이터를 활용하여 작성하세요. 
        - 만약 관련된 내용이 없다면 추가적인 가정이나 창작을 통해 답변하지마세요.
        (예시:
            【25년 03월 11일 (화)｜주요 일정】

            경제지표

            08:50 - 일본 - 4분기 실질GDP성장률 ★★★
            19:00 - 미국 - 2월 NFIB 중소기업 경기낙관지수 ★
            23:00 - 미국 - 1월 JOLTS 구인인원 ★★★
            01:00 - 미국 - EIA 단기 에너지전망보고서 ★★
            01:00 - 미국 - USDA 세계 농산물수급 전망보고서 ★★
            02:00 - 미국 - 3년물 국채 경매 ★★

            -> 별표(★)가 3개 이상인 일정들만 참고하여 작성하기.

            • 08:50 - 일본 - 4분기 실질GDP성장률 ★★★
            • 23:00 - 미국 - 1월 JOLTS 구인인원 ★★★
        )

    ⚠ **반드시 주어진 데이터만을 사용하여 작성하세요. 추가적인 가정이나 창작은 하지 마세요.**  
    ⚠ **정보의 정확성을 유지하며, 지나치게 극적인 표현은 피하세요.** 
    ⚠ **정보의 출처를 절대 기입하지 마세요. 출처와 관련된 내용이 있으면 안됩니다.** 

    " ⚠ 본 Fingoo 증시 레포트는 공신력 있는 자료를 기반으로 하여 Fingoo 인공지능(AI) 기술을 사용하여 생성되었습니다."를 마지막에 출력해줘.

    위 포멧에 맞춰서 {target_date}의 아래의 context내용을 기반으로 시황을 만들어줘. 
    context에 내용이 없다면 포멧에는 존재하더라도 대답에서는 제외해줘, X와 HH, MM은 너가 채워야 할 부분이야 해당 부분을 채우지 못하면 답변에서 제외해줘
    context : {full_content}
    """
    return question


def cal_cost(prompt_tokens, completion_tokens):

    # GPT-4o mini 가격 (USD per 1M tokens)
    input_price = 2.50 / 1_000_000  # 입력 토큰당 비용
    output_price = 10.00 / 1_000_000  # 출력 토큰당 비용

    # 비용 계산
    input_cost = prompt_tokens * input_price
    output_cost = completion_tokens * output_price
    total_cost = input_cost + output_cost
    return total_cost

def get_response(target_date):
    prompt = prompting(target_date)
    client = OpenAI(api_key="YOUR_OPENAI_API_KEY")
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "당신은 주식 전문가입니다. 사용자의 요청을 정확하게 처리해주세요."},
            {"role": "user", "content": prompt}
        ]
    )

    prompt_tokens = response.usage.prompt_tokens
    completion_tokens = response.usage.completion_tokens
    print("Fingoo 시황 레포트 생성 코스트 :", cal_cost(prompt_tokens, completion_tokens))

    return response.choices[0].message.content

if __name__ == "__main__":
    target_date = "2025-04-04"
    report = get_response(target_date)
    print(report)

    # 서버에 저장
    post_market_report(target_date, report)