do $$
declare
  body_group_id bigint;
begin
  select id
  into body_group_id
  from public.category_groups
  where slug = 'body'
  limit 1;

  if body_group_id is null then
    raise exception 'category group "body" not found';
  end if;

  insert into public.categories (slug, name, sort_order, group_id)
  values
    ('big-penis', '大鸡巴', 70, body_group_id),
    ('big-butt', '大屁股', 80, body_group_id),
    ('fair-skin', '白皮肤', 90, body_group_id),
    ('dark-skin', '深色皮肤', 100, body_group_id),
    ('flat-chest', '平胸', 110, body_group_id),
    ('hairless-pussy', '白虎', 120, body_group_id)
  on conflict (slug) do update
  set
    name = excluded.name,
    sort_order = excluded.sort_order,
    group_id = excluded.group_id,
    updated_at = timezone('utc'::text, now());
end
$$;
