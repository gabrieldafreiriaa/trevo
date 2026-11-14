"use client";

import { Eye } from "lucide-react";
import { useTransition } from "react";

import { Label } from "@/components/ui/label";

import { setViewAs } from "../actions";

type Props = {
  selfId: string;
  ownerId: string;
  people: { id: string; full_name: string }[];
};

/** Seletor do admin: de quem é o painel que está sendo visto (somente leitura). */
export function ViewAsSelect({ selfId, ownerId, people }: Props) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col gap-2">
      <Label
        htmlFor="view-as"
        className="flex items-center gap-1.5 px-1 text-xs font-normal text-muted-foreground"
      >
        <Eye className="size-3.5" aria-hidden />
        Visualizando o painel de
      </Label>
      <select
        id="view-as"
        value={ownerId}
        disabled={pending}
        onChange={(e) => {
          const id = e.target.value;
          startTransition(async () => {
            await setViewAs(id === selfId ? null : id);
          });
        }}
        className="h-11 w-full cursor-pointer rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-focus disabled:opacity-60"
      >
        {people.map((p) => (
          <option key={p.id} value={p.id}>
            {p.id === selfId ? `${p.full_name} (você)` : p.full_name}
          </option>
        ))}
      </select>
    </div>
  );
}
