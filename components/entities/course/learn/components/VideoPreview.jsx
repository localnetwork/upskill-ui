export default function VideoPreview({ lecture }) {
  console.log("lecture", lecture.asset.path);
  return (
    <div>
      <video
        src={process.env.NEXT_PUBLIC_API_DOMAIN + lecture.asset.path}
        controls
        className="w-full h-[500px] rounded-lg shadow-md absolute top-0 left-0 object-contain"
      />
    </div>
  );
}
