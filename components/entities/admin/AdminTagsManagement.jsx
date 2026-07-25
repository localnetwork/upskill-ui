import BaseApi from "@/lib/api/_base.api";
import SlugField from "@/components/forms/SlugField";
import dynamic from "next/dynamic";
import { Edit2, Plus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const TextEditor = dynamic(() => import("@/components/forms/TextEditor"), {
  ssr: false,
});

export default function AdminTagsManagement() {
  const [tags, setTags] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTagId, setActiveTagId] = useState(null);
  const [modalMode, setModalMode] = useState("create");
  const [slugStatus, setSlugStatus] = useState({
    isChecking: false,
    isAvailable: true,
    isValid: false,
    message: "",
  });
  const [formValues, setFormValues] = useState({
    title: "",
    slug: "",
    description: "",
    categoryId: "",
  });

  const fetchTags = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await BaseApi.get(
        `${process.env.NEXT_PUBLIC_API_URL}/tags?page=1&limit=200&nocache=true`,
      );
      const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
      setTags(rows);
    } catch (error) {
      setTags([]);
      toast.error(error?.data?.message || "Failed to fetch tags.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await BaseApi.get(
        `${process.env.NEXT_PUBLIC_API_URL}/categories?tree=true&nocache=true`,
      );
      const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
      const flatRows = [];
      const walk = (items = [], depth = 0) => {
        for (const item of items) {
          flatRows.push({
            id: item.id,
            title: item.name || item.title || "",
            depth,
          });
          walk(item.children || [], depth + 1);
        }
      };
      walk(rows);
      setCategories(flatRows);
    } catch (_error) {
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    fetchTags();
    fetchCategories();
  }, [fetchTags, fetchCategories]);

  const categoryMap = useMemo(
    () => new Map(categories.map((item) => [item.id, item.title])),
    [categories],
  );

  const openCreateModal = useCallback(() => {
    setModalMode("create");
    setActiveTagId(null);
    setSlugStatus({
      isChecking: false,
      isAvailable: true,
      isValid: false,
      message: "",
    });
    setFormValues({
      title: "",
      slug: "",
      description: "",
      categoryId: "",
    });
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((tag) => {
    setModalMode("edit");
    setActiveTagId(tag.id);
    setSlugStatus({
      isChecking: false,
      isAvailable: true,
      isValid: true,
      message: "",
    });
    setFormValues({
      title: tag.title || tag.name || "",
      slug: tag.slug || "",
      description: tag.description || "",
      categoryId: tag.categoryId || tag.category_id || "",
    });
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setActiveTagId(null);
    setSlugStatus({
      isChecking: false,
      isAvailable: true,
      isValid: false,
      message: "",
    });
  }, []);

  const checkTagSlugAvailability = useCallback(
    async (slug) => {
      try {
        const response = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/tags/${encodeURIComponent(slug)}?nocache=true`,
        );
        const row = response?.data?.data || response?.data || null;
        const isCurrent = String(row?.id || "") === String(activeTagId || "");
        return { isAvailable: !row || isCurrent };
      } catch (error) {
        const statusCode = Number(error?.response?.status || error?.status || 0);
        if (statusCode === 404) {
          return { isAvailable: true };
        }
        throw error;
      }
    },
    [activeTagId],
  );

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const title = String(formValues.title || "").trim();
      const slug = String(formValues.slug || "").trim();
      const categoryId = String(formValues.categoryId || "").trim();

      if (!title) {
        toast.error("Title is required.");
        return;
      }
      if (!slug) {
        toast.error("Slug is required.");
        return;
      }
      if (!slugStatus.isValid) {
        toast.error(slugStatus.message || "Slug is invalid.");
        return;
      }
      if (slugStatus.isChecking) {
        toast.error("Slug availability is still being checked.");
        return;
      }
      if (!slugStatus.isAvailable) {
        toast.error("Slug already exists.");
        return;
      }
      if (!categoryId) {
        toast.error("Category is required.");
        return;
      }

      try {
        setIsSaving(true);
        const payload = {
          title,
          slug,
          description: String(formValues.description || "").trim() || null,
          categoryId,
        };

        if (modalMode === "create") {
          await BaseApi.post(`${process.env.NEXT_PUBLIC_API_URL}/tags`, payload);
          toast.success("Tag created.");
        } else if (activeTagId) {
          await BaseApi.patch(
            `${process.env.NEXT_PUBLIC_API_URL}/tags/${activeTagId}`,
            payload,
          );
          toast.success("Tag updated.");
        }

        closeModal();
        await fetchTags();
      } catch (error) {
        toast.error(error?.data?.message || "Failed to save tag.");
      } finally {
        setIsSaving(false);
      }
    },
    [activeTagId, closeModal, fetchTags, formValues, modalMode, slugStatus],
  );

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Manage tags used to classify course content.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-full bg-[#0056d2] px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Add tag
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-[#e2e8f0] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Title
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Slug
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Category
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Description
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {tags.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-4 text-sm font-medium text-slate-900">
                      {row.title || row.name}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{row.slug}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {row?.category?.name ||
                        row?.category?.title ||
                        categoryMap.get(row.categoryId || row.category_id) ||
                        "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      <span className="line-clamp-2">{row.description || "—"}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openEditModal(row)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}

                {!tags.length ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                      {isLoading ? "Loading tags..." : "No tags found."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                {modalMode === "create" ? "Create Tag" : "Edit Tag"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Title
                </label>
                <input
                  type="text"
                  value={formValues.title}
                  onChange={(event) =>
                    setFormValues((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none"
                  placeholder="JavaScript Basics"
                  required
                />
              </div>

              <SlugField
                label="Slug"
                value={formValues.slug}
                sourceValue={formValues.title}
                placeholder="javascript-basics"
                maxLength={150}
                resetKey={`${modalMode}:${activeTagId || "new"}`}
                onChange={(nextSlug) =>
                  setFormValues((prev) => ({ ...prev, slug: nextSlug }))
                }
                onStatusChange={setSlugStatus}
                checkAvailability={checkTagSlugAvailability}
              />

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Category
                </label>
                <select
                  value={formValues.categoryId}
                  onChange={(event) =>
                    setFormValues((prev) => ({ ...prev, categoryId: event.target.value }))
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {`${"— ".repeat(item.depth)}${item.title}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Description
                </label>
                <div className="rounded-md border border-slate-300">
                  <TextEditor
                    name="description"
                    value={formValues.description || ""}
                    initialValue={formValues.description || ""}
                    height={240}
                    onChange={(event) =>
                      setFormValues((prev) => ({
                        ...prev,
                        description: event?.target?.value || "",
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-md bg-[#0056d2] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : "Save tag"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
