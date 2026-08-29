import type { Metadata } from "next";

// Judul tab mengikuti nama dokumen yang ada di URL.
// Ditaruh di layout karena page.tsx berupa client component,
// sementara generateMetadata hanya boleh di server component.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ name_document: string }>;
}): Promise<Metadata> {
  const { name_document } = await params;

  // nama dokumen ikut di URL, jadi harus di-decode (spasi jadi %20 dst)
  const nama = decodeURIComponent(name_document || "");
  const judul = nama && nama !== "untitled" ? nama : "Tanpa judul";

  return {
    title: `Gravity AI - ${judul}`,
    description:
      "Gravity AI untuk membantu pembuatan research, skripsi, dan artikel ilmiah.",
  };
}

// Layout ini hanya meneruskan halaman. <html> dan <body> sudah dirender
// root layout — kalau ditulis ulang di sini, DOM-nya jadi bersarang.
export default function DocumentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
