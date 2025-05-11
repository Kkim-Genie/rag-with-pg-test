"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NewsComponent from "./NewsComponent";
import MarketConditionComponent from "./MarketConditionComponent";
import WeeklyReportComponent from "./WeeklyReportComponent";
import FingooInfoComponent from "./FingooInfoComponent";

export default function ContentListPage() {
  const [activeTab, setActiveTab] = useState("news"); // "news", "market-condition", "weekly-report", or "pingu-info"
  const [dbSizeMB, setDbSizeMB] = useState<string | null>(null);
  const [dbSizeGB, setDbSizeGB] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch database size when component mounts
    const fetchDbSize = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/db-size");

        if (!response.ok) {
          throw new Error("Failed to fetch database size");
        }

        const data = await response.json();
        setDbSizeMB(data.totalSizeMB);
        setDbSizeGB(data.totalSizeGB);
      } catch (err) {
        console.error("Error fetching DB size:", err);
        setError("데이터베이스 크기를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDbSize();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            {activeTab === "news"
              ? "뉴스 목록"
              : activeTab === "market-condition"
              ? "시황 목록"
              : activeTab === "weekly-report"
              ? "주간 레포트 목록"
              : "핀구 정보 관리"}
          </h1>

          {/* Display database size */}
          <div className="text-sm text-gray-500 mt-1">
            {isLoading ? (
              "데이터베이스 크기 로딩 중..."
            ) : error ? (
              <span className="text-red-500">{error}</span>
            ) : (
              `데이터베이스 크기: ${dbSizeMB} MB (${dbSizeGB} GB)`
            )}
          </div>
        </div>

        {activeTab !== "pingu-info" && (
          <Link
            href={
              activeTab === "news"
                ? "/admin/add"
                : activeTab === "market-condition"
                ? "/admin/add/market-condition"
                : "/admin/add/weekly-report"
            }
          >
            <Button>
              {activeTab === "news"
                ? "새 뉴스 추가"
                : activeTab === "market-condition"
                ? "새 시황 추가"
                : "새 주간 레포트 추가"}
            </Button>
          </Link>
        )}
      </div>

      <Tabs
        defaultValue="news"
        onValueChange={(value) => setActiveTab(value)}
        className="w-full mb-6"
      >
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="news">뉴스</TabsTrigger>
          <TabsTrigger value="market-condition">시황</TabsTrigger>
          <TabsTrigger value="weekly-report">주간 레포트</TabsTrigger>
          <TabsTrigger value="pingu-info">핀구정보관리</TabsTrigger>
        </TabsList>
        <TabsContent value="news">
          <NewsComponent isActive={activeTab === "news"} />
        </TabsContent>
        <TabsContent value="market-condition">
          <MarketConditionComponent
            isActive={activeTab === "market-condition"}
          />
        </TabsContent>
        <TabsContent value="weekly-report">
          <WeeklyReportComponent isActive={activeTab === "weekly-report"} />
        </TabsContent>
        <TabsContent value="pingu-info">
          <FingooInfoComponent isActive={activeTab === "pingu-info"} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
