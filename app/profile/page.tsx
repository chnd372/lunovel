import type { Metadata } from "next";
import ProfileClient from "./ProfileClient";

export const metadata: Metadata = {
  title: "Profil",
  description: "Riwayat bacaan, bookmark, dan preferensi bacaan lo. Disimpan lokal di browser.",
  alternates: { canonical: "/profile" },
  robots: { index: false, follow: true },
};

export default function ProfilePage() {
  return <ProfileClient />;
}
