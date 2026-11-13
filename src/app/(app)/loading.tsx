/** Esqueleto mostrado enquanto uma tela da área logada carrega. */
export default function Loading() {
  return (
    <div
      className="flex flex-col gap-6"
      aria-busy="true"
      aria-label="Carregando"
    >
      <div className="h-14 w-64 animate-pulse rounded-xl bg-secondary" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="h-44 animate-pulse rounded-card bg-secondary sm:col-span-2" />
        <div className="h-44 animate-pulse rounded-card bg-secondary" />
        <div className="h-44 animate-pulse rounded-card bg-secondary" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-card bg-secondary" />
        <div className="h-64 animate-pulse rounded-card bg-secondary" />
      </div>
    </div>
  );
}
