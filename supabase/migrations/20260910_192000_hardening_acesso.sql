drop policy if exists "Usuários podem criar o próprio perfil" on public.usuarios;

revoke insert on public.usuarios from authenticated;
revoke update on public.usuarios from authenticated;
grant update (nome, telefone, cpf, foto) on public.usuarios to authenticated;

revoke execute on function public.validar_codigo_academia(text) from public, anon, authenticated;

update public.turmas
set codigo_convite = 'DT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));

comment on function public.validar_codigo_turma(text) is
'Valida convite de aluno por código de turma. SECURITY DEFINER é intencional: anon não possui SELECT direto em turmas.';

comment on function public.registrar_checkin(text) is
'Registra presença de aluno após validar perfil, matrícula, local e janela de horário. SECURITY DEFINER é intencional porque alunos não possuem INSERT direto em chamadas/presencas.';
