import { useEffect, useState } from "react";

interface FingooInfoComponentProps {
  isActive: boolean;
}

interface FingooInfo {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function FingooInfoComponent({
  isActive,
}: FingooInfoComponentProps) {
  const [fingooInfoList, setFingooInfoList] = useState<FingooInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newInfo, setNewInfo] = useState({ description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isActive) {
      fetchFingooInfo();
    }
  }, [isActive]);

  const fetchFingooInfo = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/fingoo-info");

      if (!response.ok) {
        throw new Error("Failed to fetch fingoo information");
      }

      const data = await response.json();
      setFingooInfoList(data);
    } catch (err) {
      console.error("Error fetching fingoo info:", err);
      setError("핀구 정보를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/fingoo-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newInfo.description }),
      });

      if (!response.ok) {
        throw new Error("Failed to create new fingoo information");
      }

      // Reset form
      setNewInfo({ description: "" });

      // Refresh data
      fetchFingooInfo();
    } catch (err) {
      console.error("Error creating fingoo info:", err);
      setSubmitError("핀구 정보 등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("모든 핀구 정보를 삭제하시겠습니까?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch("/api/fingoo-info", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete all fingoo information");
      }

      // Refresh data
      fetchFingooInfo();
    } catch (err) {
      console.error("Error deleting fingoo info:", err);
      setError("핀구 정보 삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="text-center p-4">로딩 중...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  if (fingooInfoList.length === 0) {
    return (
      <div className="space-y-6">
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">새 핀구 정보 등록</h2>

          {submitError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                설명
              </label>
              <textarea
                id="description"
                name="description"
                value={newInfo.description}
                onChange={handleInputChange}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
            >
              {isSubmitting ? "등록 중..." : "핀구 정보 등록하기"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          <span>
            생성일: {new Date(fingooInfoList[0].createdAt).toLocaleDateString()}
          </span>
          <span className="mx-2">|</span>
          <span>
            수정일: {new Date(fingooInfoList[0].updatedAt).toLocaleDateString()}
          </span>
        </div>
        <button
          onClick={handleDeleteAll}
          disabled={isDeleting}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-red-300"
        >
          {isDeleting ? "삭제 중..." : "전체 삭제"}
        </button>
      </div>
      <div className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
        {fingooInfoList.map((info) => (
          <div key={info.id} className="text-gray-600 mt-2 border-b">
            {info.content}
          </div>
        ))}
      </div>
    </div>
  );
}
