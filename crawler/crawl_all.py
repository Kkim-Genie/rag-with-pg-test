'''
미래에셋, 유튜브 커뮤니티, 오선 뉴스 이 3개의 정보 크롤링 사이트를 한번에 크롤링하는 코드입니다.

오늘 날짜 크롤링 시 터미널에 : python crawl_all.py today
특정 날짜 크롤링 시 터미널에 : python crawl_all.py 2025-04-05
'''

# ✅ 통합 크롤러: crawl_all.py

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

from api.preprocessing import (
    convert_relative_date_to_yyyy_mm_dd,
    generate_url_with_date
)

API_URL = "http://localhost:3000/api/news"

# --------------------- 공통 드라이버 설정 및 POST 함수 ---------------------

def setup_driver():
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    service = Service(ChromeDriverManager().install())
    return webdriver.Chrome(service=service, options=options)

def post_data_to_server(item):
    headers = { "Content-Type": "application/json" }
    try:
        json_data = json.dumps([item], ensure_ascii=False)
        response = requests.post(API_URL, data=json_data, headers=headers)
        print(f"📡 POST {API_URL} - Status: {response.status_code}, Response: {response.text}")
    except requests.RequestException as e:
        print(f"❌ POST 실패: {e}")

# -------------------------- 1. YouTube 크롤링 --------------------------

def youtube_is_uploaded(date_str):
    try:
        response = requests.get(
            "http://localhost:3000/api/news/date",
            params={"date": date_str, "company": "youtube_futuresnow"},
            timeout=5
        )
        return response.status_code == 200 and len(response.json()) > 0
    except:
        return False

def youtube_extract_post_data(content_element, now):
    text_element = content_element.find_element(By.CSS_SELECTOR, "yt-formatted-string#content-text")
    post_text = content_element.parent.execute_script("return arguments[0].innerText;", text_element).strip()
    post_date = content_element.find_element(By.CSS_SELECTOR, "#published-time-text>a").text.strip()
    return post_text, convert_relative_date_to_yyyy_mm_dd(post_date, now)

def youtube_scroll_and_post(driver, start_date_str):
    seen_dates = set()
    stop_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
    while True:
        elements = driver.find_elements(By.CSS_SELECTOR, "ytd-backstage-post-renderer")
        for el in elements:
            now = datetime.now()
            post_text, _ = youtube_extract_post_data(el, now)
            news_blocks = re.split(r"(【미국 증시 요약 ｜\d{4}년 \d{2}월 \d{2}일 \(.*?\)】)", post_text)
            for i in range(1, len(news_blocks), 2):
                header = news_blocks[i].strip()
                body = news_blocks[i + 1].strip() if i + 1 < len(news_blocks) else ""
                full_text = f"{header}\n\n{body}"
                match = re.search(r"【미국 증시 요약 ｜(\d{4})년 (\d{2})월 (\d{2})일", header)
                if match:
                    date_str = f"{match.group(1)}-{match.group(2)}-{match.group(3)}"
                    post_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                    if post_date < stop_date or date_str in seen_dates or youtube_is_uploaded(date_str):
                        continue
                    seen_dates.add(date_str)
                    item = {
                        "date": date_str,
                        "title": header[:30] + "..." if len(header) > 30 else header,
                        "link": "https://www.youtube.com/@futuresnow/community",
                        "content": full_text,
                        "company": "youtube_futuresnow",
                        "keywords": ""
                    }
                    post_data_to_server(item)
        driver.execute_script("window.scrollTo(0, document.documentElement.scrollHeight);")
        time.sleep(2)

def crawl_youtube(start_date):
    driver = setup_driver()
    driver.get("https://www.youtube.com/@futuresnow/community")
    time.sleep(5)
    youtube_scroll_and_post(driver, start_date)
    driver.quit()

# -------------------------- 2. 미래에셋 크롤링 --------------------------

