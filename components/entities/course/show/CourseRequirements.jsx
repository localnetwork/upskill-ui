export default function CourseRequirements({ course }) {
  return (
    <div>
      {course?.goals?.requirements_data && (
        <>
          <ul className="space-y-3">
            {course?.goals?.requirements_data.map((req, index) => (
              <li className="flex items-center gap-3" key={index}>
                <div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div>

                <span className="text-slate-600">{req}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
