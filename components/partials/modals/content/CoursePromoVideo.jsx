import modalState from "@/lib/store/modalState";
export default function CoursePromoVideo() {
  const modalInfo = modalState((state) => state.modalInfo);

  console.log("modalInfo", modalInfo?.data?.video_path);
  return (
    <div>
      <video className="w-full h-full" controls autoPlay>
        <source
          src={process.env.NEXT_PUBLIC_API_DOMAIN + modalInfo?.data?.video_path}
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
