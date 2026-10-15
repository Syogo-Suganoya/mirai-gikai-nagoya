import { listAdmins } from "@/lib/admins/repository";
import { requireAdminPage } from "@/lib/auth/admin";
import AdminList from "./admin-list";

export default async function AdminsPage() {
  const me = await requireAdminPage();
  const admins = await listAdmins();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-bold">管理者</h1>
      <p className="mt-1 text-sm text-zinc-500">
        管理画面に入れるアカウントです。
      </p>
      <AdminList admins={admins} myId={me.id} />
    </div>
  );
}
