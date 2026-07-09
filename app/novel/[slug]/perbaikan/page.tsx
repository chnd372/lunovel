import { notFound } from "next/navigation";
import { getNovelBySlug } from "@/lib/data";
import PerbaikanKataManager from "@/components/PerbaikanKataManager";

export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string };
}

export default async function PerbaikanKataPage({ params }: Props) {
  const novel = await getNovelBySlug(params.slug);
  if (!novel) notFound();

  return (
    <div className="min-h-screen bg-[#fafaf8] dark:bg-[#0d0d0d]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back nav */}
        <div className="mb-6">
          <a
            href={`/novel/${novel.slug}`}
            className="inline-flex items-center gap-2 text-sm opacity-70 hover:opacity-100"
          >
            ← Kembali ke {novel.title}
          </a>
        </div>

        {/* Header */}
        <header className="mb-6 pb-5 border-b border-black/10 dark:border-white/10">
          <div className="flex items-start gap-3 mb-2">
            <span className="text-3xl">✏️</span>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold">Daftar Perbaikan Kata</h1>
              <p className="text-sm opacity-70 mt-1">
                <strong>{novel.title}</strong>
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-blue-500/5 border border-blue-500/20 p-3 text-xs leading-relaxed">
            <div className="font-semibold mb-1">📖 Cara kerja:</div>
            <ul className="list-disc list-inside space-y-0.5 opacity-80">
              <li>Setiap perbaikan disimpan <strong>lokal di browser kamu</strong> (localStorage)</li>
              <li>Berlaku untuk <strong>semua chapter</strong> dari novel ini</li>
              <li>Untuk menambah dari bacaan: blok kata → klik <span className="font-mono">✏️ Perbaiki Kata</span></li>
              <li>Menghapus = langsung hilang dari semua chapter</li>
            </ul>
          </div>
        </header>

        <PerbaikanKataManager novel={novel} />
      </div>
    </div>
  );
}