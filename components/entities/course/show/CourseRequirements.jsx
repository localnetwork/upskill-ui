export default function CourseRequirements({ course }) {
  return (
    <div>
      {course?.goals?.requirements_data && (
        <>
          <ul className="list-disc list-inside">
            {course?.goals?.requirements_data.map((req, index) => (
              <li key={index} className="font-light">
                {req}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
