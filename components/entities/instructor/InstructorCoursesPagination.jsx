export default function InstructorCoursesPagination({
  totalPages,
  handlePageChange,
  params,
}) {
  return (
    <>
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-4 py-2 rounded-md border ${
                params.page === page ? "bg-[#0056D2] text-white" : "bg-white"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
