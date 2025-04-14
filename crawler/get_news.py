import requests
import pandas as pd
import json

def get_news(date):
    url = "http://localhost:3000/api/news/date"

    response = requests.get(url, params={"date":date})
    data = response.json()
    return data

import requests
from datetime import datetime

def get_latest_news_date_from_server():
    url = "http://localhost:3000/api/news"

    try:
        response = requests.get(url)
        response.raise_for_status()
        news_data = response.json()
    except requests.RequestException as e:
        print(f"❌ 요청 실패: {e}")
        return None

    if not news_data:
        print("❗ 뉴스 데이터가 없습니다.")
        return None

    date_list = []
    for item in news_data:
        date_str = item.get("date")
        if date_str:
            try:
                date_obj = datetime.fromisoformat(date_str)
                date_list.append(date_obj)
            except Exception as e:
                print(f"⚠️ 날짜 파싱 실패: {date_str} - {e}")

    if not date_list:
        print("❗ 유효한 날짜가 없습니다.")
        return None

    latest_date = max(date_list)
    return latest_date.date()  # 또는 .isoformat()

# 사용 예시
latest = get_latest_news_date_from_server()
print(f"📅 가장 최근 뉴스 날짜: {latest}")