import InstructorSidebar from "../entities/instructor/InstructorSidebar";

export default function InstructorLayout({ children }) {
  return (
    <div>
      <div className="container !px-0">
        <div className="flex flex-wrap min-h-screen">
          <div className="cols-span-1 w-[325px]">
            <InstructorSidebar />
          </div>
          <div className="col-span-2 w-[calc(100%-325px)] p-[50px] relative overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
