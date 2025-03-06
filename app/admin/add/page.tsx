// pages/index.js
"use client";
import { useState } from "react";
import Head from "next/head";

export default function NewsForm() {
  const [formData, setFormData] = useState({
    title: "",
    link: "",
    date: "",
    content: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      // API 요청 보내기
      const response = await fetch("/api/news", {
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Head>
        <title>뉴스 등록</title>
        <meta name="description" content="뉴스 등록 페이지" />
      </Head>

      <h1 className="text-3xl font-bold mb-6 text-center">뉴스 등록</h1>

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

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-6 rounded-lg shadow-md"
      >
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            제목 *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="뉴스 제목을 입력하세요"
          />
        </div>

        <div>
          <label
            htmlFor="link"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            링크
          </label>
          <input
            type="url"
            id="link"
            name="link"
            value={formData.link}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="관련 링크를 입력하세요 (선택사항)"
          />
        </div>

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
            required
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
