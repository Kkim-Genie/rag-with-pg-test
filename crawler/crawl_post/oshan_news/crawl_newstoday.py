from datetime import datetime, timedelta
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import time
import requests
import json

# ✅ 기본 셋업
def setup_driver():
    options = Options()
    options.add_argument("--headless")
    service = Service(ChromeDriverManager().install())
    return webdriver.Chrome(service=service, options=options)

# ✅ 뉴스 제목 기준으로 p 태그 묶어서 기사 분리
def extract_articles_by_title_and_paragraphs(driver):
    elements = driver.find_elements(By.CSS_SELECTOR, "h2, p")

    articles = []
    current_article = {"title": None, "content": []}

    for el in elements:
        tag = el.tag_name.lower()
        text = el.text.strip()
        if not text:
            continue

        if tag == "h2":
            if current_article["title"] and current_article["content"]:
                articles.append({
                    "title": current_article["title"],
                    "content": "\n".join(current_article["content"])
                })
            current_article = {"title": text, "content": []}
        elif tag == "p":
            current_article["content"].append(text)

    if current_article["title"] and current_article["content"]:
        articles.append({
            "title": current_article["title"],
            "content": "\n".join(current_article["content"])
        })

    return articles

# ✅ 뉴스 1일치 크롤링 함수
def crawl_newstoday_article(date_str):
    url = f"https://futuresnow.gitbook.io/newstoday/{date_str}/news/today/bloomberg"
    driver = setup_driver()
    driver.get(url)
    time.sleep(3)

    # 스크롤 다운
    scroll_pause_time = 1
    last_height = driver.execute_script("return document.body.scrollHeight")
    while True:
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(scroll_pause_time)
        new_height = driver.execute_script("return document.body.scrollHeight")
        if new_height == last_height:
            break
        last_height = new_height

    try:
        articles = extract_articles_by_title_and_paragraphs(driver)
    except Exception as e:
        print(f"❌ [{date_str}] 기사 파싱 실패:", e)
        articles = []

    driver.quit()
    return articles

# ✅ POST 전송 함수
def post_article_to_server(title, content, date_str):
    url = "http://localhost:3000/api/news"
    headers = {"Content-Type": "application/json"}

    payload = {
        "title": title,
        "content": content,
        "link": f"https://futuresnow.gitbook.io/newstoday/{date_str}/news/today/bloomberg",
        "company": "newstoday",
        "keywords": "",
        "date": date_str
    }

    try:
        response = requests.post(url, headers=headers, data=json.dumps([payload], ensure_ascii=False))
        if response.status_code == 201:
            print(f"✅ 저장 완료: {date_str} | {title}, {response.status_code}, {response.text}")
        else:
            print(f"⚠️ 저장 실패: {date_str} | {response.status_code}, {response.text}")
    except requests.RequestException as e:
        print(f"❌ 요청 오류: {e}")

# ✅ 날짜 반복 실행
def crawl_date_range(start_date_str, end_date_str):
    start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
    end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
    current_date = start_date

    while current_date <= end_date:
        date_str = current_date.strftime("%Y-%m-%d")
        print(f"🔎 [{date_str}] 뉴스 크롤링 시작...")
        articles = crawl_newstoday_article(date_str)

        if not articles:
            print(f"⚠️ [{date_str}] 뉴스 없음 또는 크롤링 실패")
        else:
            for article in articles:
                post_article_to_server(article["title"], article["content"], date_str)

        current_date += timedelta(days=1)

# ✅ 실행 예시
if __name__ == "__main__":
    crawl_date_range("2024-11-01", datetime.today().strftime("%Y-%m-%d"))
