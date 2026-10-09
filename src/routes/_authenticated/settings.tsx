import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, useList } from "@/lib/tms";
import { errorText } from "@/lib/business";
import { PageHeader, Panel, Field, Empty, TableShell, Th, Td } from "@/components/tms/ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/_authenticated/settings")({ component: Settings });
function Settings() {
  const { company, isAdmin, companyId } = useCurrentUser(),
    qc = useQueryClient(),
    invitations = useList("invitations");
  const [f, setF] = useState({
      name: "",
      mc_number: "",
      dot_number: "",
      address: "",
      email: "",
      phone: "",
    }),
    [email, setEmail] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (company)
      setF({
        name: company.name,
        mc_number: company.mc_number ?? "",
        dot_number: company.dot_number ?? "",
        address: company.address ?? "",
        email: company.email ?? "",
        phone: company.phone ?? "",
      });
  }, [company]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!companyId || busy) return;
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("companies")
        .update(f)
        .eq("id", companyId)
        .select("id");
      if (error) throw error;
      if (!data.length) throw new Error("Company was not updated");
      await qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Company saved");
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (
        invitations.data?.some(
          (i) => i.email.toLowerCase() === email.trim().toLowerCase() && !i.accepted_at,
        )
      )
        throw new Error("A pending invitation already exists");
      const { error } = await supabase
        .from("invitations")
        .insert({ email: email.trim().toLowerCase(), role: "dispatcher" });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["invitations"] });
      setEmail("");
      toast.success("Invitation registered. Share the signup address with your colleague.");
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  if (!isAdmin) return <Empty text="Company administrator access required." />;
  return (
    <>
      <PageHeader
        title="Company & Team Access"
        subtitle="Company details used on shipment documents and email-based signup invitations."
      />
      <Panel title="Company profile">
        <form onSubmit={save} className="grid gap-4 p-5 sm:grid-cols-2">
          {Object.entries({
            name: "Company name",
            mc_number: "MC number",
            dot_number: "DOT number",
            address: "Business address",
            email: "Billing email",
            phone: "Phone",
          }).map(([key, label]) => (
            <Field key={key} label={label}>
              <Input
                required={key === "name"}
                type={key === "email" ? "email" : "text"}
                value={f[key as keyof typeof f]}
                onChange={(e) => setF({ ...f, [key]: e.target.value })}
              />
            </Field>
          ))}
          <Button disabled={busy} type="submit">
            Save profile
          </Button>
        </form>
      </Panel>
      <Panel title="Invite a dispatcher">
        <form onSubmit={invite} className="flex flex-wrap gap-3 p-5">
          <Input
            required
            aria-label="Colleague email"
            type="email"
            className="max-w-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@company.com"
          />
          <Button disabled={busy}>Register invitation</Button>
          <p className="w-full text-sm text-muted-foreground">
            No email is sent automatically. Ask the colleague to sign up with this exact email
            address at {typeof window !== "undefined" ? window.location.origin + "/auth" : "/auth"}.
            Existing accounts need administrator-assisted membership changes.
          </p>
        </form>
        <TableShell
          head={
            <>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Action</Th>
            </>
          }
        >
          {invitations.data?.map((i) => (
            <tr key={i.id}>
              <Td>{i.email}</Td>
              <Td>{i.role}</Td>
              <Td>{i.accepted_at ? "Accepted" : "Pending"}</Td>
              <Td>
                {!i.accepted_at && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      if (!confirm("Cancel this invitation?")) return;
                      const { error } = await supabase.from("invitations").delete().eq("id", i.id);
                      if (error) toast.error(error.message);
                      else await qc.invalidateQueries({ queryKey: ["invitations"] });
                    }}
                  >
                    Cancel invitation
                  </Button>
                )}
              </Td>
            </tr>
          ))}
        </TableShell>
      </Panel>
    </>
  );
}
