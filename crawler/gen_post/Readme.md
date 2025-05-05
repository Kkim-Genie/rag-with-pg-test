## 📁 `gen_post` 디렉토리 설명

`gen_post`는 **시장 뉴스, 기업 뉴스, 시황 요약, 주간 리포트** 등을 GPT 기반으로 생성하고, Supabase 서버에 POST하는 역할을 담당하는 디렉토리입니다.

---

### 📄 파일별 역할

#### `gen_comp_weekly.py` — **기업별 주간 리포트 생성기**
- `youtube_futuresnow`, `miraeasset`, `newstoday` 등의 `company`별 주간 뉴스 데이터를 분석하여 리포트 생성
- OpenAI API를 활용하여 각 기업의 요약 및 분석 콘텐츠를 생성
- 생성된 리포트는 `weekly_report.py`의 전체 리포트에 병합되어 사용됨

---

#### `gen_post_market.py` — **일간 마켓 시황 리포트 생성 및 POST**
- 특정 날짜의 `market_condition` 및 `news` 데이터를 기반으로 **하루치 증시 요약 리포트 생성**
- GPT를 통해 시황을 요약하고 `/api/market-condition`에 POST
- `weekly_report.py`에서 마켓 시황 ID를 참조하여 사용

---

#### `generate.py` — **시황 요약용 GPT 프롬프트 설계 모듈**
- 마켓 및 뉴스 데이터를 기반으로 GPT에 입력할 **프롬프트 생성 함수** 제공
- `gen_post_market.py`에서 호출되어 시황 요약의 품질을 높이기 위한 **핵심 로직**을 담당

---

#### `weekly_report.py` — **전체 주간 증시 리포트 생성 및 POST**
- `start_date ~ end_date` 기간의 마켓 시황 + 기업별 리포트를 통합하여 GPT로 주간 요약 리포트 생성
- 생성된 리포트는 `/api/weekly-report`로 POST
- 자동화 배치나 분석 리포트 제공을 위한 **핵심 진입점**

---

### 🧾 요약 표

| 📄 파일명                | 📝 역할 요약 |
|--------------------------|--------------|
| `gen_comp_weekly.py`     | 기업별 주간 리포트 생성<br/>- 기업별 뉴스 분석 및 GPT 요약<br/>- `weekly_report.py`로 병합 |
| `gen_post_market.py`     | 일간 마켓 시황 요약 및 POST<br/>- 해당 날짜의 마켓+뉴스 기반 GPT 요약<br/>- `/api/market-condition`으로 POST |
| `generate.py`            | GPT 프롬프트 설계 모듈<br/>- 시황 요약을 위한 고품질 프롬프트 생성 함수 |
| `weekly_report.py`       | 전체 주간 리포트 생성 및 POST<br/>- 마켓 시황 + 기업 리포트 통합<br/>- `/api/weekly-report`로 전송 |

---