import BaseApi from "@/lib/api/_base.api";
import SlugField from "@/components/forms/SlugField";
import dynamic from "next/dynamic";
import { Edit2, Plus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const TextEditor = dynamic(() => import("@/components/forms/TextEditor"), {
  ssr: false,
});

function normalizeCategoryTree(rows = []) {
  return rows.map((row) => ({
    ...row,
    title: row?.name || row?.title || "",
    parentId: row?.parentId || row?.parent_id || null,
    children: normalizeCategoryTree(row?.children || []),
  }));
}

function flattenTree(rows = [], depth = 0, parentTitle = null, acc = []) {
  for (const row of rows) {
    acc.push({
      id: row.id,
      title: row.title,
      slug: row.slug,
      image: row.image || "",
      depth,
      parentId: row.parentId,
      parentTitle,
      children: row.children || [],
    });
    flattenTree(row.children || [], depth + 1, row.title, acc);
  }
  return acc;
}

function collectDescendantIds(category) {
  const ids = [];
  const stack = [...(category?.children || [])];
  while (stack.length) {
    const current = stack.pop();
    ids.push(current.id);
    if (Array.isArray(current.children) && current.children.length) {
      stack.push(...current.children);
    }
  }
  return ids;
}

export default function AdminCategoriesManagement() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
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
    image: "",
    description: "",
    parentId: "",
  });

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await BaseApi.get(
        `${process.env.NEXT_PUBLIC_API_URL}/categories?tree=true&nocache=true`,
      );
      const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
      setCategories(normalizeCategoryTree(rows));
    } catch (error) {
      setCategories([]);
      toast.error(error?.data?.message || "Failed to fetch categories.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const flatCategories = useMemo(() => flattenTree(categories), [categories]);

  const activeCategory = useMemo(
    () => flatCategories.find((item) => item.id === activeCategoryId) || null,
    [activeCategoryId, flatCategories],
  );

  const blockedParentIds = useMemo(() => {
    if (!activeCategory) return new Set();
    return new Set([activeCategory.id, ...collectDescendantIds(activeCategory)]);
  }, [activeCategory]);

  const openCreateModal = useCallback(() => {
    setModalMode("create");
    setActiveCategoryId(null);
    setSlugStatus({
      isChecking: false,
      isAvailable: true,
      isValid: false,
      message: "",
    });
    setFormValues({ title: "", slug: "", image: "", description: "", parentId: "" });
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((category) => {
    setModalMode("edit");
    setActiveCategoryId(category.id);
    setSlugStatus({
      isChecking: false,
      isAvailable: true,
      isValid: true,
      message: "",
    });
    setFormValues({
      title: category.title || "",
      slug: category.slug || "",
      image: category.image || "",
      description: category.description || category.category_description || "",
      parentId: category.parentId || "",
    });
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setActiveCategoryId(null);
    setSlugStatus({
      isChecking: false,
      isAvailable: true,
      isValid: false,
      message: "",
    });
    setIsUploadingImage(false);
    setUploadProgress(0);
  }, []);

  const checkCategorySlugAvailability = useCallback(
    async (slug) => {
      try {
        const response = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/categories/${encodeURIComponent(slug)}?nocache=true`,
        );
        const row = response?.data?.data || response?.data || null;
        const isCurrent = String(row?.id || "") === String(activeCategoryId || "");
        return { isAvailable: !row || isCurrent };
      } catch (error) {
        const statusCode = Number(error?.response?.status || error?.status || 0);
        if (statusCode === 404) {
          return { isAvailable: true };
        }
        throw error;
      }
    },
    [activeCategoryId],
  );

  const handleImageUpload = useCallback(async (event) => {
    const file = event?.target?.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name);

    setIsUploadingImage(true);
    setUploadProgress(0);

    try {
      const response = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/media`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (uploadEvent) => {
            if (uploadEvent.lengthComputable) {
              setUploadProgress(
                Math.round((uploadEvent.loaded / uploadEvent.total) * 100),
              );
            }
          },
        },
      );

      const uploadedPath = response?.data?.path || response?.data?.data?.path || "";
      if (!uploadedPath) {
        toast.error("Upload completed but no image path was returned.");
        return;
      }

      setFormValues((prev) => ({ ...prev, image: uploadedPath }));
      toast.success("Image uploaded.");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to upload image.");
    } finally {
      event.target.value = "";
      setIsUploadingImage(false);
      setUploadProgress(0);
    }
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const title = String(formValues.title || "").trim();
      const slug = String(formValues.slug || "").trim();

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

      try {
        setIsSaving(true);
        const payload = {
          title,
          slug,
          image: String(formValues.image || "").trim() || null,
          description: String(formValues.description || "").trim() || null,
          parentId: formValues.parentId || null,
        };

        if (modalMode === "create") {
          await BaseApi.post(`${process.env.NEXT_PUBLIC_API_URL}/categories`, payload);
          toast.success("Category created.");
        } else if (activeCategoryId) {
          await BaseApi.patch(
            `${process.env.NEXT_PUBLIC_API_URL}/categories/${activeCategoryId}`,
            payload,
          );
          toast.success("Category updated.");
        }

        closeModal();
        await fetchCategories();
      } catch (error) {
        toast.error(error?.data?.message || "Failed to save category.");
      } finally {
        setIsSaving(false);
      }
    },
    [activeCategoryId, closeModal, fetchCategories, formValues, modalMode, slugStatus],
  );

  const rows = useMemo(() => {
    const result = [];

    const walk = (nodes = [], depth = 0, parentTitle = null) => {
      for (const node of nodes) {
        result.push({ ...node, depth, parentTitle });
        if (Array.isArray(node.children) && node.children.length) {
          walk(node.children, depth + 1, node.title);
        }
      }
    };

    walk(categories);
    return result;
  }, [categories]);

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Manage category hierarchy and metadata used across the platform.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-full bg-[#0056d2] px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Add category
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
                    Image
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Parent
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-4 text-sm font-medium text-slate-900">
                      <div
                        className="flex items-center gap-2"
                        style={{ paddingLeft: `${row.depth * 18}px` }}
                      >
                        {row.depth > 0 ? (
                          <span className="text-slate-300">└</span>
                        ) : null}
                        <span>{row.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{row.slug}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {row.image ? (
                        <div className="flex items-center gap-3">
                          <img
                            src={row.image}
                            alt={row.title}
                            className="h-10 w-16 rounded border border-slate-200 object-cover"
                          />
                          <span className="max-w-[220px] truncate text-xs text-slate-500">
                            {row.image}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No image</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {row.parentTitle || "—"}
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

                {!rows.length ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                      {isLoading ? "Loading categories..." : "No categories found."}
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
                {modalMode === "create" ? "Create Category" : "Edit Category"}
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
                  placeholder="Frontend Development"
                  required
                />
              </div>

              <SlugField
                label="Slug"
                value={formValues.slug}
                sourceValue={formValues.title}
                placeholder="frontend-development"
                maxLength={150}
                resetKey={`${modalMode}:${activeCategoryId || "new"}`}
                onChange={(nextSlug) =>
                  setFormValues((prev) => ({ ...prev, slug: nextSlug }))
                }
                onStatusChange={setSlugStatus}
                checkAvailability={checkCategorySlugAvailability}
              />

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

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Category Image
                </label>
                <div className="rounded-md border border-slate-300 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <label
                      htmlFor="category-image-upload"
                      className="inline-flex cursor-pointer items-center rounded-md border border-[#0056d2] px-3 py-2 text-xs font-semibold text-[#0056d2] hover:bg-[#0056d2] hover:text-white"
                    >
                      {isUploadingImage
                        ? `Uploading... ${uploadProgress}%`
                        : "Upload image"}
                    </label>
                    <input
                      id="category-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="sr-only"
                    />
                    {formValues.image ? (
                      <button
                        type="button"
                        onClick={() => setFormValues((prev) => ({ ...prev, image: "" }))}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Upload .jpg, .jpeg, .png, or .gif.
                  </p>
                  {formValues.image ? (
                    <img
                      src={formValues.image}
                      alt="Category preview"
                      className="mt-3 h-24 w-full rounded border border-slate-200 object-cover"
                    />
                  ) : null}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Parent Category
                </label>
                <select
                  value={formValues.parentId}
                  onChange={(event) =>
                    setFormValues((prev) => ({ ...prev, parentId: event.target.value }))
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none"
                >
                  <option value="">None (root category)</option>
                  {flatCategories.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                      disabled={blockedParentIds.has(item.id)}
                    >
                      {`${"— ".repeat(item.depth)}${item.title}`}
                    </option>
                  ))}
                </select>
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
                  disabled={isSaving || isUploadingImage}
                  className="rounded-md bg-[#0056d2] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isSaving
                    ? "Saving..."
                    : isUploadingImage
                      ? "Uploading image..."
                      : "Save category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
