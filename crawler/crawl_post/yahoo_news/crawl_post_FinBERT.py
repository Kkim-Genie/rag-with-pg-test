import csv
import requests
from bs4 import BeautifulSoup
import time
from urllib.parse import urljoin
from datetime import datetime, timedelta
import json
import torch
import torch.nn.functional as F
from api.test_notebook.FinBERT import classification

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
    content_div = soup.select_one("div.atoms-wrapper")
    
    if content_div:
        paragraphs = content_div.find_all("p")
        return "\n".join([p.text.strip() for p in paragraphs if p.text.strip()])
    else:
        return "본문 없음"

def post_data_to_server(item):
    headers = {"Content-Type": "application/json"}
    json_data = json.dumps([item], ensure_ascii=False)  # Wrap in list

    response = requests.post(API_URL, data=json_data, headers=headers)
    print(f"📡 POST {API_URL} - Status: {response.status_code}, Response: {response.text}")

def main(start_date, end_date, tokenizer, model):
    current_date = start_date
    while current_date <= end_date:
        date_str = current_date.strftime("%Y-%m-%d")

        # 기업별 뉴스 크롤링
        for company in COMPANIES:
            html = fetch_news_page(BASE_URL_COMPANY.format(company))
            if not html:
                continue

            articles = parse_news_articles(html, company)
            for article in articles[:5]: # 5개만
                article_content = fetch_article_content(article["link"])
                neutral_prob, result = classification(tokenizer, model, article["title"], article_content)
                if result == "non-neutral":
                    item = {
                        "date": date_str,
                        "title": article["title"],
                        "link": article["link"] or "URL 없음",
                        "content": article_content,
                        "company": article["company"]
                    }
                    post_data_to_server(item)
                    print(f"📰 저장된 기사 제목: {article['title']}")
                    print(f"저장된 기사 중립적 수치:, {neutral_prob}")
                else:
                    print(f"🚫 저장되지 않음 (neutral): {article['title']}")
                    print(f"저장되지 않은 기사 중립적 수치:, {neutral_prob}")

            time.sleep(2)  # 요청 차단 방지를 위해 대기

        # 전체 주식 시장 뉴스 크롤링 (기업 정보 없음)
        html = fetch_news_page(BASE_URL_MARKET)
        if html:
            articles = parse_news_articles(html, company=None)
            for article in articles[:5]: # 5개만
                article_content = fetch_article_content(article["link"])
                neutral_prob, result = classification(tokenizer, model, article["title"], article_content)
                if result == "non-neutral":
                    item = {
                        "date": date_str,
                        "title": article["title"],
                        "link": article["link"] or "URL 없음",
                        "content": article_content,
                        "company": "general_market"  # 기업 정보 없음 (전체 시장 뉴스)
                    }
                    post_data_to_server(item)
                    print(f"📰 저장된 기사 제목: {article['title']}")
                    print(f"저장된 기사 중립적 수치:, {neutral_prob}")
                else:
                    print(f"🚫 저장되지 않음 (neutral): {article['title']}")
                    print(f"저장되지 않은 기사 중립적 수치:, {neutral_prob}")

        current_date += timedelta(days=1)  # 하루씩 증가

if __name__ == "__main__":
    from transformers import AutoTokenizer, AutoModelForSequenceClassification

    model_name = "ProsusAI/finbert"

    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(model_name)

    end_date = datetime.strptime("2025-03-24", "%Y-%m-%d")
    start_date = datetime.strptime("2025-03-21", "%Y-%m-%d")

    main(start_date, end_date, tokenizer, model)