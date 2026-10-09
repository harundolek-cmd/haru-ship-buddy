import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useList, useCurrentUser, loadNo } from "@/lib/tms";
import { errorText } from "@/lib/business";
import {
  PageHeader,
  Panel,
  TableShell,
  Th,
  Td,
  Empty,
  selectCls,
  Field,
} from "@/components/tms/ui";
import { QueryNotice } from "@/components/tms/business/ResourceManager";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/_authenticated/documents")({ component: Documents });
function Documents() {
  const docs = useList("documents"),
    loads = useList("loads").data ?? [],
    { companyId, user } = useCurrentUser(),
    qc = useQueryClient();
  const [search, setSearch] = useState(""),
    [load, setLoad] = useState(""),
    [type, setType] = useState<"BOL" | "POD">("BOL"),
    [file, setFile] = useState<File | null>(null),
    [busy, setBusy] = useState(false),
    [inputKey, setInputKey] = useState(0);
  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !load || !companyId || busy) return;
    if (
      file.size > 10 * 1024 * 1024 ||
      !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type)
    ) {
      toast.error("Choose a PDF, JPG, PNG or WebP up to 10 MB");
      return;
    }
    setBusy(true);
    const path = `${companyId}/${load}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    try {
      const up = await supabase.storage.from("documents").upload(path, file);
      if (up.error) throw up.error;
      const result = await supabase
        .from("documents")
        .insert({
          company_id: companyId,
          load_id: load,
          doc_type: type,
          file_path: path,
          file_name: file.name,
          uploaded_by: user?.id ?? null,
        });
      if (result.error) {
        await supabase.storage.from("documents").remove([path]);
        throw result.error;
      }
      await qc.invalidateQueries({ queryKey: ["documents"] });
      setFile(null);
      setInputKey((x) => x + 1);
      toast.success("Document uploaded");
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function view(path: string) {
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(path, 120);
    if (error) {
      toast.error(error.message);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }
  const rows = (docs.data ?? []).filter((d) =>
    [
      d.file_name,
      loads.find((l) => l.id === d.load_id)?.reference_no,
      loadNo(loads.find((l) => l.id === d.load_id)?.load_no ?? 0),
    ].some((v) => v?.toLowerCase().includes(search.toLowerCase())),
  );
  return (
    <>
      <PageHeader
        title="Document Center"
        subtitle="Private load documents, BOL/POD uploads and printable shipment paperwork."
      />
      <Panel title="Upload document">
        <form onSubmit={upload} className="grid items-end gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Load">
            <select
              className={selectCls}
              required
              value={load}
              onChange={(e) => setLoad(e.target.value)}
            >
              <option value="">Select load…</option>
              {loads.map((l) => (
                <option key={l.id} value={l.id}>
                  {loadNo(l.load_no)} · {l.origin} → {l.destination}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Document type">
            <select
              className={selectCls}
              value={type}
              onChange={(e) => setType(e.target.value as "BOL" | "POD")}
            >
              <option>BOL</option>
              <option>POD</option>
            </select>
          </Field>
          <Field label="PDF / image · max 10 MB">
            <Input
              key={inputKey}
              type="file"
              required
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </Field>
          <Button disabled={busy || !file || !load}>
            {busy ? "Uploading…" : "Upload securely"}
          </Button>
        </form>
      </Panel>
      <Input
        className="max-w-md bg-card"
        aria-label="Search documents"
        placeholder="Search file or load number…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <Panel title={`${rows.length} documents`}>
        {docs.error ? (
          <QueryNotice error={docs.error} />
        ) : docs.isLoading ? (
          <Empty text="Loading…" />
        ) : !rows.length ? (
          <Empty text="No documents found." />
        ) : (
          <TableShell
            head={
              <>
                <Th>Load</Th>
                <Th>Type</Th>
                <Th>File</Th>
                <Th>Uploaded</Th>
                <Th>Open</Th>
              </>
            }
          >
            {rows.map((d) => (
              <tr key={d.id}>
                <Td>{loadNo(loads.find((l) => l.id === d.load_id)?.load_no ?? 0)}</Td>
                <Td>{d.doc_type}</Td>
                <Td>{d.file_name}</Td>
                <Td>{new Date(d.created_at).toLocaleDateString()}</Td>
                <Td>
                  <Button size="sm" variant="outline" onClick={() => view(d.file_path)}>
                    View file
                  </Button>{" "}
                  <Link
                    to="/print/$doc/$loadId"
                    params={{ doc: "bol", loadId: d.load_id }}
                    className="text-xs text-primary"
                  >
                    Print BOL
                  </Link>
                </Td>
              </tr>
            ))}
          </TableShell>
        )}
      </Panel>
    </>
  );
}
