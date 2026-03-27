begin;

alter table public.tags drop constraint if exists tags_group_id_fkey;
alter table public.tags drop constraint if exists tags_group_id_name_key;

drop index if exists public.tags_group_id_sort_idx;
drop index if exists public.tag_groups_sort_idx;

alter table public.tags drop column if exists group_id;

drop table if exists public.tag_groups;

create index if not exists tags_sort_idx on public.tags (sort_order, id);

commit;
