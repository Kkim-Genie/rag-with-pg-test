// pages/index.js
"use client";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import { MarketCondition, News } from "@/lib/types";
import { makeWeeklyReportPrompt } from "@/lib/utils";
import { generateMarketCondition } from "@/lib/actions/generateMarketCondition";
import { readStreamableValue } from "ai/rsc";
import { Loader2 } from "lucide-react";

interface FormData {
  start_date: string;
  end_date: string;
  content: string;
  market_analysis_ids: string[];
  news_ids: string[];
}

export default function AddWeeklyReport() {
  const [formData, setFormData] = useState<FormData>({
    start_date: "",
    end_date: "",
    content: "",
    market_analysis_ids: [],
    news_ids: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [newsContexts, setNewsContexts] = useState<News[]>([]);
  const [marketContexts, setMarketContexts] = useState<MarketCondition[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchContexts = async () => {
    if (!formData.end_date) return;

    const selectedDate = new Date(formData.end_date);
    let datesToFetch: string[] = [];

    // 선택된 날짜 포함, 이전 7일(총 8일)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(selectedDate);
      d.setDate(selectedDate.getDate() - i);
      datesToFetch.push(d.toISOString().slice(0, 10));
    }
    setFormData((prev) => ({ ...prev, start_date: datesToFetch[0] }));

    // 여러 날짜의 데이터를 병렬로 fetch
    const fetches: Promise<News[]>[] = [];
    const marketFetches: Promise<MarketCondition[]>[] = [];

    datesToFetch.forEach((date) => {
      fetches.push(
        fetch(`/api/news/date?date=${date}&company=miraeasset`).then((res) =>
          res.json()
        )
      );
    });
    datesToFetch.forEach((date) => {
      fetches.push(
        fetch(`/api/news/date?date=${date}&company=youtube_futuresnow`).then(
          (res) => res.json()
        )
      );
    });
    datesToFetch.forEach((date) => {
      marketFetches.push(
        fetch(`/api//market-condition/date?date=${date}`).then((res) =>
          res.json()
        )
      );
    });

    const news = await Promise.all(fetches);
    const market = await Promise.all(marketFetches);
    setFormData((prev) => ({
      ...prev,
      news_ids: news.flat().map((news) => news.id),
      market_analysis_ids: market.flat().map((market) => market.id),
    }));
    setNewsContexts(news.flat());
    setMarketContexts(market.flat());
  };

  useEffect(() => {
    fetchContexts();
  }, [formData.end_date]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      // API 요청 보내기
      const response = await fetch("/api/weekly-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      // 응답 처리
      const data = await response.json();

      if (response.ok) {
        // 성공 메시지 표시
        setMessage("뉴스가 성공적으로 등록되었습니다!");
        setSubmitted(true);

        // 폼 초기화
        // setFormData({ title: "", link: "", date: "", content: "" });

        // 3초 후 메시지 제거
        setTimeout(() => {
          setMessage("");
          setSubmitted(false);
        }, 3000);
      } else {
        // 오류 메시지 표시
        setMessage(`오류: ${data.message || "서버에서 오류가 발생했습니다."}`);
      }
    } catch (error) {
      setMessage("서버 연결 중 오류가 발생했습니다.");
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMakeWeeklyReport = async () => {
    setIsGenerating(true);
    setFormData((prev) => ({ ...prev, content: "" }));
    const prompt = makeWeeklyReportPrompt(
      formData.end_date,
      newsContexts,
      marketContexts
    );
    const { output, usage } = await generateMarketCondition(prompt);

    for await (const delta of readStreamableValue(output)) {
      setFormData((prev) => ({ ...prev, content: `${prev.content}${delta}` }));
    }

    const usageData = await usage;
    const cost =
      (usageData.promptTokens * 0.4) / 1000000 +
      (usageData.completionTokens * 1.6) / 1000000;
    console.log(`Cost: ${cost} USD`);
    setIsGenerating(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Head>
        <title>주간 레포트 등록</title>
        <meta name="description" content="주간 레포트 등록 페이지" />
      </Head>

      <h1 className="text-3xl font-bold mb-6 text-center">주간 레포트 등록</h1>

      {message && (
        <div
          className={`p-4 mb-6 rounded ${
            message.includes("오류")
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {message}
        </div>
      )}

      <Button onClick={handleMakeWeeklyReport} disabled={isGenerating}>
        {isGenerating ? (
          <>
            <Loader2 className="animate-spin mr-2" />
            생성 중...
          </>
        ) : (
          "주간 레포트 생성하기"
        )}
      </Button>
      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-6 rounded-lg shadow-md"
      >
        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            종료 날짜 *
          </label>
          <input
            type="date"
            id="end_date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {newsContexts.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-semibold mb-1 text-gray-700">
              관련 뉴스 제목
            </div>
            <ul className="list-disc list-inside text-gray-800 max-h-48 overflow-y-auto">
              {marketContexts.map((market) => (
                <li key={market.id} className="truncate">
                  {market.date} 시황
                </li>
              ))}
              {newsContexts.map((news) => (
                <li key={news.id} className="truncate">
                  {news.title}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <label
            htmlFor="content"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            내용 *
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows={20}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="뉴스 내용을 입력하세요"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || submitted}
            className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isSubmitting || submitted ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting
              ? "등록 중..."
              : submitted
              ? "등록 완료!"
              : "등록하기"}
          </button>
        </div>
      </form>

      {submitted && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">입력한 내용:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
