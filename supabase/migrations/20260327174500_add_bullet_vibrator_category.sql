do $$
declare
  toys_group_id bigint;
begin
  select id
  into toys_group_id
  from public.category_groups
  where slug = 'toys'
  limit 1;

  if toys_group_id is null then
    raise exception 'category group "toys" not found';
  end if;

  insert into public.categories (slug, name, sort_order, group_id)
  values
    ('bullet-vibrator', '跳蛋', 80, toys_group_id)
  on conflict (slug) do update
  set
    name = excluded.name,
    sort_order = excluded.sort_order,
    group_id = excluded.group_id,
    updated_at = timezone('utc'::text, now());
end
$$;
