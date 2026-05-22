import {
  getUseCaseConfig,
  type UseCaseId,
} from "@/app/lib/use-cases";

export function UseCaseBadge({ useCase }: { useCase: UseCaseId }) {
  const config = getUseCaseConfig(useCase);
  const styles =
    useCase === "apollo"
      ? "border-teal-500/40 bg-teal-600/15 text-teal-200"
      : "border-indigo-500/40 bg-indigo-600/15 text-indigo-200";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${styles}`}
    >
      {config.shortLabel}
    </span>
  );
}
