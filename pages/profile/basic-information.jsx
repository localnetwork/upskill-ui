import ProfileManagementLayout from "@/components/partials/ProfileManagementLayout";
import BaseApi from "@/lib/api/_base.api";
import persistentStore from "@/lib/store/persistentStore";
import { Editor } from "@tinymce/tinymce-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { extractErrors } from "@/lib/services/errorsExtractor";
export default function BasicInformation() {
  const profile = persistentStore((state) => state.profile);

  const [payload, setPayload] = useState({});
  const [errors, setErrors] = useState(null);

  useEffect(() => {
    if (profile) {
      setPayload({
        firstname: profile.firstname || "",
        lastname: profile.lastname || "",
        headline: profile.headline || "",
        biography: profile.biography || "",
        link_website: profile.link_website || "",
        link_facebook: profile.link_facebook || "",
        link_instagram: profile.link_instagram || "",
        link_linkedin: profile.link_linkedin || "",
        link_tiktok: profile.link_tiktok || "",
        link_x: profile.link_x || "",
        link_youtube: profile.link_youtube || "",
        link_github: profile.link_github || "",
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPayload((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await BaseApi.put(
        `${process.env.NEXT_PUBLIC_API_URL}/profile`,
        payload
      );
      console.log("Profile updated successfully:", response.data);
      setErrors(null);

      // ✅ Merge the updated payload with the existing profile
      persistentStore.setState((state) => ({
        profile: {
          ...state.profile,
          ...payload,
        },
      }));
      toast.success("Basic information saved successfully");
    } catch (error) {
      console.error("Error submitting basic information:", error);
      toast.error(error?.data?.message || "Error updating your profile.");
      setErrors(error?.data?.errors || null);
    }
  };

  return (
    <ProfileManagementLayout>
      <form className="" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-y-3">
            <div className="form-item">
              <label className="mb-2 block font-normal" htmlFor="firstname">
                First Name
              </label>
              <input
                type="text"
                value={payload.firstname}
                id="firstname"
                name="firstname"
                onChange={handleChange}
                className={`${extractErrors(errors, "firstname") ? "border-red-500" : "border-[oklch(67.22%_0.0355_279.77deg)]"} border rounded-[5px] p-[10px] w-full`}
                placeholder="Enter your first name"
              />
              {extractErrors(errors, "firstname") && (
                <p className="text-red-500 text-sm mt-1">
                  {extractErrors(errors, "firstname")}
                </p>
              )}
            </div>

            <div className="form-item">
              <label className="mb-2 block font-normal" htmlFor="lastname">
                Last Name
              </label>
              <input
                type="text"
                value={payload.lastname}
                id="lastname"
                name="lastname"
                onChange={handleChange}
                className={`${extractErrors(errors, "lastname") ? "border-red-500" : "border-[oklch(67.22%_0.0355_279.77deg)]"} border rounded-[5px] p-[10px] w-full`}
                placeholder="Enter your last name"
              />
              {extractErrors(errors, "lastname") && (
                <p className="text-red-500 text-sm mt-1">
                  {extractErrors(errors, "lastname")}
                </p>
              )}
            </div>

            <div className="form-item">
              <label className="mb-2 block font-normal" htmlFor="headline">
                Headline
              </label>
              <input
                type="text"
                value={payload.headline}
                id="headline"
                name="headline"
                onChange={handleChange}
                className="border border-[oklch(67.22%_0.0355_279.77deg)] rounded-[5px] p-[10px] w-full"
                placeholder="Enter your headline"
                maxLength={60}
              />
            </div>

            <div className="form-item">
              <label className="mb-2 block font-normal" htmlFor="biography">
                Biography
              </label>
              <Editor
                apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                value={payload.biography} // <-- controlled binding
                onEditorChange={(newValue) =>
                  setPayload((prev) => ({ ...prev, biography: newValue }))
                }
                init={{
                  height: 300,
                  menubar: false,
                  plugins: [
                    "advlist autolink lists link image charmap preview anchor",
                    "searchreplace visualblocks code fullscreen",
                    "insertdatetime media table code help wordcount",
                  ],
                  toolbar:
                    "undo redo | formatselect | " +
                    "bold italic underline | alignleft aligncenter " +
                    "alignright alignjustify | bullist numlist outdent indent | " +
                    "removeformat | help",
                  content_style:
                    "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
                }}
              />
            </div>
          </div>

          {/* RIGHT COLUMN (optional future content) */}
          <div className="flex flex-col gap-y-3">
            <div className="form-item">
              <label className="mb-2 block font-normal" htmlFor="link_website">
                Website
              </label>
              <input
                type="text"
                value={payload.link_website}
                id="link_website"
                name="link_website"
                onChange={handleChange}
                className="border border-[oklch(67.22%_0.0355_279.77deg)] rounded-[5px] p-[10px] w-full"
                placeholder="Enter your website URL"
                maxLength={60}
              />
            </div>
            <div className="form-item">
              <label className="mb-2 block font-normal" htmlFor="link_facebook">
                Facebook
              </label>
              <div className="flex">
                <span className="inline-flex font-light items-center relative z-1 px-3 text-sm text-gray-900 bg-[#f9f6f7] border border-[oklch(67.22%_0.0355_279.77deg)] rounded-l-md">
                  facebook.com/
                </span>
                <input
                  type="text"
                  value={payload.link_facebook}
                  id="link_facebook"
                  name="link_facebook"
                  onChange={handleChange}
                  className="border relative border-[oklch(67.22%_0.0355_279.77deg)] border-l-0 left-[-5px] pl-[20px] rounded-[5px] p-[10px] w-full"
                  placeholder="Username"
                />
              </div>
            </div>
            <div className="form-item">
              <label
                className="mb-2 block font-normal"
                htmlFor="link_instagram"
              >
                Instagram
              </label>
              <div className="flex">
                <span className="inline-flex font-light items-center relative z-1 px-3 text-sm text-gray-900 bg-[#f9f6f7] border border-[oklch(67.22%_0.0355_279.77deg)] rounded-l-md">
                  instagram.com/
                </span>
                <input
                  type="text"
                  value={payload.link_instagram}
                  id="link_instagram"
                  name="link_instagram"
                  onChange={handleChange}
                  className="border relative border-[oklch(67.22%_0.0355_279.77deg)] border-l-0 left-[-5px] pl-[20px] rounded-[5px] p-[10px] w-full"
                  placeholder="Username"
                />
              </div>
            </div>
            <div className="form-item">
              <label className="mb-2 block font-normal" htmlFor="link_linkedin">
                LinkedIn
              </label>
              <div className="flex">
                <span className="inline-flex font-light items-center relative z-1 px-3 text-sm text-gray-900 bg-[#f9f6f7] border border-[oklch(67.22%_0.0355_279.77deg)] rounded-l-md">
                  linkedin.com/
                </span>
                <input
                  type="text"
                  value={payload.link_linkedin}
                  id="link_linkedin"
                  name="link_linkedin"
                  onChange={handleChange}
                  className="border relative border-[oklch(67.22%_0.0355_279.77deg)] border-l-0 left-[-5px] pl-[20px] rounded-[5px] p-[10px] w-full"
                  placeholder="Public Profile URL"
                />
              </div>
            </div>
            <div className="form-item">
              <label className="mb-2 block font-normal" htmlFor="link_tiktok">
                Tiktok
              </label>
              <div className="flex">
                <span className="inline-flex font-light items-center relative z-1 px-3 text-sm text-gray-900 bg-[#f9f6f7] border border-[oklch(67.22%_0.0355_279.77deg)] rounded-l-md">
                  tiktok.com/
                </span>
                <input
                  type="text"
                  value={payload.link_tiktok}
                  id="link_tiktok"
                  name="link_tiktok"
                  onChange={handleChange}
                  className="border relative border-[oklch(67.22%_0.0355_279.77deg)] border-l-0 left-[-5px] pl-[20px] rounded-[5px] p-[10px] w-full"
                  placeholder="@Username"
                />
              </div>
            </div>
            <div className="form-item">
              <label className="mb-2 block font-normal" htmlFor="link_x">
                X (formerly Twitter)
              </label>
              <div className="flex">
                <span className="inline-flex font-light items-center relative z-1 px-3 text-sm text-gray-900 bg-[#f9f6f7] border border-[oklch(67.22%_0.0355_279.77deg)] rounded-l-md">
                  x.com/
                </span>
                <input
                  type="text"
                  value={payload.link_x}
                  id="link_x"
                  name="link_x"
                  onChange={handleChange}
                  className="border relative border-[oklch(67.22%_0.0355_279.77deg)] border-l-0 left-[-5px] pl-[20px] rounded-[5px] p-[10px] w-full"
                  placeholder="Username"
                />
              </div>
            </div>
            <div className="form-item">
              <label className="mb-2 block font-normal" htmlFor="link_youtube">
                Youtube
              </label>
              <div className="flex">
                <span className="inline-flex font-light items-center relative z-1 px-3 text-sm text-gray-900 bg-[#f9f6f7] border border-[oklch(67.22%_0.0355_279.77deg)] rounded-l-md">
                  youtube.com/
                </span>
                <input
                  type="text"
                  value={payload.link_youtube}
                  id="link_youtube"
                  name="link_youtube"
                  onChange={handleChange}
                  className="border relative border-[oklch(67.22%_0.0355_279.77deg)] border-l-0 left-[-5px] pl-[20px] rounded-[5px] p-[10px] w-full"
                  placeholder="Username"
                />
              </div>
            </div>
            <div className="form-item">
              <label className="mb-2 block font-normal" htmlFor="link_github">
                Github
              </label>
              <div className="flex">
                <span className="inline-flex font-light items-center relative z-1 px-3 text-sm text-gray-900 bg-[#f9f6f7] border border-[oklch(67.22%_0.0355_279.77deg)] rounded-l-md">
                  github.com/
                </span>
                <input
                  type="text"
                  value={payload.link_github}
                  id="link_github"
                  name="link_github"
                  onChange={handleChange}
                  className="border relative border-[oklch(67.22%_0.0355_279.77deg)] border-l-0 left-[-5px] pl-[20px] rounded-[5px] p-[10px] w-full"
                  placeholder="Username"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          class="bg-[#0056D2] flex items-center justify-center min-w-[150px] font-semibold text-white px-[30px] py-[10px] rounded-[5px] hover:bg-[#1d6de0] "
        >
          Save
        </button>
      </form>
    </ProfileManagementLayout>
  );
}
