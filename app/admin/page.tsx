import { getAdminData } from "./admin-data";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  const data = await getAdminData();

  return <AdminDashboard {...data} />;
}