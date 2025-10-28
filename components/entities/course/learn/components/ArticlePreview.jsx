export default function ArticlePreview({ lecture }) {
  console.log("lecture", lecture?.asset?.content);
  return (
    <div className="bg-white text-[25px] overflow-y-auto w-full h-[500px] shadow-md absolute top-0 left-0 p-6 prose prose-sm md:prose-base lg:prose-lg xl:prose-xl 2xl:prose-2xl">
      <div
        className="max-w-[500px] article-preview-description mx-auto"
        dangerouslySetInnerHTML={{ __html: lecture?.asset?.content }}
      />
    </div>
  );
}
