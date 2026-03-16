// import React, { useState } from "react";
// import { useFormBuilderStore } from "../../store/form-builder.store";
// import { cn } from "../../lib/utils";
// import { Eye, Download, Layers, Moon, Sun } from "lucide-react";
// import { SchemaPreviewModal } from "./SchemaPreviewModal";

// function useDarkMode() {
//   const [dark, setDark] = useState(() =>
//     document.documentElement.classList.contains("dark")
//   );
//   const toggle = () => {
//     document.documentElement.classList.toggle("dark");
//     setDark((d) => !d);
//   };
//   return { dark, toggle };
// }

// export function Topbar() {
//   const { schema, updateFormTitle } = useFormBuilderStore();
//   const [editing, setEditing] = useState(false);
//   const [draft, setDraft] = useState(schema.title);
//   const [schemaOpen, setSchemaOpen] = useState(false);
//   const { dark, toggle } = useDarkMode();

//   const commit = () => {
//     const t = draft.trim();
//     if (t) updateFormTitle(t);
//     else setDraft(schema.title);
//     setEditing(false);
//   };

//   return (
//     <>
//       <header className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-background shrink-0">
//         {/* Left: Brand + title */}
//         <div className="flex items-center gap-3">
//           <div className="flex items-center gap-2">
//             <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
//               <Layers size={14} className="text-primary-foreground" />
//             </div>
//             <span className="text-sm font-bold text-foreground tracking-tight font-mono">FormCraft</span>
//           </div>

//           <div className="w-px h-5 bg-border" />

//           {editing ? (
//             <input
//               autoFocus
//               value={draft}
//               onChange={(e) => setDraft(e.target.value)}
//               onBlur={commit}
//               onKeyDown={(e) => {
//                 if (e.key === "Enter") commit();
//                 if (e.key === "Escape") { setDraft(schema.title); setEditing(false); }
//               }}
//               className="text-sm font-semibold bg-transparent border-b border-primary outline-none text-foreground w-52"
//             />
//           ) : (
//             <button
//               onClick={() => { setDraft(schema.title); setEditing(true); }}
//               className="text-sm font-semibold text-foreground hover:text-primary transition-colors group flex items-center gap-1.5"
//             >
//               {schema.title}
//               <span className="text-[10px] text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity">
//                 click to rename
//               </span>
//             </button>
//           )}
//         </div>

//         {/* Right: Actions */}
//         <div className="flex items-center gap-2">
//           {/* Dark mode toggle */}
//           <button
//             onClick={toggle}
//             className={cn(
//               "p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
//             )}
//             title={dark ? "Switch to light mode" : "Switch to dark mode"}
//           >
//             {dark ? <Sun size={14} /> : <Moon size={14} />}
//           </button>

//           <button
//             onClick={() => setSchemaOpen(true)}
//             className={cn(
//               "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold",
//               "bg-primary text-primary-foreground hover:bg-primary/90",
//               "transition-all duration-100 shadow-sm"
//             )}
//           >
//             <Download size={12} />
//             Export Schema
//           </button>
//         </div>
//       </header>

//       <SchemaPreviewModal open={schemaOpen} onClose={() => setSchemaOpen(false)} />
//     </>
//   );
// }