def crawl_miraeasset_date(target_date):
    url = generate_url_with_date(target_date)
    driver = setup_driver()
    driver.get(url)
    time.sleep(5)

    title = None
    for link in driver.find_elements(By.CSS_SELECTOR, "td.left div.subject a"):
        if "AI 데일리 글로벌 마켓 브리핑" in link.text.strip():
            title = link.text.strip()
            link.click()
            break

    if not title:
        driver.quit()
        return

    time.sleep(2)
    content = driver.find_element(By.CSS_SELECTOR, "td.bbs_detail_view").text
    driver.quit()

    item = {
        "date": target_date,
        "title": title,
        "link": "https://securities.miraeasset.com",
        "content": content,
        "company": "miraeasset",
        "keywords": ""
    }
    post_data_to_server(item)

# -------------------------- 3. NewsToday 크롤링 --------------------------

def crawl_newstoday_article(date_str):
    url = f"https://futuresnow.gitbook.io/newstoday/{date_str}/news/today/bloomberg"
    driver = setup_driver()
    driver.get(url)
    time.sleep(3)

    last_height = driver.execute_script("return document.body.scrollHeight")
    while True:
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(1)
        new_height = driver.execute_script("return document.body.scrollHeight")
        if new_height == last_height:
            break
        last_height = new_height

    elements = driver.find_elements(By.CSS_SELECTOR, "h2, p")
    articles, article = [], {"title": None, "content": []}
    for el in elements:
        tag, text = el.tag_name.lower(), el.text.strip()
        if not text: continue
        if tag == "h2":
            if article["title"] and article["content"]:
                articles.append({
                    "title": article["title"],
                    "content": "\n".join(article["content"])
                })
            article = {"title": text, "content": []}
        elif tag == "p":
            article["content"].append(text)
    if article["title"] and article["content"]:
        articles.append({
            "title": article["title"],
            "content": "\n".join(article["content"])
        })
    driver.quit()
    return articles

def crawl_newstoday_date(date_str):
    articles = crawl_newstoday_article(date_str)
    for article in articles:
        payload = {
            "title": article["title"],
            "content": article["content"],
            "link": f"https://futuresnow.gitbook.io/newstoday/{date_str}/news/today/bloomberg",
            "company": "newstoday",
            "keywords": "",
            "date": date_str
        }
        post_data_to_server(payload)

# -------------------------- 실행 --------------------------

def run_all_crawlers(start_date_str, end_date_str):
    print("📦 전체 크롤링 시작")
    crawl_youtube(start_date_str)

    current_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
    end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
    while current_date <= end_date:
        date_str = current_date.strftime("%Y-%m-%d")
        print(f"▶️ {date_str} 미래에셋 크롤링")
        crawl_miraeasset_date(date_str)
        print(f"▶️ {date_str} NewsToday 크롤링")
        crawl_newstoday_date(date_str)
        current_date += timedelta(days=1)

    print("✅ 전체 크롤링 완료")

import sys

if __name__ == "__main__":
    # ⏰ 날짜 인자 파싱
    if len(sys.argv) != 2:
        print("❗ 사용법: python crawl_all.py [today|YYYY-MM-DD]")
        sys.exit(1)

    arg = sys.argv[1]
    if arg == "today":
        target_date = datetime.today().strftime("%Y-%m-%d")
    else:
        try:
            datetime.strptime(arg, "%Y-%m-%d")  # 유효성 검사
            target_date = arg
        except ValueError:
            print("❗ 날짜 형식이 잘못되었습니다. YYYY-MM-DD 형식으로 입력하세요.")
            sys.exit(1)

    # 🌀 하루만 크롤링
    print(f"📆 {target_date} 하루치 크롤링 시작")
    crawl_youtube(target_date)
    crawl_miraeasset_date(target_date)
    crawl_newstoday_date(target_date)
    print(f"✅ {target_date} 크롤링 완료")
