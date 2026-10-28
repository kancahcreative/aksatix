-- Patch kuota: jalankan di Supabase SQL Editor (aman diulang).
create or replace function public.aksatix_guard_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uid_ uuid := auth.uid();
  t jsonb; tid text; price numeric; q int; line numeric;
begin
  -- SQL editor / service_role / edge function: lewati. Admin: lewati.
  if uid_ is null then return new; end if;
  if exists (select 1 from public.aksatix_admins a where a.user_id = uid_) then return new; end if;

  if tg_op = 'UPDATE' then
    if new.payload->>'status' is distinct from old.payload->>'status'
       or new.payload->>'total' is distinct from old.payload->>'total' then
      raise exception 'Status/total pesanan hanya dapat diubah admin';
    end if;
    return new;
  end if;

  tid := new.payload->>'ticketId';
  select payload into t from public.aksatix_records
   where kind = 'tickets' and (record_id = tid or payload->>'id' = tid) limit 1;
  if t is null or lower(coalesce(t->>'status','')) <> 'active' then
    raise exception 'Tiket tidak tersedia';
  end if;

  q     := greatest(1, least(coalesce(nullif(new.payload->>'qty','')::int, 1), 10));
  price := coalesce(nullif(t->>'price','')::numeric, 0);
  line  := price * q;

  -- tiket berbayar: tolak kalau kuota sudah habis (sold bertambah saat order dilunasi admin)
  if line > 0 and coalesce(nullif(t->>'quota','')::int, 2147483647)
       < coalesce(nullif(t->>'sold','')::int, 0) + q then
    raise exception 'Kuota tiket tidak mencukupi';
  end if;

  if line = 0 then
    -- tiket gratis: kunci baris tiket & cek kuota secara atomik
    update public.aksatix_records
       set payload = jsonb_set(payload, '{sold}', to_jsonb(coalesce(nullif(payload->>'sold','')::int, 0) + q))
     where kind = 'tickets' and record_id = (select record_id from public.aksatix_records
                                              where kind='tickets' and (record_id = tid or payload->>'id' = tid) limit 1)
       and coalesce(nullif(payload->>'sold','')::int, 0) + q
           <= coalesce(nullif(payload->>'quota','')::int, 2147483647);
    if not found then raise exception 'Kuota tiket tidak mencukupi'; end if;
  end if;

  new.payload := new.payload || jsonb_build_object(
    'qty', q,
    'total', line,
    'organizer_id', coalesce(t->>'organizer_id', new.payload->>'organizer_id', ''),
    'status', case when line = 0 then 'Paid' else 'Pending' end,
    'paymentMethod', case when line = 0 then 'Free' else 'QRIS' end,
    'userId', uid_::text
  );
  return new;
end $$;

drop trigger if exists aksatix_guard_order_trg on public.aksatix_records;
create trigger aksatix_guard_order_trg
  before insert or update on public.aksatix_records
  for each row when (new.kind = 'orders')
  execute function public.aksatix_guard_order();

notify pgrst, 'reload schema';
