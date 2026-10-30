import React, { useEffect, useMemo, useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";

export default function TextEditor({
  onChange,
  name,
  initialValue,
  value,
  height = 400,
}) {
  const editorRef = useRef(null);
  const initialRef = useRef(value ?? initialValue ?? "");

  // Run as uncontrolled to keep the caret stable; only push external changes
  // (e.g. form reset / async load) when the editor isn't being typed in.
  useEffect(() => {
    const editor = editorRef.current;
    const next = value !== undefined ? value : initialValue;
    if (!editor || next === undefined || editor.hasFocus()) return;
    if (editor.getContent() !== (next || "")) editor.setContent(next || "");
  }, [value, initialValue]);

  const init = useMemo(
    () => ({
        height,
        menubar: false,
        plugins: [
          "advlist",
          "autolink",
          "lists",
          "link",
          "image",
          "charmap",
          "print",
          "preview",
          "anchor",
          "searchreplace",
          "visualblocks",
          "fullscreen",
          "insertdatetime",
          "media",
          "table",
          "paste",
          "wordcount",
        ],
        toolbar:
          "undo redo | formatselect | " +
          "bold italic | alignleft aligncenter " +
          "removeformat",
    }),
    [height]
  );

  return (
    <Editor
      apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
      onInit={(_, editor) => {
        editorRef.current = editor;
      }}
      initialValue={initialRef.current}
      name={name}
      init={init}
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
