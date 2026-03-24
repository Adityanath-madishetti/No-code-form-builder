// src/components/RichTextEditor.tsx
/**
 * RichTextEditor
 * ------------------------------------------------------------------------------------------------
 * A lightweight, extensible rich text editor built on top of TipTap.
 *
 * Features:
 * - Inline formatting: bold, italic, underline, strike, highlight
 * - Headings (H1, H2)
 * - Lists: bullet and ordered
 * - Blockquote support
 * - Text alignment (left, center, right)
 * - Links with inline popover editor
 * - Subscript / superscript
 * - Floating bubble menu for contextual editing
 * - Sanitized HTML output using DOMPurify (prevents XSS)
 *
 * Behavior:
 * - Controlled component: `value` is the source of truth
 * - Emits sanitized HTML via `onChange`
 * - Automatically syncs external value updates into the editor
 *
 * Styling:
 * - Uses shared prose classes (`sharedProseClasses`) for consistent rendering
 * - Designed to integrate with shadcn/ui components
 *
 * ------------------------------------------------------------------------------------------------
 * Usage:
 *
 * import { useState } from 'react';
 * import { RichTextEditor } from '@/components/RichTextEditor';
 *
 * export default function Example() {
 *   const [content, setContent] = useState('<p>Hello world</p>');
 *
 *   return (
 *     <div className="max-w-xl">
 *       <RichTextEditor
 *         value={content}
 *         onChange={setContent}
 *         placeholder="Start typing..."
 *       />
 *
 *       <div className="mt-4">
 *         <h3 className="text-sm font-medium mb-2">Preview:</h3>
 *         <div
 *           className="border rounded-md p-3 text-sm"
 *           dangerouslySetInnerHTML={{ __html: content }}
 *         />
 *       </div>
 *     </div>
 *   );
 * }
 *
 * ------------------------------------------------------------------------------------------------
 * References:
 * - TipTap (core editor framework):
 *   https://tiptap.dev/
 *
 * - TipTap React integration (`@tiptap/react`):
 *   https://tiptap.dev/docs/editor/installation/react
 *
 * - TipTap StarterKit (basic nodes & marks):
 *   https://tiptap.dev/docs/editor/extensions/starter-kit
 *
 * - TipTap Extensions used:
 *   - Underline:
 *     https://tiptap.dev/docs/editor/extensions/marks/underline
 *   - TextAlign:
 *     https://tiptap.dev/docs/editor/extensions/functionality/textalign
 *   - Link:
 *     https://tiptap.dev/docs/editor/extensions/marks/link
 *   - Highlight:
 *     https://tiptap.dev/docs/editor/extensions/marks/highlight
 *   - Subscript:
 *     https://tiptap.dev/docs/editor/extensions/marks/subscript
 *   - Superscript:
 *     https://tiptap.dev/docs/editor/extensions/marks/superscript
 *   - BubbleMenu:
 *     https://tiptap.dev/docs/editor/extensions/functionality/bubble-menu
 *
 * - DOMPurify (HTML sanitization):
 *   https://github.com/cure53/DOMPurify
 *
 * - shadcn/ui (UI components used for toolbar, popovers, etc.):
 *   https://ui.shadcn.com/
 *
 * - lucide-react (icons):
 *   https://lucide.dev/
 *
 *
 * ------------------------------------------------------------------------------------------------
 * Notes:
 * - The output is HTML (not Markdown). Store as-is or post-process if needed.
 * - Sanitization is intentionally permissive for styling (`class`, `style`, `href`, etc.)
 *   — tighten DOMPurify config if stricter security is required.
 * - For advanced use cases, extend TipTap via additional extensions.
 *
 * ------------------------------------------------------------------------------------------------
 */
import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Bold,
  Italic,
  Strikethrough,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Highlighter,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
} from 'lucide-react';

// eslint-disable-next-line react-refresh/only-export-components
export const sharedProseClasses = [
  'whitespace-pre-wrap break-words',
  '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2',
  '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2',
  '[&_li]:my-1 [&_li>p]:inline-block [&_li>p]:m-0',
  '[&>p]:my-1',
  '[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-2',
  '[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2',
  '[&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4 [&_blockquote]:text-muted-foreground',
  '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_a]:cursor-pointer',
  '[&_mark]:bg-yellow-200 [&_mark]:text-black [&_mark]:px-1 [&_mark]:rounded-sm',
].join(' ');

type ToolbarButtonProps = {
  tooltip: string;
  isActive?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
};

const ToolbarButton = ({
  tooltip,
  isActive,
  onClick,
  children,
  className,
}: ToolbarButtonProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={tooltip}
          className={`h-6 w-6 rounded-md ${isActive ? 'bg-muted shadow-sm' : ''} ${className || ''}`}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8} className="px-2 py-1 text-xs [&_svg]:invisible">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
};

