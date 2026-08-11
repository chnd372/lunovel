import type { Metadata } from "next";
import { getNovelBySlug } from "@/lib/data";
import NovelSearchClient from "./NovelSearchClient";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const novel = await getNovelBySlug(params.slug);
  return {
    title: `Cari Isi: ${novel?.title || "Novel"}`,
    description: `Cari teks, nama karakter, atau dialog di seluruh chapter novel ${novel?.title || ""}.`,
  };
}

export default async function NovelSearchPage({ params }: Props) {
  const novel = await getNovelBySlug(params.slug);
  if (!novel) return <div>Novel tidak ditemukan.</div>;

  return <NovelSearchClient novel={novel} />;
}
