delete from public.turma_horarios h
using public.turmas t
where h.turma_id = t.id
  and t.nome = 'Thai Fight Adulto';

insert into public.turma_horarios (turma_id, dia_semana, horario_inicio)
select t.id, d.dia, h.hora
from public.turmas t
cross join (values (1::smallint), (3::smallint), (5::smallint)) d(dia)
cross join (
  values
    (time '08:00'),
    (time '09:00'),
    (time '15:00'),
    (time '19:00')
) h(hora)
where t.nome = 'Thai Fight Adulto'
on conflict (turma_id, dia_semana, horario_inicio) do nothing;
