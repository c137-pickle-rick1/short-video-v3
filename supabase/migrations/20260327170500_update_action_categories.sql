do $$
declare
  action_group_id bigint;
begin
  select id
  into action_group_id
  from public.category_groups
  where slug = 'action'
  limit 1;

  if action_group_id is null then
    raise exception 'category group "action" not found';
  end if;

  delete from public.video_category_assignments vca
  using public.categories c
  where vca.category_id = c.id
    and c.group_id = action_group_id
    and c.slug in ('kissing', 'handjob');

  delete from public.categories
  where group_id = action_group_id
    and slug in ('kissing', 'handjob');

  insert into public.categories (slug, name, sort_order, group_id)
  values
    ('footjob', '足交', 70, action_group_id),
    ('anal', '肛交', 80, action_group_id),
    ('facial', '颜射', 90, action_group_id),
    ('titjob', '乳交', 100, action_group_id),
    ('jerk-off', '撸管', 110, action_group_id),
    ('creampie', '中出', 120, action_group_id),
    ('fingering', '指交', 130, action_group_id),
    ('sixty-nine', '69', 140, action_group_id),
    ('facesitting', '骑脸', 150, action_group_id)
  on conflict (slug) do update
  set
    name = excluded.name,
    sort_order = excluded.sort_order,
    group_id = excluded.group_id,
    updated_at = timezone('utc'::text, now());
end
$$;
