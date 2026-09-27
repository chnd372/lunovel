import re

with open("components/TextSelectionHandler.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the render block
old_render = """  if (!selection) return null;

  // Calculate position: above the selection
  const top = Math.max(10, selection.rect.top - (isEditing ? 60 : 50));
  const left = Math.max(10, Math.min(window.innerWidth - 220, selection.rect.left + (selection.rect.width / 2) - 100));

  return (
    <div
      className="fixed z-[100] animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{ top, left }}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {!isEditing ? (
        <button
          onClick={() => {
            setIsEditing(true);
            setReplacement(selection.text);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-black/90 dark:bg-white/90 text-white dark:text-black rounded-full shadow-2xl backdrop-blur-md border border-white/10 dark:border-black/10 hover:scale-105 active:scale-95 transition-transform"
        >
          <span className="text-sm font-bold">✏️ Edit</span>
          <span className="text-xs opacity-70 max-w-[100px] truncate">"{selection.text}"</span>
        </button>
      ) : (
        <div className="flex items-center gap-1.5 p-1.5 bg-black/90 dark:bg-white/90 rounded-2xl shadow-2xl backdrop-blur-md border border-white/10 dark:border-black/10 w-[240px]">
          <input
            ref={inputRef}
            type="text"
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ganti menjadi..."
            className="flex-1 bg-transparent text-white dark:text-black text-sm px-3 py-2 outline-none font-medium placeholder-white/30 dark:placeholder-black/30"
          />
          <button
            onClick={handleSave}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-accent text-white hover:bg-accent/90 transition-colors"
          >
            ✓
          </button>
        </div>
      )}
    </div>
  );"""

new_render = """  if (!selection) return null;

  return (
    <div
      className="fixed z-[100] bottom-28 left-0 right-0 px-4 pointer-events-none flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div 
        className="pointer-events-auto"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {!isEditing ? (
          <button
            onClick={() => {
              setIsEditing(true);
              setReplacement(selection.text);
            }}
            className="flex items-center gap-2 px-5 py-3 bg-neutral-900 dark:bg-white/95 text-white dark:text-black rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-md border border-white/10 dark:border-black/10 hover:scale-105 active:scale-95 transition-transform mx-auto"
          >
            <span className="text-sm font-bold">✏️ Edit</span>
            <span className="text-xs opacity-70 max-w-[120px] truncate">"{selection.text}"</span>
          </button>
        ) : (
          <div className="flex flex-col gap-2 p-3 bg-neutral-900/95 dark:bg-neutral-100/95 rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl border border-white/10 dark:border-black/10 w-[90vw] max-w-[400px] mx-auto">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 text-white dark:text-black">Koreksi Cepat</span>
              <button onClick={() => { setIsEditing(false); setSelection(null); }} className="text-white dark:text-black opacity-60 hover:opacity-100 px-2">✕</button>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ganti "${selection.text}"...`}
                className="flex-1 bg-black/20 dark:bg-white/50 text-white dark:text-black text-sm px-4 py-2.5 rounded-xl outline-none font-medium placeholder-white/40 dark:placeholder-black/40 focus:ring-2 focus:ring-accent"
              />
              <button
                onClick={handleSave}
                className="shrink-0 w-11 h-11 flex items-center justify-center rounded-xl bg-accent text-white font-bold text-lg hover:bg-accent/90 active:scale-95 transition-all shadow-glow"
              >
                ✓
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );"""

content = content.replace(old_render, new_render)

with open("components/TextSelectionHandler.tsx", "w", encoding="utf-8") as f:
    f.write(content)
