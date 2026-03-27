do $$
declare
  clothing_group_id bigint;
begin
  select id
  into clothing_group_id
  from public.category_groups
  where slug = 'clothing'
  limit 1;

  if clothing_group_id is null then
    raise exception 'category group "clothing" not found';
  end if;

  insert into public.categories (slug, name, sort_order, group_id)
  values
    ('school-uniform', '校服', 70, clothing_group_id),
    ('sailor-uniform', '水手服', 80, clothing_group_id),
    ('gym-uniform', '体操服', 90, clothing_group_id),
    ('qipao', '旗袍', 100, clothing_group_id),
    ('bunny-girl', '兔女郎', 110, clothing_group_id),
    ('swimsuit', '泳衣', 120, clothing_group_id),
    ('lingerie', '内衣', 130, clothing_group_id),
    ('cat-ears', '猫耳', 140, clothing_group_id)
  on conflict (slug) do update
  set
    name = excluded.name,
    sort_order = excluded.sort_order,
    group_id = excluded.group_id,
    updated_at = timezone('utc'::text, now());
end
$$;
