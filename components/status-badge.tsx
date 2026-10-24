export function StatusBadge({ status }: { status: string | null }) {
  const published = status === "published";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        published ? "bg-green-100 text-green-800" : "bg-neutral-200 text-neutral-700"
      }`}
    >
      {published ? "Publicado" : "Borrador"}
    </span>
  );
}
