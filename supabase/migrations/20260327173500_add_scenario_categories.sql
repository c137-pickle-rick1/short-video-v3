do $$
declare
  scenario_group_id bigint;
begin
  select id
  into scenario_group_id
  from public.category_groups
  where slug = 'scenario'
  limit 1;

  if scenario_group_id is null then
    raise exception 'category group "scenario" not found';
  end if;

  insert into public.categories (slug, name, sort_order, group_id)
  values
    ('interview', '面试', 70, scenario_group_id),
    ('gym', '健身', 80, scenario_group_id),
    ('bus', '坐公交', 90, scenario_group_id),
    ('subway', '坐地铁', 100, scenario_group_id),
    ('airplane', '坐飞机', 110, scenario_group_id),
    ('onsen', '泡温泉', 120, scenario_group_id),
    ('cinema', '看电影', 130, scenario_group_id),
    ('bath', '洗澡', 140, scenario_group_id)
  on conflict (slug) do update
  set
    name = excluded.name,
    sort_order = excluded.sort_order,
    group_id = excluded.group_id,
    updated_at = timezone('utc'::text, now());
end
$$;
