"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { useEffect, useState } from "react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
  Table as TableIcon,
  ImageIcon,
  Minus,
  Undo2,
  Redo2,
  Rows3,
  Columns3,
  Trash2,
} from "lucide-react";
import type { ReactNode } from "react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  danger,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`rounded-md p-1.5 transition disabled:opacity-30 ${
        active
          ? "bg-neutral-900 text-white hover:bg-neutral-900"
          : danger
          ? "text-red-500 hover:bg-red-50"
          : "text-neutral-500 hover:bg-neutral-100"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-neutral-200" />;
}

function Toolbar({ editor }: { editor: Editor }) {
  function addImage() {
    const url = window.prompt("Image URL");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }

  function addTable() {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }

  const insideTable = editor.isActive("table");

  return (
    <div className="border-b border-neutral-100">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5">
        <ToolbarButton label="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")}>
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          label="Heading 1"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive("heading", { level: 1 })}
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton label="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Checklist" onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")}>
          <CheckSquare className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton label="Code block" onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")}>
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Callout / quote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}>
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Insert table" onClick={addTable} active={insideTable}>
          <TableIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Insert image" onClick={addImage}>
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton label="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {insideTable && (
        <div className="flex flex-wrap items-center gap-0.5 border-t border-neutral-100 bg-neutral-50 px-2 py-1.5">
          <span className="mr-1 text-xs font-medium text-neutral-400">Table</span>

          <ToolbarButton label="Add row below" onClick={() => editor.chain().focus().addRowAfter().run()}>
            <Rows3 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Add column right" onClick={() => editor.chain().focus().addColumnAfter().run()}>
            <Columns3 className="h-4 w-4" />
          </ToolbarButton>

          <Divider />

          <ToolbarButton label="Delete row" danger onClick={() => editor.chain().focus().deleteRow().run()}>
            <Rows3 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Delete column" danger onClick={() => editor.chain().focus().deleteColumn().run()}>
            <Columns3 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Delete table" danger onClick={() => editor.chain().focus().deleteTable().run()}>
            <Trash2 className="h-4 w-4" />
          </ToolbarButton>
        </div>
      )}
    </div>
  );
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  // Forces the toolbar to re-render on cursor/selection moves so active-state
  // highlighting (bold/heading/table, etc.) always reflects the real cursor position.
  const [, forceRerender] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Image,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Start writing..." }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[240px] px-4 py-3 text-sm text-neutral-700 outline-none " +
          "[&_h1]:text-xl [&_h1]:font-serif [&_h1]:font-semibold [&_h1]:mt-3 [&_h1]:mb-1 " +
          "[&_h2]:text-lg [&_h2]:font-serif [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1 " +
          "[&_h3]:text-base [&_h3]:font-serif [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 " +
          "[&_strong]:font-semibold [&_strong]:text-neutral-900 [&_em]:italic [&_s]:line-through " +
          "[&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1.5 " +
          "[&_blockquote]:border-l-2 [&_blockquote]:border-neutral-300 [&_blockquote]:pl-3 [&_blockquote]:py-0.5 [&_blockquote]:text-neutral-500 [&_blockquote]:italic [&_blockquote]:my-2 " +
          "[&_pre]:bg-neutral-900 [&_pre]:text-neutral-100 [&_pre]:rounded-md [&_pre]:p-3 [&_pre]:text-xs [&_pre]:overflow-x-auto [&_pre]:my-2 " +
          "[&_code]:text-xs [&_table]:border-collapse [&_table]:w-full [&_table]:my-2 [&_table]:table-fixed " +
          "[&_td]:border [&_td]:border-neutral-200 [&_td]:p-2 [&_td]:align-top [&_th]:border [&_th]:border-neutral-200 [&_th]:bg-neutral-50 [&_th]:p-2 [&_th]:text-left [&_th]:font-semibold " +
          "[&_.selectedCell]:bg-neutral-100 " +
          "[&_img]:rounded-md [&_img]:max-w-full [&_img]:my-2 [&_hr]:my-4 [&_hr]:border-neutral-200 " +
          "[&_ul[data-type='taskList']]:list-none [&_ul[data-type='taskList']]:pl-0 " +
          "[&_ul[data-type='taskList']_li]:flex [&_ul[data-type='taskList']_li]:items-start [&_ul[data-type='taskList']_li]:gap-2",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onSelectionUpdate: () => {
      forceRerender((n) => n + 1);
    },
    onTransaction: () => {
      forceRerender((n) => n + 1);
    },
  });

  // Keep the editor in sync when `content` changes from outside (e.g. the AI
  // panel inserting a result), without disrupting the user's own typing/undo history.
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}