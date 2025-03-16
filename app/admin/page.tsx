"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NewsComponent from "./NewsComponent";
import MarketConditionComponent from "./MarketConditionComponent";
import WeeklyReportComponent from "./WeeklyReportComponent";

export default function ContentListPage() {
  const [activeTab, setActiveTab] = useState("news"); // "news", "market-condition", or "weekly-report"

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {activeTab === "news"
            ? "뉴스 목록"
            : activeTab === "market-condition"
            ? "시황 목록"
            : "주간 레포트 목록"}
        </h1>
        {activeTab !== "weekly-report" && (
          <Link href="/admin/add">
            <Button>
              {activeTab === "news" ? "새 뉴스 추가" : "새 시황 추가"}
            </Button>
          </Link>
        )}
      </div>

      <Tabs
        defaultValue="news"
        onValueChange={(value) => setActiveTab(value)}
        className="w-full mb-6"
      >
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="news">뉴스</TabsTrigger>
          <TabsTrigger value="market-condition">시황</TabsTrigger>
          <TabsTrigger value="weekly-report">주간 레포트</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
