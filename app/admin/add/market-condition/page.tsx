// pages/index.js
"use client";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import { News } from "@/lib/types";
import { makeMarketConditionPrompt } from "@/lib/utils";
import { generateMarketCondition } from "@/lib/actions/generateMarketCondition";
import { readStreamableValue } from "ai/rsc";

export default function AddMarketCondition() {
  const [formData, setFormData] = useState({
    date: "",
    content: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [contexts, setContexts] = useState<News[]>([]);

  const fetchContexts = async () => {
    if (!formData.date) return;

    const selectedDate = new Date(formData.date);
    const day = selectedDate.getDay(); // 0: 일, 1: 월, ..., 5: 금, 6: 토

    let datesToFetch: string[] = [];

    if (day === 2 || day === 3 || day === 4 || day === 5) {
      // 화(2), 수(3), 목(4), 금(5): 당일만
      datesToFetch = [formData.date];
    } else {
      // 토(6), 일(0), 월(1): 지난 금요일부터 해당 요일까지
      // 금요일 구하기
      const temp = new Date(selectedDate);
      // day가 0(일)~1(월)~6(토)일 때, 지난 금요일까지 며칠 전인지 계산
      const diffToFriday = (day + 7 - 5) % 7;
      temp.setDate(selectedDate.getDate() - diffToFriday);

      // 금요일부터 선택한 날짜까지 배열 생성
      let d = new Date(temp);
      while (d <= selectedDate) {
        datesToFetch.push(d.toISOString().slice(0, 10));
        d.setDate(d.getDate() + 1);
      }
    }

    // 여러 날짜의 데이터를 병렬로 fetch
    const fetches = datesToFetch.map((date) =>
      fetch(`/api/news/date?date=${date}`).then((res) => res.json())
    );
    const results = await Promise.all(fetches);

    // 결과 합치기 (필요에 따라 가공)
    const contexts = results.flat();
    setContexts(contexts);
  };

  useEffect(() => {
    fetchContexts();
  }, [formData.date]);

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
      const response = await fetch("/api/market-condition", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([formData]),
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

  const handleMakeMarketCondition = async () => {
    setFormData((prev) => ({ ...prev, content: "" }));
    const prompt = makeMarketConditionPrompt(formData.date, contexts);
    const { output } = await generateMarketCondition(prompt);

    for await (const delta of readStreamableValue(output)) {
      setFormData((prev) => ({ ...prev, content: `${prev.content}${delta}` }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Head>
        <title>시황 등록</title>
        <meta name="description" content="시황 등록 페이지" />
      </Head>

      <h1 className="text-3xl font-bold mb-6 text-center">시황 등록</h1>

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

      <Button onClick={handleMakeMarketCondition}>사황 생성하기</Button>
      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-6 rounded-lg shadow-md"
      >
        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            날짜 *
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {contexts.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-semibold mb-1 text-gray-700">
              관련 뉴스 제목
            </div>
            <ul className="list-disc list-inside text-gray-800 max-h-48 overflow-y-auto">
              {contexts.map((news) => (
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
