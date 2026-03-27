begin;

select setseed(0.20260327);

create or replace function pg_temp.seeded_rand(input text)
returns double precision
language sql
immutable
as $$
  select (
    ((hashtextextended(input, 20260327::bigint) & 9223372036854775807::bigint)::numeric)
    / 9223372036854775807.0
  )::double precision;
$$;

truncate table public.video_category_assignments restart identity;
truncate table public.video_tag_assignments restart identity;

create temp table temp_group_weights (
  slug text primary key,
  weight double precision not null
) on commit drop;

insert into temp_group_weights (slug, weight)
values
  ('action', 1.4),
  ('body', 1.3),
  ('scenario', 1.2),
  ('place', 1.1),
  ('participants', 1.0),
  ('age', 0.9),
  ('clothing', 0.8),
  ('toys', 0.7),
  ('hair', 0.6),
  ('race', 0.5);

create temp table temp_category_pool on commit drop as
with ranked as (
  select
    c.id as category_id,
    c.slug as category_slug,
    cg.slug as group_slug,
    row_number() over (partition by cg.slug order by c.sort_order, c.id) as popularity_rank
  from public.categories c
  join public.category_groups cg on cg.id = c.group_id
)
select
  category_id,
  category_slug,
  group_slug,
  popularity_rank,
  1.0 / popularity_rank::double precision as popularity_weight
from ranked;

create temp table temp_video_category_targets on commit drop as
select
  v.id as video_id,
  case
    when pg_temp.seeded_rand('category-target|' || v.id::text) < 0.35 then 3
    when pg_temp.seeded_rand('category-target|' || v.id::text) < 0.80 then 4
    else 5
  end as target_count
from public.videos v;

create temp table temp_video_group_scores on commit drop as
select
  t.video_id,
  gw.slug as group_slug,
  gw.weight as group_weight,
  -ln(greatest(pg_temp.seeded_rand('group|' || t.video_id::text || '|' || gw.slug), 1e-12)) / gw.weight as selection_key
from temp_video_category_targets t
cross join temp_group_weights gw;

create temp table temp_video_base_groups on commit drop as
with ranked as (
  select
    s.*,
    row_number() over (partition by s.video_id order by s.selection_key asc, s.group_slug asc) as pick_order
  from temp_video_group_scores s
)
select
  r.video_id,
  r.group_slug,
  r.group_weight,
  r.selection_key,
  r.pick_order
from ranked r
join temp_video_category_targets t on t.video_id = r.video_id
where r.pick_order <= t.target_count;

create temp table temp_video_groups on commit drop as
with base_flags as (
  select
    video_id,
    bool_or(group_slug = 'action') as has_action,
    bool_or(group_slug = 'participants') as has_participants
  from temp_video_base_groups
  group by video_id
),
replacement as (
  select distinct on (b.video_id)
    b.video_id,
    b.group_slug as replace_group_slug
  from temp_video_base_groups b
  join base_flags f on f.video_id = b.video_id
  where f.has_action
    and not f.has_participants
    and b.group_slug <> 'action'
  order by b.video_id, b.group_weight asc, b.selection_key desc, b.group_slug desc
)
select
  b.video_id,
  b.group_slug
from temp_video_base_groups b
left join replacement r
  on r.video_id = b.video_id
 and r.replace_group_slug = b.group_slug
where r.replace_group_slug is null
union all
select
  f.video_id,
  'participants' as group_slug
from base_flags f
where f.has_action
  and not f.has_participants;

create temp table temp_video_participant_categories on commit drop as
with candidate_scores as (
  select
    vg.video_id,
    cp.category_id,
    cp.category_slug,
    -ln(greatest(pg_temp.seeded_rand('participants-category|' || vg.video_id::text || '|' || cp.category_id::text), 1e-12))
      / cp.popularity_weight as selection_key
  from temp_video_groups vg
  join temp_category_pool cp on cp.group_slug = 'participants'
  where vg.group_slug = 'participants'
),
ranked as (
  select
    c.*,
    row_number() over (partition by c.video_id order by c.selection_key asc, c.category_id asc) as pick_order
  from candidate_scores c
)
select
  video_id,
  category_id,
  category_slug
from ranked
where pick_order = 1;

create temp table temp_video_action_categories on commit drop as
with candidate_scores as (
  select
    vg.video_id,
    cp.category_id,
    cp.category_slug,
    -ln(greatest(pg_temp.seeded_rand('action-category|' || vg.video_id::text || '|' || cp.category_id::text), 1e-12))
      / cp.popularity_weight as selection_key
  from temp_video_groups vg
  join temp_video_participant_categories p on p.video_id = vg.video_id
  join temp_category_pool cp on cp.group_slug = 'action'
  where vg.group_slug = 'action'
    and (
      (p.category_slug = 'solo' and cp.category_slug in ('masturbation', 'jerk-off'))
      or p.category_slug <> 'solo'
    )
),
ranked as (
  select
    c.*,
    row_number() over (partition by c.video_id order by c.selection_key asc, c.category_id asc) as pick_order
  from candidate_scores c
)
select
  video_id,
  category_id,
  category_slug
from ranked
where pick_order = 1;

create temp table temp_video_other_categories on commit drop as
with candidate_scores as (
  select
    vg.video_id,
    cp.group_slug,
    cp.category_id,
    cp.category_slug,
    -ln(greatest(pg_temp.seeded_rand('category|' || vg.video_id::text || '|' || cp.group_slug || '|' || cp.category_id::text), 1e-12))
      / cp.popularity_weight as selection_key
  from temp_video_groups vg
  join temp_category_pool cp on cp.group_slug = vg.group_slug
  where vg.group_slug not in ('participants', 'action')
),
ranked as (
  select
    c.*,
    row_number() over (partition by c.video_id, c.group_slug order by c.selection_key asc, c.category_id asc) as pick_order
  from candidate_scores c
)
select
  video_id,
  category_id,
  category_slug
