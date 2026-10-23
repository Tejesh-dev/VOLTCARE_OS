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

- Keep customer-specific visits, expenses, payments, location and photo metadata in the existing persisted Zustand store so profile changes remain available across sessions.
- A route file whose path is a prefix of another route (e.g. `/customers` vs `/customers/$id`) must be a layout that renders `<Outlet />`, with the list moved to `<name>.index.tsx`; otherwise the child page never renders and the parent silently shows at the child URL.
- Zustand selectors must return stable references — select the raw array and derive with `useMemo`/`useShallow`; an inline `.filter()` inside `useVoltcare(...)` makes the store snapshot unstable and triggers "Maximum update depth exceeded".
