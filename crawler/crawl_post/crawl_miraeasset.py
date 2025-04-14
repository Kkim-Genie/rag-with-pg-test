import time
import json
import requests
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager
from datetime import datetime, timedelta

from api.preprocessing import generate_url_with_date

API_URL = "http://localhost:3000/api/news"

def setup_driver():
    options = Options()
    options.add_argument("--headless")  # ✅ 창 없이 실행
    options.add_argument("--no-sandbox")  # 안정성 옵션 (리눅스 호환성)
    options.add_argument("--disable-dev-shm-usage")  # 리눅스 메모리 문제 방지
    options.add_argument("--disable-gpu")  # GPU 비활성화 (headless에서 권장)

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    return driver

def click_ai_daily_briefing_link(driver, target_date):
    links = driver.find_elements(By.CSS_SELECTOR, "td.left div.subject a")
    target_link = None
    for link in links:
        title = link.text.strip()
        if "AI 데일리 글로벌 마켓 브리핑" in title:
            target_link = link
            break
    if target_link:
        target_link.click()
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "#contents"))
        )
        return title
    else:
        print(f"❌ '{target_date}'에 해당하는 게시글을 찾을 수 없습니다.")
        return None

def extract_content(driver):
    detail_view_td = driver.find_element(By.CSS_SELECTOR, "td.bbs_detail_view")
    return detail_view_td.text

def fetch_ai_daily_briefing_content(target_date):
    url = generate_url_with_date(target_date)
    driver = setup_driver()
    driver.get(url)
    time.sleep(5)
    
    title = click_ai_daily_briefing_link(driver, target_date)
    if title is None:
        driver.quit()
        return None, None
    
    content_text = extract_content(driver)
    driver.quit()
    return content_text, title

def post_data_to_server(item):
    headers = {"Content-Type": "application/json"}
    json_data = json.dumps([item], ensure_ascii=False)
    try:
        response = requests.post(API_URL, data=json_data, headers=headers)
        print(f"📡 POST {API_URL} - Status: {response.status_code}, Response: {response.text}")
    except requests.RequestException as e:
        print(f"❌ POST 실패: {e}")

def main(target_date):
    content, title = fetch_ai_daily_briefing_content(target_date)
    if content is None or title is None:
        return None, None

    item = {
        "date": target_date,
        "title": title,
        "link": "https://securities.miraeasset.com",  # 정확한 게시글 링크가 있으면 교체 가능
        "content": content,
        "company": "miraeasset",
        "keywords": ""  # 필요 시 키워드 추출 가능
    }
    post_data_to_server(item)
    return content, title

# ✅ 날짜 반복 함수 추가
def main_loop(start_date_str, end_date_str):
    start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
    end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
    current_date = start_date

    while current_date <= end_date:
        date_str = current_date.strftime("%Y-%m-%d")
        print(f"\n📅 {date_str} 마켓 브리핑 크롤링 중...")
        main(date_str)
        current_date += timedelta(days=1)


# ✅ 실행 예시
if __name__ == "__main__":
    main_loop("2024-10-10", datetime.today().strftime("%Y-%m-%d"))