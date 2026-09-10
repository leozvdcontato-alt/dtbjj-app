insert into public.turma_horarios (turma_id, dia_semana, horario_inicio)
select t.id, d.dia, time '18:00'
from public.turmas t
cross join (values (1::smallint), (3::smallint), (5::smallint)) d(dia)
where t.nome = 'Thai Fight Kids'
on conflict (turma_id, dia_semana, horario_inicio) do nothing;

insert into public.turma_horarios (turma_id, dia_semana, horario_inicio)
select t.id, d.dia, time '17:30'
from public.turmas t
cross join (values (1::smallint), (3::smallint), (5::smallint)) d(dia)
where t.nome = 'Magnólia Kids'
on conflict (turma_id, dia_semana, horario_inicio) do nothing;
