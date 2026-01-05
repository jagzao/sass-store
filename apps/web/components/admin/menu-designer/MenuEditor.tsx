"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import "./MenuEditorStyles.css";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import FontFamily from "@tiptap/extension-font-family";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { HorizontalRule } from "@tiptap/extension-horizontal-rule";
import { useEffect } from "react";

interface MenuEditorProps {
  initialContent?: any;
  onChange: (content: any) => void;
  readOnly?: boolean;
  selectedProducts?: any[]; // Product defined in ProductPanel
  selectedServices?: any[]; // Service defined in ProductPanel
}

const MenuEditor = ({
  initialContent,
  onChange,
  readOnly = false,
  selectedProducts = [],
  selectedServices = [],
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
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      HorizontalRule,
    ],
    content: initialContent, // Use direct prop
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: "prose max-w-none focus:outline-none min-h-[500px] p-8",
        style:
          "background-color: white; color: #333; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);",
      },
    },
  });

  // Allow parent to update content (e.g. Generation from selections)
  useEffect(() => {
    if (editor && initialContent) {
      // Only set content if it's different to avoid cursor jumps/loops
      // For 'Generation' button, it's fine.
      // We use a simplified check or just force it since 'initialContent'
      // in parent 'setEditorContent' implies a full replace intention from the generator.

      // However, if 'onUpdate' also calls 'onChange', we have a loop if we are not careful.
      // The parent 'editorContent' state is updated by both 'onUpdate' (JSON) and 'Generate' (HTML).
      // If we pass JSON here it works. If we pass HTML string it works.
      const currentContent = editor.getHTML();
      if (
        typeof initialContent === "string" &&
        initialContent !== currentContent
      ) {
        editor.commands.setContent(initialContent);
      } else if (typeof initialContent === "object") {
        // Deep compare or just set?
        // safer to only set if drastically different or just trust the command
        // editor.commands.setContent(initialContent);
      }
    }
  }, [editor, initialContent]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden flex flex-col h-full bg-gray-100">
      {/* Editor Toolbar */}
      {!readOnly && (
        <div className="bg-white p-2 border-b border-gray-200 flex gap-2 flex-wrap items-center">
          {/* Text Formatting Group */}
          <div className="flex gap-1 items-center border-r border-gray-200 pr-2 mr-2">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive("bold") ? "bg-gray-200 text-gray-900" : "text-gray-700"}`}
              title="Negrita"
            >
              <span className="font-bold">B</span>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive("italic") ? "bg-gray-200 text-gray-900" : "text-gray-700"}`}
              title="Cursiva"
            >
              <span className="italic">I</span>
            </button>
            <button
              onClick={() => editor.chain().focus().setColor("#C5A059").run()}
              className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive("textStyle", { color: "#C5A059" }) ? "bg-gray-200 text-gray-900" : "text-gray-700"}`}
              title="Color Dorado"
              style={{ color: "#C5A059" }}
            >
              A
            </button>
          </div>

          {/* Structure Group */}
          <div className="flex gap-1 items-center border-r border-gray-200 pr-2 mr-2">
            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive("heading", { level: 1 }) ? "bg-gray-200 text-gray-900" : "text-gray-700"}`}
              title="Título 1"
            >
              H1
            </button>
            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive("heading", { level: 2 }) ? "bg-gray-200 text-gray-900" : "text-gray-700"}`}
              title="Título 2"
            >
              H2
            </button>
            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive("heading", { level: 3 }) ? "bg-gray-200 text-gray-900" : "text-gray-700"}`}
              title="Título 3"
            >
              H3
            </button>
          </div>

          {/* Insert Group */}
          <div className="flex gap-1 items-center border-r border-gray-200 pr-2 mr-2">
            <button
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .setImage({
                    src: "https://via.placeholder.com/300x200?text=Imagen",
                  })
                  .run()
              }
              className={`p-1.5 rounded hover:bg-gray-100 text-gray-700`}
              title="Insertar Imagen"
            >
              🖼️
            </button>
            <button
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              className={`p-1.5 rounded hover:bg-gray-100 text-gray-700`}
              title="Insertar Línea Divisoria"
            >
              ―
            </button>
            <button
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run()
              }
              className={`p-1.5 rounded hover:bg-gray-100 text-gray-700`}
              title="Insertar Tabla"
            >
              ⊞
            </button>
          </div>

          {/* Alignment Group */}
          <div className="flex gap-1 items-center">
            <button
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: "left" }) ? "bg-gray-200 text-gray-900" : "text-gray-700"}`}
              title="Alinear a la Izquierda"
            >
              ⬅️
            </button>
            <button
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
              className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: "center" }) ? "bg-gray-200 text-gray-900" : "text-gray-700"}`}
              title="Centrar"
            >
              ⬌
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: "right" }) ? "bg-gray-200 text-gray-900" : "text-gray-700"}`}
              title="Alinear a la Derecha"
            >
              ➡️
            </button>
          </div>
        </div>
      )}

      {/* Editor Content Area */}
      <div
        className="flex-1 overflow-y-auto bg-white relative"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          try {
            const data = JSON.parse(e.dataTransfer.getData("application/json"));
            if (data.type === "product" || data.type === "service") {
              // Insertar el producto/servicio como un nodo especial
              const productHtml = `
                <div class="product-node" data-id="${data.id}" data-type="${data.type}">
                  <div class="product-name">${data.name}</div>
                  <div class="product-price">$${data.price.toFixed(2)}</div>
                  ${data.description ? `<div class="product-description">${data.description}</div>` : ""}
                </div>
              `;

              editor.chain().focus().insertContent(productHtml).run();
            }
          } catch (error) {
            console.error("Error handling drop:", error);
          }
        }}
      >
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
};

export default MenuEditor;
