"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import FontFamily from "@tiptap/extension-font-family";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { useEffect } from "react";

interface MenuEditorProps {
  initialContent?: any;
  onChange: (content: any) => void;
  readOnly?: boolean;
}

const MenuEditor = ({
  initialContent,
  onChange,
  readOnly = false,
}: MenuEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TextStyle,
      FontFamily,
      Color,
      // Custom extensions will be added here
    ],
    content:
      initialContent ||
      `
      <h2>Menú del Día</h2>
      <p>Edita este menú para empezar...</p>
    `,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editable: !readOnly,
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none focus:outline-none min-h-[500px] p-8",
        style:
          "background-image: url('/textures/chalkboard-dark.jpg'); color: white; background-size: cover;",
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden flex flex-col h-full bg-gray-900">
      {/* Editor Toolbar */}
      {!readOnly && (
        <div className="bg-gray-800 p-2 border-b border-gray-700 flex gap-2 flex-wrap items-center">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded hover:bg-gray-700 ${editor.isActive("bold") ? "bg-gray-700 text-white" : "text-gray-300"}`}
          >
            Bold
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded hover:bg-gray-700 ${editor.isActive("italic") ? "bg-gray-700 text-white" : "text-gray-300"}`}
          >
            Italic
          </button>
          <div className="w-px h-6 bg-gray-600 mx-1"></div>
          <button
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={`p-1.5 rounded hover:bg-gray-700 ${editor.isActive({ textAlign: "left" }) ? "bg-gray-700 text-white" : "text-gray-300"}`}
          >
            Left
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={`p-1.5 rounded hover:bg-gray-700 ${editor.isActive({ textAlign: "center" }) ? "bg-gray-700 text-white" : "text-gray-300"}`}
          >
            Center
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={`p-1.5 rounded hover:bg-gray-700 ${editor.isActive({ textAlign: "right" }) ? "bg-gray-700 text-white" : "text-gray-300"}`}
          >
            Right
          </button>
          <div className="w-px h-6 bg-gray-600 mx-1"></div>
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={`p-1.5 rounded hover:bg-gray-700 ${editor.isActive("heading", { level: 1 }) ? "bg-gray-700 text-white" : "text-gray-300"}`}
          >
            H1
          </button>
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={`p-1.5 rounded hover:bg-gray-700 ${editor.isActive("heading", { level: 2 }) ? "bg-gray-700 text-white" : "text-gray-300"}`}
          >
            H2
          </button>
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={`p-1.5 rounded hover:bg-gray-700 ${editor.isActive("heading", { level: 3 }) ? "bg-gray-700 text-white" : "text-gray-300"}`}
          >
            H3
          </button>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-900 relative">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
};

export default MenuEditor;
