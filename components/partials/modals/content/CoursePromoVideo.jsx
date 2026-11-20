import modalState from "@/lib/store/modalState";
export default function CoursePromoVideo() {
  const modalInfo = modalState((state) => state.modalInfo);

  return (
    <div className="flex justify-center rounded-[12px] bg-black overflow-hidden">
      <video
        className="block w-full h-[calc(100dvh-220px)] object-contain"
        controls
        autoPlay
      >
        <source src={modalInfo?.data?.video_path} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
