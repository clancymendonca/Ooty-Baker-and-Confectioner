import Spinner from "@/components/ui/Spinner";

export default function DashboardLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex items-center gap-3 text-body/70">
        <Spinner className="h-6 w-6 text-heading" />
        <span>Loading dashboard&hellip;</span>
      </div>
    </div>
  );
}
