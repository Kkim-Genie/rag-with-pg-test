"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Trash, ExternalLink } from "lucide-react";

interface WeeklyReport {
  id: string;
  start_date: string;
  end_date: string;
  content: string;
  market_analysis_ids: string[];
  news_ids: string[];
  created_at: Date;
  updated_at: Date;
}

export default function WeeklyReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const reportId = params.id as string;

  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (reportId) {
      fetchWeeklyReport(reportId);
    }
  }, [reportId]);

  const fetchWeeklyReport = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/weekly-report/${id}`);
      if (!response.ok) {
        throw new Error("Weekly report not found");
      }
      const data = await response.json();
      setReport(data);
    } catch (error) {
      console.error("Failed to fetch weekly report:", error);
      router.push("/admin");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("정말로 이 주간 보고서를 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/weekly-report/${reportId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete weekly report");
      }

      router.push("/admin");
    } catch (error) {
      console.error("Error deleting weekly report:", error);
    }
  };

  // 날짜 범위 포맷팅 함수
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate).toLocaleDateString();
    const end = new Date(endDate).toLocaleDateString();
    return `${start} ~ ${end}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div>로딩 중...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div>주간 보고서를 찾을 수 없습니다.</div>
        <Button className="mt-4" onClick={() => router.push("/admin")}>
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push("/admin")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> 목록으로 돌아가기
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">주간 보고서 상세 정보</h2>
        <Button variant="destructive" onClick={handleDelete}>
          <Trash className="mr-2 h-4 w-4" /> 삭제
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            주간 보고서: {formatDateRange(report.start_date, report.end_date)}
          </CardTitle>
          <div className="text-sm text-gray-500">
            작성일: {new Date(report.created_at).toLocaleDateString()}
            {new Date(report.updated_at).toLocaleString() !==
              new Date(report.created_at).toLocaleString() &&
              ` (수정일: ${new Date(report.updated_at).toLocaleDateString()})`}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-md font-medium mb-2">연결된 항목</h3>

              {report.market_analysis_ids.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">
                    시황 분석 ({report.market_analysis_ids.length}개):
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {report.market_analysis_ids.map((id) => (
                      <Button
                        key={id}
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/market-condition/${id}`)
                        }
                      >
                        {id}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {report.news_ids.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">
                    뉴스 ({report.news_ids.length}개):
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {report.news_ids.map((id) => (
                      <Button
                        key={id}
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/news/${id}`)}
                      >
                        {id}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-md font-medium">보고서 내용</h3>
              <div className="mt-2 p-4 bg-gray-50 rounded-md whitespace-pre-wrap">
                {report.content}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-gray-500">
            마지막 수정: {new Date(report.updated_at).toLocaleString()}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
