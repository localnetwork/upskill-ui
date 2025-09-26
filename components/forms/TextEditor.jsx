import React, { useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";

export default function TextEditor({ handleChange, payload, name }) {
  const editorRef = useRef(null);

  return (
    <Editor
      apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
      onInit={(evt, editor) => (editorRef.current = editor)}
      initialValue={payload.description}
      name={name}
      init={{
        height: 400,
        menubar: false,
        plugins: [
          "advlist autolink lists link image charmap print preview anchor",
          "searchreplace visualblocks fullscreen",
          "insertdatetime media table paste wordcount",
        ],
        toolbar:
          "undo redo | formatselect | " +
          "bold italic | alignleft aligncenter " +
          "removeformat",
      }}
      onEditorChange={handleChange}
    />
  );
}
