import axios from "axios";

export const uploadImageToCloudinary = async (imgFile: File): Promise<string | null> => {
  if (!imgFile) return null;

  const formData = new FormData();
  formData.append("file", imgFile);
  formData.append(
    "upload_preset",
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ""
  );

  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData
    );

    return response.data.secure_url;
  } catch (error: any) {
    console.error(
      "Image upload failed:",
      error?.response?.data || error.message
    );
    throw error;
  }
};

export const uploadAudioToCloudinary = async (audioBlob: Blob): Promise<string | null> => {
  if (!audioBlob) return null;

  const formData = new FormData();
  formData.append("file", audioBlob);
  formData.append(
    "upload_preset",
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ""
  );

  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
      formData
    );

    return response.data.secure_url;
  } catch (error: any) {
    console.error(
      "Audio upload failed:",
      error?.response?.data || error.message
    );
    throw error;
  }
};
