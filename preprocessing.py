# 크롤링을 위한 URL 및 시간 데이터 전처리 코드

from datetime import datetime, timedelta
import re

# 유튜브 커뮤니티 게시글 업로드 계산 전용
def convert_relative_date_to_yyyy_mm_dd(relative_date, current_datetime):
    """
    상대적인 날짜 표현을 YYYY-MM-DD 형식으로 변환합니다.
    
    Args:
        relative_date (str): 상대적인 날짜 표현 (예: "20시간 전", "1일 전")
        current_datetime (datetime): 현재 날짜 및 시간
        
    Returns:
        str: YYYY-MM-DD 형식의 날짜 문자열
    """
    # "수정됨" 문구 제거
    cleaned_date = relative_date.replace("(수정됨)", "").strip()
    
    # 시간 단위로 변환
    if "시간 전" in cleaned_date:
        hours = int(re.search(r'(\d+)시간 전', cleaned_date).group(1))
        date = current_datetime - timedelta(hours=hours)
    elif "일 전" in cleaned_date:
        days = int(re.search(r'(\d+)일 전', cleaned_date).group(1))
        date = current_datetime - timedelta(days=days)
    elif "주 전" in cleaned_date:
        weeks = int(re.search(r'(\d+)주 전', cleaned_date).group(1))
        date = current_datetime - timedelta(weeks=weeks)
    elif "개월 전" in cleaned_date:
        # 근사치로 계산 (1개월 = 30일)
        months = int(re.search(r'(\d+)개월 전', cleaned_date).group(1))
        date = current_datetime - timedelta(days=30*months)
    elif "년 전" in cleaned_date:
        # 근사치로 계산 (1년 = 365일)
        years = int(re.search(r'(\d+)년 전', cleaned_date).group(1))
        date = current_datetime - timedelta(days=365*years)
    else:
        # 인식할 수 없는 형식인 경우 현재 날짜 사용
        date = current_datetime
    
    # YYYY-MM-DD 형식으로 반환
    return date.strftime('%Y-%m-%d')

# 미래에셋 증권 레포트 전용
def generate_url_with_date(target_date):
    """
    target_date 문자열(YYYY-MM-DD 형식)을 기반으로 URL을 생성합니다.
    시작일과 종료일이 target_date와 같도록 설정합니다.

    주로 미래에셋의 URL에 날짜를 포함시키도록 출력합니다.
    """
    # 날짜 문자열을 datetime 객체로 변환
    date_obj = datetime.strptime(target_date, "%Y-%m-%d")
    
    # URL 파라미터에 필요한 형식으로 변환
    year = date_obj.year
    month = date_obj.month  # 1~12 사이의 값
    day = date_obj.day
    
    # URL 구성
    # 미래에셋증권의 리포트 URL
    url = (
        "https://securities.miraeasset.com/bbs/board/message/list.do?"
        f"from=&categoryId=1578&selectedId=1578&searchType=2&searchText="
        f"&searchStartYear={year}&searchStartMonth={month:02d}&searchStartDay={day:02d}"
        f"&searchEndYear={year}&searchEndMonth={month:02d}&searchEndDay={day:02d}"
    )
    
    return url