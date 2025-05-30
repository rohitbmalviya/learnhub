import { redirect } from "next/navigation";

// Analytics is embedded in the instructor dashboard
export default function AnalyticsPage() {
  redirect("/instructor");
}
