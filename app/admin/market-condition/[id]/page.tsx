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
import { ArrowLeft, Trash } from "lucide-react";
import { MarketCondition } from "@/lib/types";

export default function ResourceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const resourceId = params.id as string;

  const [resource, setResource] = useState<MarketCondition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (resourceId) {
      fetchResource(resourceId);
    }
  }, [resourceId]);

  const fetchResource = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/market-condition/${id}`);
      if (!response.ok) {
        throw new Error("Resource not found");
      }
      const data = await response.json();
      setResource(data);
    } catch (error) {
      console.error("Failed to fetch resource:", error);
      router.push("/admin");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("정말로 이 리소스를 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/news/${resourceId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete resource");
      }

      router.push("/admin");
    } catch (error) {
      console.error("Error deleting resource:", error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div>로딩 중...</div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div>리소스를 찾을 수 없습니다.</div>
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
        <h2 className="text-2xl font-bold">리소스 상세 정보</h2>
        <Button variant="destructive" onClick={handleDelete}>
          <Trash className="mr-2 h-4 w-4" /> 삭제
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{resource.date} 시황</CardTitle>
          {resource.date && (
            <div className="text-sm text-gray-500">
              {new Date(resource.date).toLocaleDateString()}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">내용</h3>
              <div className="mt-2 whitespace-pre-wrap">{resource.content}</div>
            </div>
          </div>
        </CardContent>
        <CardFooter></CardFooter>
      </Card>
    </div>
  );
}
