import requests
import pandas as pd
from datetime import datetime, timedelta
import json

def get_market_condition(date):
    url = "http://localhost:3000/api/market-condition/date"
    response = requests.get(url, params={"date": date})
    data = response.json()
    return data

def get_market_condition_range(start_date, end_date):
    """start_date ~ end_date 동안의 시황 레포트 가져오기"""
    market_data = []
    current_date = start_date
    while current_date <= end_date:
        data = get_market_condition(current_date)
        if data:
            market_data.extend(data)  # 여러 날짜의 데이터를 리스트에 추가
        else:
            print(f"❌ {current_date} 시황 레포트 가져오기 실패")
        current_date += timedelta(days=1)
    return market_data

if __name__ == "__main__":
    start_date = datetime.today().date() - timedelta(days=6)  # 1주일 전부터 오늘까지 레포트 조회
    end_date = datetime.today().date()

    result = get_market_condition_range(start_date, end_date)
    print("📊 가져온 시황 레포트:")
    print(json.dumps(result, indent=2, ensure_ascii=False))  # JSON 형식으로 보기 쉽게 출력
