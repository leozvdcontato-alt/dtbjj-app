insert into public.turma_horarios (turma_id, dia_semana, horario_inicio)
select t.id, d.dia, h.hora
from public.turmas t
join (
  values
    (1::smallint, time '20:00'),
    (3::smallint, time '20:00'),
    (5::smallint, time '20:00'),
    (2::smallint, time '20:30'),
    (4::smallint, time '20:30')
) as d(dia, hora) on true
join lateral (select d.hora) h on true
where t.nome = 'Cubango'
on conflict (turma_id, dia_semana, horario_inicio) do nothing;
