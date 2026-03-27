do $$
declare
  age_group_id bigint;
begin
  select id
  into age_group_id
  from public.category_groups
  where slug = 'age'
  limit 1;

  if age_group_id is null then
    raise exception 'category group "age" not found';
  end if;

  delete from public.video_category_assignments vca
  using public.categories c
  where vca.category_id = c.id
    and c.group_id = age_group_id
    and c.slug in ('young-adult', 'prime', 'mature');

  delete from public.categories
  where group_id = age_group_id
    and slug in ('young-adult', 'prime', 'mature');

  insert into public.categories (slug, name, sort_order, group_id)
  values
    ('young-woman', '年轻女性', 10, age_group_id),
    ('young-wife', '少妇', 20, age_group_id),
    ('mature-woman', '熟女', 30, age_group_id),
    ('middle-aged-man', '大叔', 40, age_group_id),
    ('old-man', '老头', 50, age_group_id),
    ('old-woman', '老太', 60, age_group_id)
  on conflict (slug) do update
  set
    name = excluded.name,
    sort_order = excluded.sort_order,
    group_id = excluded.group_id,
    updated_at = timezone('utc'::text, now());
end
$$;
