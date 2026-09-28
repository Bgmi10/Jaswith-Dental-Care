import { getAdminData } from "./admin-data";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const data = await getAdminData();

  return <AdminDashboard {...data} />;
}