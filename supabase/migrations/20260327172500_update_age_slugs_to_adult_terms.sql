update public.categories
set
  slug = case name
    when '年轻女性' then 'coed'
    when '少妇' then 'milf'
    when '熟女' then 'cougar'
    when '大叔' then 'dilf'
    when '老头' then 'grandpa'
    when '老太' then 'gilf'
    else slug
  end,
  updated_at = timezone('utc'::text, now())
where group_id = (
  select id
  from public.category_groups
  where slug = 'age'
  limit 1
)
and name in ('年轻女性', '少妇', '熟女', '大叔', '老头', '老太');
