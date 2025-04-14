import csv
import requests
from bs4 import BeautifulSoup
import time
from urllib.parse import urljoin
from datetime import datetime, timedelta, timezone
import json
from summa import summarizer, keywords

# 검색할 기업 리스트
COMPANIES = ["nvda", "tsla", "aapl", "meta", "msft", "amzn", "goog"]
BASE_URL_COMPANY = "https://finance.yahoo.com/quote/{}/latest-news/"
BASE_URL_MARKET = "https://finance.yahoo.com/topic/stock-market-news/"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
}
API_URL = "http://localhost:3000/api/news"

def fetch_news_page(url):
    """Yahoo Finance에서 뉴스 페이지 요청"""
    print(f"📡 크롤링 중: {url}")
    
    try:
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print(f"⚠️ 뉴스 페이지를 불러오지 못했습니다: {e}")
        return None

def parse_news_articles(html, company=None):
    """뉴스 기사 목록에서 제목과 URL 추출, 기업 정보 포함"""
    soup = BeautifulSoup(html, "html.parser")
    articles = soup.select("div.content.yf-82qtw3")

    news_list = []
    for article in articles:
        title_tag = article.select_one("h3.clamp.yf-82qtw3")
        title = title_tag.text.strip() if title_tag else "제목 없음"

        article_link_tag = article.select_one("a.subtle-link")
        url = urljoin("https://finance.yahoo.com", article_link_tag["href"]) if article_link_tag else None
        
        news_list.append({
            "title": title,
            "link": url,
            "company": company  # 기업 정보 추가
        })
    
    return news_list

def fetch_article_content(url):
    """개별 기사 본문 크롤링"""
    if not url:
        return "URL 없음_본문 없음"
    
    try:
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"⚠️ 기사 본문을 가져오지 못했습니다: {url} - {e}")
        return "본문 없음"
    
    soup = BeautifulSoup(response.text, "html.parser")
    time_tag = soup.select_one("time.byline-attr-meta-time")
    if time_tag and time_tag.has_attr("datetime"):
        datetime_str = time_tag["datetime"]
        print(f"🕒 기사 게시일: {datetime_str}")
    content_div = soup.select_one("div.atoms-wrapper")
    
    if content_div:
        paragraphs = content_div.find_all("p")
        return "\n".join([p.text.strip() for p in paragraphs if p.text.strip()]), datetime_str
    else:
        return "본문 없음"

def post_data_to_server(item):
    headers = {"Content-Type": "application/json"}
    json_data = json.dumps([item], ensure_ascii=False)  # Wrap in list

    response = requests.post(API_URL, data=json_data, headers=headers)
    print(f"📡 POST {API_URL} - Status: {response.status_code}, Response: {response.text}")

def summa_summarize(article):
    summary_content = summarizer.summarize(article, ratio=0.5)
    key_words = keywords.keywords(article, ratio=0.1)
    return {
        "summary": summary_content.strip(),
        "keywords": key_words.replace('\n', ', ')
    }

def main(start_date, end_date):
    current_date = start_date
    while current_date <= end_date:

        # 기업별 뉴스 크롤링
        for company in COMPANIES:
            html = fetch_news_page(BASE_URL_COMPANY.format(company))
            if not html:
                continue

            articles = parse_news_articles(html, company)
            for article in articles:

                article_content, datetime_str = fetch_article_content(article["link"])
                if datetime_str != current_date.date():
                    continue
                summary = summa_summarize(article_content)
                content_to_post = summary["summary"] if summary["summary"] else article_content

                item = {
                    "date": article["date"],  # 게시일 사용
                    "title": article["title"],
                    "link": article["link"] or "URL 없음",
                    "content": content_to_post,
                    "company": article["company"] or "general_market",
                    "keywords": summary["keywords"],
                }
                post_data_to_server(item)
                print(f"📰 저장된 기사 제목: {article['title']} (게시일: {article['date']})")

            time.sleep(2)  # 요청 차단 방지를 위해 대기

        # 전체 주식 시장 뉴스 크롤링 (기업 정보 없음)
        html = fetch_news_page(BASE_URL_MARKET)
        if html:
            articles = parse_news_articles(html, company=None)
            for article in articles:
                published_date = article["date"]
                if published_date != current_date.date():
                    continue

                article_content = fetch_article_content(article["link"])
                summary = summa_summarize(article_content)
                content_to_post = summary["summary"] if summary["summary"] else article_content

                item = {
                    "date": article["date"],  # 게시일 사용
                    "title": article["title"],
                    "link": article["link"] or "URL 없음",
                    "content": content_to_post,
                    "company": "general_market",  # 기업 정보 없음 (전체 시장 뉴스)
                    "keywords": summary["keywords"],
                }
                post_data_to_server(item)
                print(f"📰 저장된 기사 제목: {article['title']} (게시일: {article['date']})")
                if summary:
                    key_words = keywords.keywords(content_to_post, ratio=0.1)
                    print("🔑 키워드:", key_words.replace('\n', ', '))

        current_date += timedelta(days=1)  # 하루씩 증가

if __name__ == "__main__":
    end_date = datetime.strptime("2025-03-28", "%Y-%m-%d")
    start_date = datetime.strptime("2025-03-27", "%Y-%m-%d")

    main(start_date, end_date)
