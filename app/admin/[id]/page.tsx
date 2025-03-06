"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Resource } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Trash } from "lucide-react";

export default function ResourceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const resourceId = params.id as string;

  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [editedResource, setEditedResource] = useState<Partial<Resource>>({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("view");

  useEffect(() => {
    if (resourceId) {
      fetchResource(resourceId);
    }
  }, [resourceId]);

  const fetchResource = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/news/${id}`);
      if (!response.ok) {
        throw new Error("Resource not found");
      }
      const data = await response.json();
      setResource(data);
      setEditedResource(data);
    } catch (error) {
      console.error("Failed to fetch resource:", error);
      router.push("/admin");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditedResource({
      ...editedResource,
      [name]: value,
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/news/${resourceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedResource),
      });

      if (!response.ok) {
        throw new Error("Failed to update resource");
      }

      const updatedResource = await response.json();
      setResource(updatedResource);
      setActiveTab("view");
    } catch (error) {
      console.error("Error updating resource:", error);
    } finally {
      setSaving(false);
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="view">보기</TabsTrigger>
            <TabsTrigger value="edit">수정</TabsTrigger>
          </TabsList>
          {activeTab === "view" && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash className="mr-2 h-4 w-4" /> 삭제
            </Button>
          )}
        </div>

        <TabsContent value="view">
          <Card>
            <CardHeader>
              <CardTitle>{resource.title}</CardTitle>
              {resource.date && (
                <div className="text-sm text-gray-500">
                  {new Date(resource.date).toLocaleDateString()}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resource.link && (
                  <div>
                    <h3 className="text-sm font-medium">링크</h3>
                    <a
                      href={resource.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {resource.link}
                    </a>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-medium">내용</h3>
                  <div className="mt-2 whitespace-pre-wrap">
                    {resource.content}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => setActiveTab("edit")}>수정하기</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="edit">
          <Card>
            <CardHeader>
              <CardTitle>리소스 수정</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">제목</Label>
                  <Input
                    id="title"
                    name="title"
                    value={editedResource.title || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="link">링크 (선택사항)</Label>
                  <Input
                    id="link"
                    name="link"
                    value={editedResource.link || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">날짜 (선택사항)</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={
                      editedResource.date
                        ? new Date(editedResource.date)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">내용</Label>
                  <Textarea
                    id="content"
                    name="content"
                    rows={10}
                    value={editedResource.content || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("view")}>
                취소
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  "저장 중..."
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> 저장하기
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
