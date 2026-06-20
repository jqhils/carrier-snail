alter table public.snails
  add column if not exists species_id text;

update public.snails
set species_id = case rarity
  when 'common' then 'garden'
  when 'uncommon' then 'sydney-train'
  when 'rare' then 'uni-sydney'
  when 'mythic' then 'red-bull'
  when 'cursed' then 'backwards'
  else 'garden'
end
where species_id is null;

alter table public.snails
  alter column species_id set default 'garden',
  alter column species_id set not null;

alter table public.snails
  drop constraint if exists snails_species_id_check;

alter table public.snails
  add constraint snails_species_id_check
  check (
    species_id in (
      'garden',
      'barista',
      'sydney-train',
      'comp-sci',
      'postal',
      'uni-sydney',
      'absent-father',
      'red-bull',
      'golden',
      'backwards'
    )
  );
