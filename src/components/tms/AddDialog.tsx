import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useInvalidate } from "@/lib/tms";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, selectCls } from "./ui";

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "number" | "email" | "tel";
  required?: boolean;
  options?: { value: string; label: string }[];
};

type TableName = "drivers" | "routes" | "dispatchers" | "teams" | "trucks";

export function AddDialog({ table, title, fields }: { table: TableName; title: string; fields: FieldDef[] }) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const invalidate = useInvalidate();

  async function submit(e: FormEvent) {
    e.preventDefault();
    const row: Record<string, string | number | null> = {};
    for (const f of fields) {
      const v = values[f.name] ?? (f.options?.[0]?.value ?? "");
      row[f.name] = v === "" ? null : f.type === "number" ? Number(v) : v;
    }
    const { error } = await supabase.from(table).insert(row as never);
    if (error) { toast.error(error.message); return; }
    toast.success(`${title} eklendi`);
    invalidate(table);
    setValues({});
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 pl-2 pr-3"><span className="font-mono">＋</span> {title} Ekle</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{title} Ekle</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid gap-3">
          {fields.map((f) => (
            <Field key={f.name} label={f.label}>
              {f.options ? (
                <select className={selectCls} value={values[f.name] ?? f.options[0]?.value ?? ""} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}>
                  {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <Input type={f.type ?? "text"} required={f.required} value={values[f.name] ?? ""} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />
              )}
            </Field>
          ))}
          <Button type="submit" className="mt-1">Kaydet</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteBtn({ table, id }: { table: TableName; id: string }) {
  const invalidate = useInvalidate();
  return (
    <button
      onClick={async () => {
        if (!confirm("Silmek istediğinize emin misiniz?")) return;
        const { error } = await supabase.from(table).delete().eq("id", id);
        if (error) { toast.error("Sadece yönetici silebilir"); return; }
        invalidate(table);
      }}
      className="font-mono text-xs text-muted-foreground hover:text-destructive"
      title="Sil"
    >
      ✕
    </button>
  );
}
