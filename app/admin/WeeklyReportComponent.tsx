import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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

interface WeeklyReportComponentProps {
  isActive: boolean;
}

export default function WeeklyReportComponent({
  isActive,
}: WeeklyReportComponentProps) {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (isActive) {
      fetchWeeklyReports();
    }
  }, [isActive]);

  const fetchWeeklyReports = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/weekly-report");
      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error("Failed to fetch weekly reports:", error);
    } finally {
      setLoading(false);
    }
  };

  // 검색어를 기반으로 주간 보고서 필터링
  const filteredReports = reports.filter((report) =>
    report.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 페이지네이션을 위한 계산
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReports.slice(indexOfFirstItem, indexOfLastItem);

  // 페이지 변경 핸들러
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // 표시할 페이지 버튼 계산
  const getPageNumbers = useCallback(() => {
    const pageNumbers = [];
    const maxPagesToShow = 5; // 한 번에 표시할 최대 페이지 버튼 수

    if (totalPages <= maxPagesToShow) {
      // 전체 페이지 수가 maxPagesToShow 이하면 모든 페이지 표시
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // 항상 처음과 마지막 페이지 표시
      // 현재 페이지 주변의 페이지 표시
      let startPage = Math.max(1, currentPage - 1);
      let endPage = Math.min(totalPages, currentPage + 1);

      // 표시할 페이지 버튼이 충분하지 않으면 조정
      const totalToShow = endPage - startPage + 1;
      if (totalToShow < maxPagesToShow - 2) {
        // 처음과 끝 페이지를 제외하고 계산
        if (startPage === 1) {
          endPage = Math.min(maxPagesToShow - 1, totalPages);
        } else if (endPage === totalPages) {
          startPage = Math.max(1, totalPages - maxPagesToShow + 2);
        }
      }

      // 처음 페이지 추가
      pageNumbers.push(1);

      // 생략 부호 또는 페이지 추가
      if (startPage > 2) {
        pageNumbers.push("...");
      } else if (startPage === 2) {
        pageNumbers.push(2);
      }

      // 현재 페이지 주변 페이지 추가
      for (
        let i = Math.max(2, startPage);
        i <= Math.min(totalPages - 1, endPage);
        i++
      ) {
        if (i !== 1 && i !== totalPages) {
          pageNumbers.push(i);
        }
      }

      // 생략 부호 또는 페이지 추가
      if (endPage < totalPages - 1) {
        pageNumbers.push("...");
      } else if (endPage === totalPages - 1) {
        pageNumbers.push(totalPages - 1);
      }

      // 마지막 페이지 추가
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  }, [currentPage, totalPages]);

  // 날짜 범위 포맷팅 함수
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate).toLocaleDateString();
    const end = new Date(endDate).toLocaleDateString();
    return `${start} ~ ${end}`;
  };

  return (
    <div style={{ display: isActive ? "block" : "none" }}>
      <div className="mb-6">
        <Input
          placeholder="내용으로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {loading ? (
        <div className="text-center">로딩 중...</div>
      ) : (
        <div className="flex flex-col space-y-4 w-full">
          {filteredReports.length > 0 ? (
            <>
              {currentItems.map((report) => (
                <Link
                  href={`/admin/weekly-report/${report.id}`}
                  key={report.id}
                >
                  <Card className="w-full cursor-pointer hover:shadow-lg transition-shadow">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-grow">
                        <CardHeader>
                          <CardTitle className="line-clamp-2">
                            주간 보고서:{" "}
                            {formatDateRange(
                              report.start_date,
                              report.end_date
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-500 line-clamp-3">
                            {report.content}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              시황 {report.market_analysis_ids.length}개
                            </span>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              뉴스 {report.news_ids.length}개
                            </span>
                          </div>
                        </CardContent>
                      </div>
                      <CardFooter className="flex md:flex-col justify-between items-center md:items-end p-4 min-w-32">
                        <div className="text-sm text-gray-500 mb-2 whitespace-nowrap">
                          {new Date(report.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(report.updated_at).toLocaleString() !==
                          new Date(report.created_at).toLocaleString()
                            ? `수정됨: ${new Date(
                                report.updated_at
                              ).toLocaleDateString()}`
                            : ""}
                        </div>
                      </CardFooter>
                    </div>
                  </Card>
                </Link>
              ))}

              {/* 페이지네이션 컴포넌트 */}
              {totalPages > 1 && (
                <div className="flex justify-end mt-6">
                  <nav className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handlePageChange(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                    >
                      이전
                    </Button>

                    {getPageNumbers().map((page, index) =>
                      typeof page === "number" ? (
                        <Button
                          key={index}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      ) : (
                        <span key={index} className="px-2">
                          {page}
                        </span>
                      )
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handlePageChange(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      다음
                    </Button>
                  </nav>
                </div>
              )}
            </>
          ) : (
            <div className="text-center">주간 보고서를 찾을 수 없습니다.</div>
          )}
        </div>
      )}
    </div>
  );
}