const LinkToolbarButton = ({
  editor,
  isOpen,
  setIsOpen,
}: {
  editor: Editor;
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}) => {
  const [url, setUrl] = useState('');

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setUrl(editor.getAttributes('link').href || '');
    }
    setIsOpen(open);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run();
    }
    setIsOpen(false);
  };

  const handleRemove = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-6 w-6 rounded-md ${editor.isActive('link') ? 'bg-muted shadow-sm' : ''}`}
              >
                <LinkIcon className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8} className="px-2 py-1 text-xs [&_svg]:invisible">
          Link
        </TooltipContent>
      </Tooltip>

      <PopoverContent
        className="flex w-72 flex-col gap-2 p-2 shadow-xl"
        side="bottom"
        align="center"
        sideOffset={10}
      >
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="h-8 flex-1 text-xs"
            autoFocus
          />
          <Button type="submit" size="sm" className="h-8 px-3 text-xs">
            Save
          </Button>
        </form>
        {editor.isActive('link') && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleRemove}
          >
            Remove Link
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
};

const EditorBubbleMenu = ({ editor }: { editor: Editor }) => {
  const [isLinkMenuOpen, setIsLinkMenuOpen] = useState(false);

  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor }) => editor.isFocused || isLinkMenuOpen}
      options={{
        strategy: 'fixed',
        placement: 'bottom',
        offset: 12,
      }}
      className="flex w-max max-w-[90vw] flex-wrap items-center justify-center gap-0.5 rounded-lg border border-border bg-background/95 p-1 shadow-md backdrop-blur-md"
    >
      <TooltipProvider delayDuration={300}>
        {/* Headings */}
        <ToolbarButton
          tooltip="Heading 1"
          isActive={editor.isActive('heading', { level: 1 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1 className="h-3 w-3" />
        </ToolbarButton>
        <ToolbarButton
          tooltip="Heading 2"
          isActive={editor.isActive('heading', { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="h-3 w-3" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-4" />

        {/* Formatting */}
        <ToolbarButton
          tooltip="Bold"
          isActive={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-3 w-3" />
        </ToolbarButton>
        <ToolbarButton
          tooltip="Italic"
          isActive={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-3 w-3" />
        </ToolbarButton>
        <ToolbarButton
          tooltip="Underline"
          isActive={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-3 w-3" />
        </ToolbarButton>
        <ToolbarButton
          tooltip="Strikethrough"
          isActive={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className="hidden sm:inline-flex"
        >
          <Strikethrough className="h-3 w-3" />
        </ToolbarButton>
        <ToolbarButton
          tooltip="Highlight"
          isActive={editor.isActive('highlight')}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
        >
          <Highlighter className="h-3 w-3" />
        </ToolbarButton>

        <LinkToolbarButton
          editor={editor}
          isOpen={isLinkMenuOpen}
          setIsOpen={setIsLinkMenuOpen}
        />

        <Separator
          orientation="vertical"
          className="mx-1 hidden h-4 lg:block"
        />

        {/* Sub/Superscript */}
        <ToolbarButton
          tooltip="Subscript"
          isActive={editor.isActive('subscript')}
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          className="hidden sm:inline-flex"
        >
          <SubscriptIcon className="h-3 w-3" />
        </ToolbarButton>
        <ToolbarButton
          tooltip="Superscript"
          isActive={editor.isActive('superscript')}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          className="hidden sm:inline-flex"
        >
          <SuperscriptIcon className="h-3 w-3" />
        </ToolbarButton>

        <Separator
          orientation="vertical"
          className="mx-1 hidden h-4 sm:block"
        />

        {/* Alignment */}
        <ToolbarButton
          tooltip="Align Left"
          isActive={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <AlignLeft className="h-3 w-3" />
        </ToolbarButton>
        <ToolbarButton
          tooltip="Align Center"
          isActive={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <AlignCenter className="h-3 w-3" />
        </ToolbarButton>
        <ToolbarButton
          tooltip="Align Right"
          isActive={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          <AlignRight className="h-3 w-3" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-4" />

        {/* Blocks */}
        <ToolbarButton
          tooltip="Quote"
          isActive={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className="hidden sm:inline-flex"
        >
          <Quote className="h-3 w-3" />
        </ToolbarButton>
        <ToolbarButton
          tooltip="Bullet List"
          isActive={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-3 w-3" />
        </ToolbarButton>
        <ToolbarButton
          tooltip="Numbered List"
          isActive={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-3 w-3" />
        </ToolbarButton>
      </TooltipProvider>
    </BubbleMenu>
  );
};

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export const RichTextEditor = ({
  value,
  onChange,
  className = '',
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
      }),
      Highlight,
      Subscript,
      Superscript,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const cleanHTML = DOMPurify.sanitize(editor.getHTML(), {
        ALLOWED_ATTR: ['class', 'style', 'href', 'target', 'rel'],
      });
      onChange(cleanHTML);
    },
    editorProps: {
      attributes: {
        class: `
        w-full rounded-md border border-input bg-background 
        px-4 py-3 text-sm placeholder:text-muted-foreground 
        focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 
        min-h-[100px] cursor-text
        ${sharedProseClasses}
        `
          .replace(/\s+/g, ' ')
          .trim(),
      },
    },
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed || editor.isFocused) return;
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className={`group relative ${className}`}>
      <EditorBubbleMenu editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};
