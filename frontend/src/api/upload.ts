import apiClient from "./client";

export async function uploadEventImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await apiClient.post<{ imageUrl: string }>("/uploads/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data.imageUrl;
}