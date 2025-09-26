import React, { useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";

export default function TextEditor({ onChange, payload, name, initialValue }) {
  const editorRef = useRef(null);

  return (
    <Editor
      apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
      onInit={(_, editor) => (editorRef.current = editor)}
      initialValue={initialValue || ""}
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
      // ✅ Wrap the content into an object that matches handleChange
      onEditorChange={(content) =>
        onChange({
          target: {
            name, // same name prop you passed
            value: content, // TinyMCE editor content
          },
        })
      }
    />
  );
}
