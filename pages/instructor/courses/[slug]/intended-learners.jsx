import CourseManagementLayout from "@/components/partials/CourseManagementLayout";
import BaseApi from "@/lib/api/_base.api";
import { useState, useCallback } from "react";
import courseStore from "@/lib/store/courseStore";
import toast from "react-hot-toast";

const genId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

const createInitial = (n = 4) =>
  Array.from({ length: n }, () => ({ id: genId(), text: "" }));
import { setContext } from "@/lib/api/interceptor";
export async function getServerSideProps(context) {
  const { slug } = context.params;

  setContext(context);

  let course = null;
  try {
    const response = await BaseApi.get(
      `${process.env.NEXT_PUBLIC_API_URL}/courses/${slug}`
    );
    course = response?.data?.data;
  } catch (error) {
    console.error("Error fetching course:", error);
    return { notFound: true };
  }

  return {
    props: { course },
  };
}

function useDragList() {
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const moveItem = useCallback((list, setter, from, to) => {
    if (from === to) return;
    const next = [...list];
    next.splice(to, 0, ...next.splice(from, 1));
    setter(next);
  }, []);

  const handlers = {
    onDragStart: (e, id) => {
      setDraggingId(id);
      e.dataTransfer.setData("text/plain", id);
    },
    onDragOver: (e, id) => {
      e.preventDefault();
      setDragOverId(id);
    },
    onDrop: (list, setter, e) => {
      e.preventDefault();
      const fromId = draggingId || e.dataTransfer.getData("text/plain");
      const toId = dragOverId;
      if (!fromId || !toId || fromId === toId) return;
      moveItem(
        list,
        setter,
        list.findIndex((x) => x.id === fromId),
        list.findIndex((x) => x.id === toId)
      );
      setDraggingId(null);
      setDragOverId(null);
    },
    onDragEnd: () => {
      setDraggingId(null);
      setDragOverId(null);
    },
  };

  return { draggingId, dragOverId, handlers };
}

function InputGroup({
  title,
  list,
  setter,
  placeholder,
  draggingId,
  dragOverId,
  handlers,
  description,
}) {
  const updateText = (id, value) =>
    setter((prev) =>
      prev.map((item) => (item.id === id ? { ...item, text: value } : item))
    );

  const addItem = () => setter((p) => [...p, { id: genId(), text: "" }]);
  const removeItem = (id) => setter((p) => p.filter((x) => x.id !== id));

  return (
    <div className="mb-[40px]">
      <h3 className="font-semibold text-lg mb-2">{title}</h3>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handlers.onDrop(list, setter, e)}
        className="space-y-2"
      >
        {list.map((item, i) => (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => handlers.onDragStart(e, item.id)}
            onDragOver={(e) => handlers.onDragOver(e, item.id)}
            onDragEnd={handlers.onDragEnd}
            className={`flex flex-col gap-1 group ${
              dragOverId === item.id
                ? "border-dashed border-blue-400 bg-blue-50"
                : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="relative w-full">
                <input
                  type="text"
                  maxLength={160}
                  value={item.text}
                  onChange={(e) => updateText(item.id, e.target.value)}
                  placeholder={placeholder}
                  className="border-[oklch(67.22%_0.0355_279.77deg)] border rounded-[5px] p-[10px] w-full pr-[50px]"
                  autoComplete="off"
                />
                <div className="text-right text-xs absolute top-[15px] right-[15px]">
                  <span
                    className={
                      item.text.length >= 150 ? "text-red-600" : "text-gray-500"
                    }
                  >
                    {item.text.length}/160
                  </span>
                </div>
              </div>
              <div
                className={`flex invisible ${
                  item.text.length > 0 ? "group-hover:visible" : ""
                } gap-1 shrink-0`}
              >
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="border-[2px] border-[#0056D2] text-[#0056D2] p-[5px] rounded-sm cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                    />
                  </svg>
                </button>
                <div className="cursor-grab px-2 select-none border-[2px] border-[#0056D2] text-[#0056D2] p-[5px] rounded-sm">
                  ☰
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[14px] mt-[15px]">{description}</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={addItem}
          className="cursor-pointer text-[#0056D2] font-bold hover:bg-[#e3efff] transition px-[15px] py-[10px] rounded-sm"
        >
          + Add more to your response
        </button>
      </div>
    </div>
  );
}

export default function IntendedLearners({ course }) {
  const mapToList = (arr) =>
    Array.isArray(arr) && arr.length > 0
      ? arr.map((text) => ({ id: genId(), text }))
      : createInitial();

  const [learnings, setLearnings] = useState(() =>
    mapToList(course?.goals?.what_you_will_learn_data)
  );
  const [requirements, setRequirements] = useState(() =>
    mapToList(course?.goals?.requirements_data)
  );
  const [audience, setAudience] = useState(() =>
    mapToList(course?.goals?.who_should_attend_data)
  );

  const { draggingId, dragOverId, handlers } = useDragList();
  const groupProps = { draggingId, dragOverId, handlers };

  const handleSave = async () => {
    const payload = {
      what_you_will_learn_data: learnings.map((x) => x.text).filter(Boolean),
      requirements_data: requirements.map((x) => x.text).filter(Boolean),
      who_should_attend_data: audience.map((x) => x.text).filter(Boolean),
    };

    try {
      const { data } = await BaseApi.put(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${course.id}/goals`,
        payload
      );

      // refresh state with API response
      setLearnings(mapToList(data?.data?.what_you_will_learn_data));
      setRequirements(mapToList(data?.data?.requirements_data));
      setAudience(mapToList(data?.data?.who_should_attend_data));
      toast.success("Intended learners updated successfully.");
    } catch (error) {
      console.log("error", error);
      toast.error(error?.data?.message || "Failed to update.");
      console.error("Error saving intended learners:", error);
    }
  };

  return (
    <CourseManagementLayout
      course={course}
      activeTab="intended-learners"
      title="Intended Learners"
    >
      <p className="mb-6">
        The following descriptions will be publicly visible on your Course
        Landing Page and will have a direct impact on your course performance.
        These descriptions will help learners decide if your course is right for
        them.
      </p>
      <InputGroup
        title="What will students learn in your course?"
        description="You should enter learning objectives or outcomes that learners can expect to achieve after completing your course."
        list={learnings}
        setter={setLearnings}
        placeholder="Example: Define roles and responsibilities of a project manager"
        {...groupProps}
      />
      <InputGroup
        title="What are the requirements or prerequisites?"
        description="List the required skills, experience, tools or equipment learners should have prior to taking your course.
If there are no requirements, use this space as an opportunity to lower the barrier for beginners."
        list={requirements}
        setter={setRequirements}
        placeholder="Example: No programming experience needed."
        {...groupProps}
      />
      <InputGroup
        title="Who is this course for?"
        description="Write a clear description of the intended learners for your course who will find your course content valuable.
This will help you attract the right learners to your course."
        list={audience}
        setter={setAudience}
        placeholder="Example: Beginner PHP developers curious about web development."
        {...groupProps}
      />

      <div className="mt-6">
        <button
          type="button"
          onClick={handleSave}
          className="bg-[#0056D2] flex items-center justify-center min-w-[200px] font-semibold text-white px-[30px] py-[10px] rounded-[5px] hover:bg-[#1d6de0] "
        >
          Update
        </button>
      </div>
    </CourseManagementLayout>
  );
}
