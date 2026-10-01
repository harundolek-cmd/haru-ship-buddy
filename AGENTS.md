<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Signed-in app pages live under `src/routes/_authenticated/` and read/write data with the browser Cloud client (RLS enforces access) — simplest path for an internal staff tool.
- Roles live in `user_roles`; the first signed-up user becomes admin via the `handle_new_user` trigger — avoids a manual bootstrap step.
- BOL/POD files go to the private `documents` storage bucket and are opened with short-lived signed URLs — documents must not be public.
