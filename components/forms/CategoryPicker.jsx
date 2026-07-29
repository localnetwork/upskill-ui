import { useState, useMemo, useEffect } from "react";
import {
  Briefcase,
  Palette,
  Code2,
  Landmark,
  HeartPulse,
  Server,
  Sparkles,
  Megaphone,
  Music2,
  MonitorCog,
  UserRound,
  Camera,
  GraduationCap,
  BookOpen,
  Lightbulb,
  Globe,
  Target,
  Wrench,
} from "lucide-react";
import categories from "@/lib/preBuildScripts/static/categories.json";

const normalizeEntry = ({ parent, sub }) => ({
  parent: String(parent),
  sub: String(sub),
});

const PARENT_ICON_BY_SLUG = {
  business: Briefcase,
  design: Palette,
  development: Code2,
  "finance-accounting": Landmark,
  "health-fitness": HeartPulse,
  "it-software": Server,
  lifestyle: Sparkles,
  marketing: Megaphone,
  music: Music2,
  "office-productivity": MonitorCog,
  "personal-development": UserRound,
  "photography-video": Camera,
  "teaching-academics": GraduationCap,
};

const CHILD_ICON_POOL = [BookOpen, Lightbulb, Globe, Target, Wrench];

const hashText = (value) => {
  const text = String(value || "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getNodeIcon = (node, parent = null) => {
  if (!parent) {
    return PARENT_ICON_BY_SLUG[node?.slug] || BookOpen;
  }

  const poolIndex = hashText(node?.slug || node?.title) % CHILD_ICON_POOL.length;
  return CHILD_ICON_POOL[poolIndex];
};

const flattenDescendants = (nodes = [], depth = 0) => {
  const flattened = [];

  for (const node of nodes) {
    flattened.push({
      id: String(node.id),
      title: String(node.title || ""),
      slug: String(node.slug || ""),
      depth,
    });

    if (Array.isArray(node.children) && node.children.length > 0) {
      flattened.push(...flattenDescendants(node.children, depth + 1));
    }
  }

  return flattened;
};

const findDescendantById = (nodes = [], targetId) => {
  const normalizedTarget = String(targetId);

  for (const node of nodes) {
    if (String(node.id) === normalizedTarget) return node;
    if (Array.isArray(node.children) && node.children.length > 0) {
      const childMatch = findDescendantById(node.children, normalizedTarget);
      if (childMatch) return childMatch;
    }
  }

  return null;
};

export const getMergedCategoryIds = (selectedCategories = []) => {
  const ids = new Set();

  for (const entry of selectedCategories) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;

    const { parent, sub } = entry;

    if (parent != null && typeof parent !== "function") {
      ids.add(String(parent));
    }
    if (sub != null && typeof sub !== "function") {
      ids.add(String(sub));
    }
  }

  return [...ids];
};

export const resolveInitialValue = (flatIds = []) => {
  if (!flatIds.length) return [];

  const ids = new Set(flatIds.map(String));
  const result = [];

  for (const parent of categories) {
    const parentId = String(parent.id);
    const descendants = flattenDescendants(parent.children ?? []);
    const matchedChild = descendants.find((node) => ids.has(node.id));

    if (matchedChild?.id) {
      result.push({ parent: parentId, sub: matchedChild.id });
    } else if (ids.has(parentId)) {
      result.push({ parent: parentId, sub: parentId });
    }
  }

  return result;
};