from ranked
where pick_order = 1;

create temp table temp_video_final_categories on commit drop as
select video_id, category_id, category_slug from temp_video_participant_categories
union all
select video_id, category_id, category_slug from temp_video_action_categories
union all
select video_id, category_id, category_slug from temp_video_other_categories;

insert into public.video_category_assignments (video_id, category_id)
select
  video_id,
  category_id
from temp_video_final_categories
order by video_id, category_id;

create temp table temp_tag_bucket_weights (
  bucket_id integer primary key,
  min_sort integer not null,
  max_sort integer not null,
  weight double precision not null
) on commit drop;

insert into temp_tag_bucket_weights (bucket_id, min_sort, max_sort, weight)
values
  (1, 10, 200, 1.4),
  (2, 210, 400, 1.2),
  (3, 410, 600, 1.4),
  (4, 610, 800, 1.2),
  (5, 810, 1000, 0.9),
  (6, 1010, 1200, 1.4),
  (7, 1210, 1400, 1.2),
  (8, 1410, 1600, 1.2),
  (9, 1610, 1800, 0.9),
  (10, 1810, 2000, 0.9);

create temp table temp_tag_pool on commit drop as
with bucketed as (
  select
    t.id as tag_id,
    t.slug as tag_slug,
    b.bucket_id
  from public.tags t
  join temp_tag_bucket_weights b
    on t.sort_order between b.min_sort and b.max_sort
),
ranked as (
  select
    bucketed.tag_id,
    bucketed.tag_slug,
    bucketed.bucket_id,
    row_number() over (partition by bucketed.bucket_id order by t.sort_order, t.id) as popularity_rank
  from bucketed
  join public.tags t on t.id = bucketed.tag_id
)
select
  r.tag_id,
  r.tag_slug,
  r.bucket_id,
  b.weight as bucket_weight,
  r.popularity_rank,
  1.0 / r.popularity_rank::double precision as popularity_weight
from ranked r
join temp_tag_bucket_weights b on b.bucket_id = r.bucket_id;

create temp table temp_video_tag_targets on commit drop as
select
  v.id as video_id,
  case
    when pg_temp.seeded_rand('tag-target|' || v.id::text) < 0.10 then 6
    when pg_temp.seeded_rand('tag-target|' || v.id::text) < 0.30 then 7
    when pg_temp.seeded_rand('tag-target|' || v.id::text) < 0.70 then 8
    when pg_temp.seeded_rand('tag-target|' || v.id::text) < 0.90 then 9
    else 10
  end as target_count
from public.videos v;

create temp table temp_video_selected_buckets on commit drop as
with bucket_scores as (
  select
    t.video_id,
    b.bucket_id,
    b.weight as bucket_weight,
    -ln(greatest(pg_temp.seeded_rand('tag-bucket|' || t.video_id::text || '|' || b.bucket_id::text), 1e-12)) / b.weight as selection_key
  from temp_video_tag_targets t
  cross join temp_tag_bucket_weights b
),
ranked as (
  select
    s.*,
    row_number() over (partition by s.video_id order by s.selection_key asc, s.bucket_id asc) as pick_order
  from bucket_scores s
)
select
  video_id,
  bucket_id,
  bucket_weight
from ranked
where pick_order <= 5;

create temp table temp_video_bucket_extras on commit drop as
with extra_scores as (
  select
    b.video_id,
    b.bucket_id,
    -ln(greatest(pg_temp.seeded_rand('tag-extra-bucket|' || b.video_id::text || '|' || b.bucket_id::text), 1e-12)) / b.bucket_weight as selection_key
  from temp_video_selected_buckets b
),
ranked as (
  select
    s.*,
    row_number() over (partition by s.video_id order by s.selection_key asc, s.bucket_id asc) as pick_order
  from extra_scores s
)
select
  r.video_id,
  r.bucket_id
from ranked r
join temp_video_tag_targets t on t.video_id = r.video_id
where r.pick_order <= t.target_count - 5;

create temp table temp_video_bucket_slots on commit drop as
select
  b.video_id,
  b.bucket_id,
  1 + case when e.bucket_id is not null then 1 else 0 end as slot_count
from temp_video_selected_buckets b
left join temp_video_bucket_extras e
  on e.video_id = b.video_id
 and e.bucket_id = b.bucket_id;

create temp table temp_video_final_tags on commit drop as
with candidate_scores as (
  select
    s.video_id,
    s.bucket_id,
    tp.tag_id,
    tp.tag_slug,
    -ln(greatest(pg_temp.seeded_rand('tag|' || s.video_id::text || '|' || s.bucket_id::text || '|' || tp.tag_id::text), 1e-12))
      / tp.popularity_weight as selection_key
  from temp_video_bucket_slots s
  join temp_tag_pool tp on tp.bucket_id = s.bucket_id
  left join temp_video_participant_categories p on p.video_id = s.video_id
  where not (
    p.category_slug = 'solo'
    and tp.tag_slug in ('makeout', 'girl-girl', 'boy-girl', 'boy-boy', 'dp')
  )
),
ranked as (
  select
    c.*,
    row_number() over (partition by c.video_id, c.bucket_id order by c.selection_key asc, c.tag_id asc) as pick_order
  from candidate_scores c
)
select
  r.video_id,
  r.tag_id
from ranked r
join temp_video_bucket_slots s
  on s.video_id = r.video_id
 and s.bucket_id = r.bucket_id
where r.pick_order <= s.slot_count;

insert into public.video_tag_assignments (video_id, tag_id)
select
  video_id,
  tag_id
from temp_video_final_tags
order by video_id, tag_id;

commit;
