import ImageUpload from "@/components/forms/ImageUpload";
import ProfileManagementLayout from "@/components/partials/ProfileManagementLayout";
import BaseApi from "@/lib/api/_base.api";
import persistentStore from "@/lib/store/persistentStore";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
export default function BasicInformation() {
  const [payload, setPayload] = useState({});
  const profile = persistentStore((state) => state.profile);

  useEffect(() => {
    setPayload({
      user_picture: profile?.user_picture.id || "",
    });
  }, [profile]);

  const handleChange = (eOrPayload, maybe) => {
    let target = null;

    if (maybe && maybe.target) {
      target = maybe.target;
    } else if (eOrPayload && eOrPayload.target) {
      target = eOrPayload.target;
    } else if (
      eOrPayload &&
      typeof eOrPayload === "object" &&
      "name" in eOrPayload &&
      "value" in eOrPayload
    ) {
      target = eOrPayload;
    }

    if (!target) {
      console.warn("handleChange: no target found", { eOrPayload, maybe });
      return;
    }

    const { name, value } = target;
    if (!name) {
      console.warn("handleChange: target has no name", target);
      return;
    }

    setPayload((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await BaseApi.put(
        `${process.env.NEXT_PUBLIC_API_URL}/profile/user-picture`,
        payload
      );

      persistentStore.setState((state) => ({
        profile: {
          ...state.profile,
          user_picture: response.data.data,
        },
      }));
      toast.success("Profile photo updated successfully.");
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Error updating profile photo.");
    }
  };

  return (
    <ProfileManagementLayout>
      <form onSubmit={handleSubmit} className="space-y-6">
        <ImageUpload
          onChange={handleChange}
          value={profile?.user_picture || ""}
          title={payload?.title || ""}
          preview={payload?.user_picture?.path || null}
          name="user_picture"
          label="User Picture"
          description="Upload your course image here. It must meet our course image quality
            standards to be accepted. Important guidelines: 750x422 pixels;
            .jpg, .jpeg,. gif, or .png. no text on the image."
        />

        <button
          type="submit"
          className="bg-[#0056D2] flex items-center justify-center min-w-[150px] font-semibold text-white px-[30px] py-[10px] rounded-[5px] hover:bg-[#1d6de0] "
        >
          Save
        </button>
      </form>
    </ProfileManagementLayout>
  );
}