export default function CategoryPicker({
  label,
  name,
  value,
  onChange,
  error,
  showIcons = false,
}) {
  const initialSelected = useMemo(() => {
    if (!Array.isArray(value) || value.length === 0) return [];

    if (typeof value[0] === "object" && "parent" in value[0]) {
      return value.map(normalizeEntry);
    }

    return resolveInitialValue(value);
  }, [value]);

  const [navigationPath, setNavigationPath] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [navDirection, setNavDirection] = useState("forward");

  useEffect(() => {
    setSelectedCategories(initialSelected);
  }, [initialSelected]);

  const handleChange = (updated) => {
    setSelectedCategories(updated);
    onChange(updated);
  };

  const handleNodeSelect = (node) => {
    const children = Array.isArray(node?.children) ? node.children : [];
    if (children.length > 0) {
      setNavDirection("forward");
      setNavigationPath((prev) => [...prev, node]);
      return;
    }

    const rootNode = navigationPath[0] || node;
    toggleSub(rootNode.id, node.id);
  };

  const toggleSub = (parent, sub) => {
    const p = String(parent);
    const s = String(sub);

    const exists = selectedCategories.some(
      (item) => item.parent === p && item.sub === s,
    );

    if (exists) {
      handleChange([]);
    } else {
      handleChange([{ parent: p, sub: s }]);
    }
  };

  const removeTag = (parent, sub) => {
    const p = String(parent);
    const s = String(sub);
    handleChange(
      selectedCategories.filter(
        (item) => !(item.parent === p && item.sub === s),
      ),
    );
  };

  const currentNodes = useMemo(() => {
    if (navigationPath.length === 0) return categories;
    return navigationPath[navigationPath.length - 1]?.children ?? [];
  }, [navigationPath]);

  const selectedLookup = useMemo(() => {
    const map = new Map();

    for (const { parent, sub } of selectedCategories) {
      const parentCategory = categories.find((item) => String(item.id) === parent);
      const childCategory = findDescendantById(parentCategory?.children ?? [], sub);
      map.set(
        `${parent}-${sub}`,
        childCategory || parentCategory || { id: sub, title: `Category #${sub}` },
      );
    }

    return map;
  }, [selectedCategories]);

  const selectedParentIds = useMemo(
    () => new Set(selectedCategories.map((item) => String(item.parent))),
    [selectedCategories],
  );

  const activeRootId = String(navigationPath[0]?.id ?? "");

  const getSelectionState = (node) => {
    const nodeId = String(node.id);
    if (navigationPath.length === 0) {
      return selectedParentIds.has(nodeId);
    }

    return selectedCategories.some(
      (item) => item.parent === activeRootId && item.sub === nodeId,
    );
  };

  const handleBack = () => {
    setNavDirection("back");
    setNavigationPath((prev) => prev.slice(0, -1));
  };

  const handleStartOver = () => {
    setNavDirection("back");
    setNavigationPath([]);
  };

  const screenKey = useMemo(() => {
    const pathKey = navigationPath.map((node) => String(node.id)).join("-");
    return `${navDirection}-${pathKey || "root"}`;
  }, [navigationPath, navDirection]);

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium" htmlFor={name}>
          {label} <span className="text-red-500">*</span>
        </label>
      )}

      <div className="border border-gray-200 rounded-lg p-3 text-sm">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="text-xs text-gray-500 font-medium">
            {navigationPath.length === 0
              ? "Categories"
              : navigationPath[navigationPath.length - 1]?.title}
          </div>
          <div className="flex items-center gap-2">
            {navigationPath.length > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 text-gray-600"
              >
                Back
              </button>
            )}
            {navigationPath.length > 1 && (
              <button
                type="button"
                onClick={handleStartOver}
                className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 text-gray-600"
              >
                Top
              </button>
            )}
          </div>
        </div>

        {navigationPath.length > 0 && (
          <p className="text-xs text-[#64748b] mb-2">
            {navigationPath.map((node) => node.title).join(" > ")}
          </p>
        )}

        <div
          key={screenKey}
          className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 ${
            navDirection === "forward"
              ? "animate-category-forward"
              : "animate-category-back"
          }`}
        >
          {currentNodes.map((node) => {
            const isChosen = getSelectionState(node);
            const hasChildren = Array.isArray(node?.children) && node.children.length > 0;
            const NodeIcon = getNodeIcon(
              node,
              navigationPath.length === 0 ? null : navigationPath[0],
            );

            return (
              <button
                key={node.id}
                type="button"
                onClick={() => handleNodeSelect(node)}
                className={`relative rounded-xl border px-4 py-5 min-h-[132px] transition-colors ${
                  isChosen
                    ? "border-violet-300 bg-violet-50 text-violet-700"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="inline-flex flex-col items-center justify-center w-full h-full gap-3 text-center">
                  {showIcons ? (
                    <NodeIcon size={24} className="text-[#64748b]" aria-hidden />
                  ) : null}
                  <span className="text-sm font-medium leading-tight">{node.title}</span>
                </span>
                {hasChildren ? (
                  <span className="absolute top-2 right-2 text-xs text-[#94a3b8]">{">"}</span>
                ) : isChosen ? (
                  <span className="absolute top-2 right-2 text-xs text-violet-500">✓</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected tags */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {selectedCategories.map(({ parent, sub }) => {
            const selectedKey = `${parent}-${sub}`;
            const selectedItem = selectedLookup.get(selectedKey);
            return (
              <span
                key={`${parent}-${sub}`}
                className="flex items-center gap-1 bg-violet-50 text-violet-700 text-xs rounded-full px-3 py-1"
              >
                {selectedItem?.title ?? `Category #${sub}`}
                <button
                  type="button"
                  onClick={() => removeTag(parent, sub)}
                  className="text-violet-400 hover:text-violet-700 leading-none"
                >
                  &times;
                </button>
              </span>
            );
          })}
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <style jsx>{`
        .animate-category-forward {
          animation: categoryForward 220ms ease;
        }

        .animate-category-back {
          animation: categoryBack 220ms ease;
        }

        @keyframes categoryForward {
          from {
            opacity: 0;
            transform: translateX(14px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes categoryBack {
          from {
            opacity: 0;
            transform: translateX(-14px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
