import re

with open("app/novel/[slug]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the specific header part.
# We'll use a precise replacement.

old_str = """  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="grid sm:grid-cols-[200px_1fr] gap-6 mb-6">
        <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
          {novel.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={novel.cover}
              alt={novel.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-7xl opacity-30">📖</div>
          )}
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white ${statusColor[novel.status]}`}>
              {statusLabel[novel.status]}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-black/5 dark:bg-white/10">
              {novel.type === "translated" ? "Terjemahan" : (novel.type ?? "Original")}
            </span>
            {novel.original_language && novel.original_language !== "id" && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-black/5 dark:bg-white/10">
                dari {novel.original_language}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold leading-tight">
            {novel.title}
          </h1>
          {novel.alt_titles && novel.alt_titles.length > 0 && (
            <p className="text-sm opacity-60">
              Alt: {novel.alt_titles.join(" · ")}
            </p>
          )}
          {novel.author && (
            <p className="text-sm">
              <span className="opacity-60">oleh </span>
              <span className="font-medium">{novel.author}</span>
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {novel.genres.map((g) => (
              <Link
                key={g}
                href={`/search?genre=${encodeURIComponent(g)}`}
                className="text-xs px-2 py-1 rounded-md bg-black/5 dark:bg-white/10 hover:bg-accent hover:text-white transition"
              >
                {g}
              </Link>
            ))}
          </div>
          <p className="text-sm opacity-90 leading-relaxed whitespace-pre-line">
            {novel.description}
          </p>
          <div className="flex items-center gap-3 text-xs opacity-70">
            <span>📚 {chapters.length} chapter</span>
            <span>✍️ {totalWords.toLocaleString("id-ID")} kata</span>
            {novel.rating && <span>⭐ {novel.rating.toFixed(1)}</span>}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {firstChapter && (
              <Link
                href={`/read/${novel.slug}/${firstChapter.number}`}
                className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90"
              >
                📖 Mulai dari Ch 1
              </Link>
            )}
            {lastChapter && (
              <Link
                href={`/read/${novel.slug}/${lastChapter.number}`}
                className="px-4 py-2 rounded-lg bg-black/5 dark:bg-white/10 text-sm font-medium hover:bg-black/10 dark:hover:bg-white/20"
              >
                ⏭ Chapter Terakhir
              </Link>
            )}
            <ResumeReadingButton novelId={novel.id} slug={novel.slug} />
            <BookmarkButton novel={novel} />
            <Link
              href={`/novel/${novel.slug}/perbaikan`}
              className="px-3 py-2 rounded-lg bg-black/5 dark:bg-white/10 text-sm font-medium hover:bg-black/10 dark:hover:bg-white/20 inline-flex items-center gap-1.5"
              title="Kelola perbaikan kata pribadi (tersimpan lokal)"
            >
              ✏️ Perbaikan Kata
            </Link>
            <Link
              href={`/novel/${novel.slug}/search`}
              className="px-3 py-2 rounded-lg bg-black/5 dark:bg-white/10 text-sm font-medium hover:bg-black/10 dark:hover:bg-white/20 inline-flex items-center gap-1.5"
              title="Cari kata kunci, nama tokoh, atau dialog di seluruh isi novel"
            >
              🔍 Cari Isi
            </Link>
          </div>
        </div>
      </div>

      {/* Chapter list */}
      <section>"""

new_str = """  return (
    <div className="w-full">
      {/* Immersive Header */}
      <div className="relative w-full overflow-hidden bg-black/90 pb-8 pt-10 sm:pt-16 sm:pb-12 border-b border-white/10">
        {/* Background Blur */}
        {novel.cover && (
          <div className="absolute inset-0 z-0">
             {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={novel.cover} alt="" className="w-full h-full object-cover opacity-20 blur-3xl scale-125" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-light dark:from-bg-dark to-transparent opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent" />
          </div>
        )}
        
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <div className="flex flex-col sm:flex-row gap-6 md:gap-10 items-start">
            {/* 3D Cover */}
            <div className="shrink-0 group perspective-[1000px] w-48 sm:w-56 mx-auto sm:mx-0">
              <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 transform rotate-y-[-5deg] group-hover:rotate-y-0 transition-transform duration-500 ease-out bg-black/20 flex items-center justify-center relative">
                {novel.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={novel.cover} alt={novel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="text-7xl opacity-30">📖</div>
                )}
                {/* Glossy overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4 text-center sm:text-left text-white/90 drop-shadow-sm pt-2">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ${statusColor[novel.status]}`}>
                  {statusLabel[novel.status]}
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white backdrop-blur-md border border-white/10">
                  {novel.type === "translated" ? "Terjemahan" : (novel.type ?? "Original")}
                </span>
                {novel.original_language && novel.original_language !== "id" && (
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white backdrop-blur-md border border-white/10">
                    dari {novel.original_language}
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-extrabold leading-tight text-white drop-shadow-md">
                {novel.title}
              </h1>
              
              {novel.alt_titles && novel.alt_titles.length > 0 && (
                <p className="text-sm opacity-60 font-medium">
                  Alt: {novel.alt_titles.join(" · ")}
                </p>
              )}
              
              {novel.author && (
                <p className="text-sm sm:text-base font-medium">
                  <span className="opacity-60">oleh </span>
                  <span className="text-white">{novel.author}</span>
                </p>
              )}
              
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
                {novel.genres.map((g) => (
                  <Link
                    key={g}
                    href={`/search?genre=${encodeURIComponent(g)}`}
                    className="text-xs px-3 py-1 rounded-full bg-white/10 hover:bg-accent text-white backdrop-blur-sm border border-white/10 transition-colors"
                  >
                    {g}
                  </Link>
                ))}
              </div>
              
              <div className="flex items-center justify-center sm:justify-start gap-4 text-sm font-semibold opacity-80 pt-2">
                <span className="flex items-center gap-1.5"><span className="text-accent text-lg">📚</span> {chapters.length} CH</span>
                <span className="flex items-center gap-1.5"><span className="text-accent text-lg">✍️</span> {totalWords.toLocaleString("id-ID")} Kata</span>
                {novel.rating && <span className="flex items-center gap-1.5"><span className="text-yellow-400 text-lg">⭐</span> {novel.rating.toFixed(1)}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Actions & Synopsis Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Main Actions */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex flex-col gap-2">
              {firstChapter && (
                <Link
                  href={`/read/${novel.slug}/${firstChapter.number}`}
                  className="w-full text-center px-6 py-3.5 rounded-xl bg-accent text-white text-sm font-bold shadow-glow hover:-translate-y-0.5 transition-all"
                >
                  📖 Mulai dari Ch 1
                </Link>
              )}
              {lastChapter && (
                <Link
                  href={`/read/${novel.slug}/${lastChapter.number}`}
                  className="w-full text-center px-6 py-3.5 rounded-xl bg-black/5 dark:bg-white/10 text-sm font-bold border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-all"
                >
                  ⏭ Chapter Terakhir
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <ResumeReadingButton novelId={novel.id} slug={novel.slug} />
              <BookmarkButton novel={novel} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/novel/${novel.slug}/perbaikan`}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-black/5 dark:bg-white/5 text-xs font-semibold hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 transition-colors"
                title="Kelola perbaikan kata pribadi (tersimpan lokal)"
              >
                <span>✏️</span> Fix Kata
              </Link>
              <Link
                href={`/novel/${novel.slug}/search`}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-black/5 dark:bg-white/5 text-xs font-semibold hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 transition-colors"
                title="Cari kata kunci, nama tokoh, atau dialog di seluruh isi novel"
              >
                <span>🔍</span> Cari Isi
              </Link>
            </div>
          </div>
          
          {/* Synopsis */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-heading font-bold mb-3 flex items-center gap-2">
              <span className="text-accent">|</span> Sinopsis
            </h2>
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-black/80 dark:text-white/80 leading-loose">
              <p className="whitespace-pre-line">{novel.description}</p>
            </div>
          </div>
        </div>

        {/* Chapter list */}
        <section className="mt-12">"""

if old_str in content:
    with open("app/novel/[slug]/page.tsx", "w", encoding="utf-8") as f:
        f.write(content.replace(old_str, new_str))
    print("PATCHED DETAIL PAGE")
else:
    print("NOT FOUND")
