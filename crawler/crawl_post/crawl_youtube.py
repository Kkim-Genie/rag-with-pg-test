import re
import time
import json
import requests
from datetime import datetime, timedelta

from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium import webdriver
from webdriver_manager.chrome import ChromeDriverManager

from api.preprocessing import convert_relative_date_to_yyyy_mm_dd

API_URL = "http://localhost:3000/api/news"

# ✅ 크롬 드라이버 설정 (headless)
def setup_driver():
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    service = Service(ChromeDriverManager().install())
    return webdriver.Chrome(service=service, options=options)

# ✅ 게시글 본문과 날짜 추출
def extract_post_data(content_element, now):
    text_element = content_element.find_element(By.CSS_SELECTOR, "yt-formatted-string#content-text")
    post_text = content_element.parent.execute_script("return arguments[0].innerText;", text_element).strip()
    
    post_date = content_element.find_element(By.CSS_SELECTOR, "#published-time-text>a").text.strip()
    formatted_date = convert_relative_date_to_yyyy_mm_dd(post_date, now)
    
    return post_text, formatted_date

# ✅ 서버 중복 여부 확인 함수
def is_already_uploaded(date_str):
    try:
        response = requests.get(
            "http://localhost:3000/api/news/date",
            params={"date": date_str, "company": "youtube_futuresnow"},
            timeout=5
        )
        if response.status_code == 200:
            data = response.json()
            return len(data) > 0  # ✅ 이미 해당 날짜에 등록된 뉴스 있음
    except requests.RequestException as e:
        print(f"⚠️ 서버 중복 확인 실패: {e}")
    return False

# ✅ POST 요청 함수
def post_data_to_server(item):
    headers = {"Content-Type": "application/json"}
    json_data = json.dumps([item], ensure_ascii=False)
    try:
        response = requests.post(API_URL, data=json_data, headers=headers)
        print(f"📡 POST {API_URL} - Status: {response.status_code}, Response: {response.text}")
    except requests.RequestException as e:
        print(f"❌ POST 실패: {e}")

# ✅ 게시글 하나씩 분리 → 확인 후 저장, 중복 방지
def scroll_and_post_each(driver):
    seen_dates = set()
    target_stop_date = datetime.strptime("2024-10-10", "%Y-%m-%d").date()

    while True:
        try:
            content_elements = driver.find_elements(By.CSS_SELECTOR, "ytd-backstage-post-renderer")

            for content_element in content_elements:
                now = datetime.now()
                post_text, _ = extract_post_data(content_element, now)

                # ✅ 증시 요약 블럭 분리
                news_blocks = re.split(r"(【미국 증시 요약 ｜\d{4}년 \d{2}월 \d{2}일 \(.*?\)】)", post_text)

                for i in range(1, len(news_blocks), 2):
                    header = news_blocks[i].strip()
                    body = news_blocks[i + 1].strip() if i + 1 < len(news_blocks) else ""
                    full_text = f"{header}\n\n{body}"

                    match = re.search(r"【미국 증시 요약 ｜(\d{4})년 (\d{2})월 (\d{2})일", header)
                    if match:
                        year, month, day = match.groups()
                        extracted_date = f"{year}-{month}-{day}"
                        post_date = datetime.strptime(extracted_date, "%Y-%m-%d").date()

                        # ✅ 중단 조건
                        if post_date < target_stop_date:
                            print(f"🛑 {extracted_date} → 종료 날짜 도달. 스크롤/크롤링 중단.")
                            return

                        if extracted_date in seen_dates:
                            print(f"⚠️ 중복된 날짜({extracted_date})의 증시 요약입니다. 저장하지 않습니다.")
                            continue

                        if is_already_uploaded(extracted_date):
                            print(f"⚠️ 서버에 이미 존재하는 날짜({extracted_date})입니다. 저장하지 않습니다.")
                            seen_dates.add(extracted_date)
                            continue

                        seen_dates.add(extracted_date)
                        print(f"✅ 형식에 맞는 증시 요약입니다. 저장합니다. ({extracted_date})")

                        item = {
                            "date": extracted_date,
                            "title": header[:30] + "..." if len(header) > 30 else header,
                            "link": "https://www.youtube.com/@futuresnow/community",
                            "content": full_text,
                            "company": "youtube_futuresnow",
                            "keywords": ""
                        }
                        post_data_to_server(item)
                    else:
                        print("❌ 형식에 맞지 않는 증시 요약입니다. 저장하지 않습니다.")

            # ✅ 스크롤 아래로
            driver.execute_script("window.scrollTo(0, document.documentElement.scrollHeight);")
            time.sleep(2)

        except Exception as e:
            print(f"⚠️ 게시글을 찾을 수 없습니다. 오류: {e}")
            break

# ✅ 하루 단위 실행
def main(target_date, driver=None):
    close_driver = False
    if driver is None:
        driver = setup_driver()
        close_driver = True

    url = "https://www.youtube.com/@futuresnow/community"
    driver.get(url)
    time.sleep(5)

    scroll_and_post_each(driver)

    if close_driver:
        driver.quit()

# ✅ 날짜 반복 실행
def main_loop(start_date_str, end_date_str):
    start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
    end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
    current_date = end_date

    driver = setup_driver()

    print(f"\n📅 전체 크롤링 중... (최신 → 과거, {start_date_str} ~ {end_date_str})")
    while current_date >= start_date:
        date_str = current_date.strftime("%Y-%m-%d")
        print(f"🗓️ 크롤링 날짜: {date_str}")
        main(date_str, driver=driver)
        current_date -= timedelta(days=1)

    driver.quit()

# ✅ 실행
if __name__ == "__main__":
    main_loop("2025-04-04", datetime.today().strftime("%Y-%m-%d"))