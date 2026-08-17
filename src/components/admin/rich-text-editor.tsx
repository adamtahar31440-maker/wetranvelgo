"use client";

import { useRef, useState, type ReactNode } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import { Bold, Italic, Heading2, List, ListOrdered, ImagePlus, Loader2 } from "lucide-react";
import { isUnsupportedImageFile, uploadImageFile } from "@/lib/image-upload";

export function RichTextEditor({
  name,
  label,
  defaultValue = "",
  unsupportedFormatText,
}: {
  name: string;
  label?: string;
  defaultValue?: string;
  unsupportedFormatText?: string;
}) {
  const [html, setHtml] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2] },
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
      }),
      TiptapImage,
    ],
    content: defaultValue,
    immediatelyRender: false,
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-40 px-3 py-2 focus:outline-none",
      },
    },
  });

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;
    setUploadError(false);

    if (isUnsupportedImageFile(file)) {
      setUploadError(true);
      return;
    }

    setUploading(true);
    try {
      const url = await uploadImageFile(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch {
      setUploadError(true);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {label && <label className="mb-1 block text-xs font-semibold text-foreground/60">{label}</label>}
      <div className="overflow-hidden rounded-lg border border-black/10 focus-within:border-ocean-dark">
        <div className="flex flex-wrap items-center gap-1 border-b border-black/10 bg-sand/30 px-2 py-1.5">
          <ToolbarButton
            active={editor?.isActive("bold")}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            label="Gras"
          >
            <Bold size={15} />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("italic")}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            label="Italique"
          >
            <Italic size={15} />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("heading", { level: 2 })}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            label="Sous-titre"
          >
            <Heading2 size={15} />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("bulletList")}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            label="Liste à puces"
          >
            <List size={15} />
          </ToolbarButton>
          <ToolbarButton
            active={editor?.isActive("orderedList")}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            label="Liste numérotée"
          >
            <ListOrdered size={15} />
          </ToolbarButton>
          <div className="mx-1 h-4 w-px bg-black/10" />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-foreground/70 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
            Photo
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
        </div>
        <EditorContent editor={editor} />
      </div>
      {uploadError && (
        <p className="mt-1 text-xs font-medium text-terracotta">
          {unsupportedFormatText ?? "Format non supporté ou échec de l'envoi de la photo."}
        </p>
      )}
      <input type="hidden" name={name} value={html} readOnly />
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={label}
      aria-pressed={active}
      className={"rounded px-2 py-1 " + (active ? "bg-ocean-dark text-white" : "text-foreground/70 hover:bg-black/5")}
    >
      {children}
    </button>
  );
}
