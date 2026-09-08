-- Harden function privileges flagged by Supabase's security advisor:
-- 1) pin search_path on every function so it can't be hijacked by a
--    session-level search_path change, and
-- 2) stop PostgREST from exposing internal trigger/helper functions as
--    public RPC endpoints (/rest/v1/rpc/<fn>) -- only the small set of
--    read-only boolean helpers that RLS policies themselves call need to
--    stay callable by `authenticated`.

alter function public.set_updated_at() set search_path = public;
alter function public.set_submission_reference_code() set search_path = public;

-- Internal trigger/helper functions: never meant to be invoked directly by
-- a client, only fired by triggers or called from within another
-- SECURITY DEFINER function's body (which already runs as the function
-- owner). Revoking EXECUTE does not affect trigger firing.
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.set_submission_reference_code() from public, anon, authenticated;
revoke execute on function public.next_reference_code(text, text, integer) from public, anon, authenticated;
revoke execute on function public.resolve_step_approver(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.start_submission_workflow() from public, anon, authenticated;
revoke execute on function public.create_notification(uuid, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.audit_log_trigger() from public, anon, authenticated;
revoke execute on function public.notify_on_approval_created() from public, anon, authenticated;
revoke execute on function public.advance_submission_workflow() from public, anon, authenticated;
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;

-- Read-only boolean helpers: RLS policies call these directly, so
-- `authenticated` (the role every policy is scoped `to`) must keep EXECUTE.
-- `anon` never needs them -- every policy in this schema is `to authenticated`.
revoke execute on function public.has_global_role(text) from public, anon;
revoke execute on function public.is_super_admin() from public, anon;
revoke execute on function public.is_flm() from public, anon;
revoke execute on function public.has_department_role(uuid, text) from public, anon;
revoke execute on function public.is_department_member(uuid) from public, anon;
revoke execute on function public.is_department_head(uuid) from public, anon;
revoke execute on function public.is_hr_admin() from public, anon;
revoke execute on function public.my_department_ids() from public, anon;

grant execute on function public.has_global_role(text) to authenticated;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.is_flm() to authenticated;
grant execute on function public.has_department_role(uuid, text) to authenticated;
grant execute on function public.is_department_member(uuid) to authenticated;
grant execute on function public.is_department_head(uuid) to authenticated;
grant execute on function public.is_hr_admin() to authenticated;
grant execute on function public.my_department_ids() to authenticated;
