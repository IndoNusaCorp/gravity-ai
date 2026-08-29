import { redirect } from "next/navigation";

// Halaman ini tidak menampilkan apa pun. Tugasnya hanya membuatkan ID acak
// lalu melempar user ke dokumen barunya: /create_document/untitled/<id>
//
// Harus dynamic, kalau tidak Next akan men-cache hasil render pertama
// dan semua user berakhir di dokumen dengan ID yang sama.
export const dynamic = "force-dynamic";

export default function CreateDocument() {
  const document_id = crypto.randomUUID().slice(0, 12);
  redirect(`/create_document/untitled/${document_id}`);
}
