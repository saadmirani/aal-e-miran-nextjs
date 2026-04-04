'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect } from 'react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import './TipTapEditor.css';

export default function TipTapEditor({ value, onChange, placeholder, isRTL = false }) {
   const editor = useEditor({
      extensions: [
         StarterKit.configure({
            paragraph: {
               HTMLAttributes: {
                  class: 'editor-paragraph',
               },
            },
            heading: {
               levels: [3, 4],
               HTMLAttributes: {
                  class: 'editor-heading',
               },
            },
            bulletList: {
               HTMLAttributes: {
                  class: 'editor-list',
               },
            },
            orderedList: {
               HTMLAttributes: {
                  class: 'editor-list',
               },
            },
            codeBlock: false, // Disable code blocks
         }),
         TextAlign.configure({
            types: ['heading', 'paragraph'],
         }),
      ],
      content: value || '',
      onUpdate: ({ editor }) => {
         onChange(editor.getHTML());
      },
      editorProps: {
         attributes: {
            class: `editor-content ${isRTL ? 'editor-rtl' : ''}`,
            dir: isRTL ? 'rtl' : 'ltr',
         },
      },
      immediatelyRender: false,
   });

   // Sync editor content when value prop changes (language switch, etc.)
   useEffect(() => {
      if (editor) {
         const currentContent = editor.getHTML();
         if (currentContent !== value && value !== undefined) {
            editor.commands.setContent(value || '');
         }
      }
   }, [value, editor]);

   // Sync RTL direction when isRTL changes
   useEffect(() => {
      if (editor) {
         editor.setOptions({
            editorProps: {
               attributes: {
                  class: `editor-content ${isRTL ? 'editor-rtl' : ''}`,
                  dir: isRTL ? 'rtl' : 'ltr',
               },
            },
         });
      }
   }, [isRTL, editor]);

   if (!editor) {
      return null;
   }

   return (
      <div className="tiptap-editor-wrapper">
         {/* Toolbar */}
         <div className="editor-toolbar">
            <div className="toolbar-group">
               <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  disabled={!editor.can().chain().focus().toggleBold().run()}
                  className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`}
                  title="Bold (Ctrl+B)"
               >
                  <strong>B</strong>
               </button>
               <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  disabled={!editor.can().chain().focus().toggleItalic().run()}
                  className={`toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`}
                  title="Italic (Ctrl+I)"
               >
                  <em>I</em>
               </button>
               <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  disabled={!editor.can().chain().focus().toggleUnderline().run()}
                  className={`toolbar-btn ${editor.isActive('underline') ? 'active' : ''}`}
                  title="Underline (Ctrl+U)"
               >
                  <u>U</u>
               </button>
               <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  disabled={!editor.can().chain().focus().toggleStrike().run()}
                  className={`toolbar-btn ${editor.isActive('strike') ? 'active' : ''}`}
                  title="Strikethrough"
               >
                  <s>S</s>
               </button>
            </div>

            <div className="toolbar-separator"></div>

            <div className="toolbar-group">
               <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
                  title="Bullet List"
               >
                  • List
               </button>
               <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={`toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
                  title="Ordered List"
               >
                  1. List
               </button>
            </div>

            <div className="toolbar-separator"></div>

            <div className="toolbar-group">
               <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`}
                  title="Heading 3"
               >
                  H3
               </button>
               <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
                  className={`toolbar-btn ${editor.isActive('heading', { level: 4 }) ? 'active' : ''}`}
                  title="Heading 4"
               >
                  H4
               </button>
            </div>

            <div className="toolbar-separator"></div>

            <div className="toolbar-group">
               <button
                  type="button"
                  onClick={() => editor.chain().focus().clearNodes().run()}
                  className="toolbar-btn toolbar-btn-danger"
                  title="Clear Formatting"
               >
                  Clear
               </button>
            </div>
         </div>

         {/* Editor */}
         <EditorContent editor={editor} className="editor-wrapper" />

         {/* Info */}
         <div className="editor-info">
            {isRTL ? '✍️ اردو میں لکھیں (Urdu)' : '✍️ Write in English'}
         </div>
      </div>
   );
}
