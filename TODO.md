# TODO - DTBJJ App V2

## Decisões de produto vigentes
- Existem três perfis: Aluno, Professor e Administrador.
- Cadastro público é exclusivo para Aluno.
- Aluno entra usando código exclusivo de uma turma e já é matriculado nela.
- Professor é criado somente por Administrador, por convite.
- Administrador controla estrutura da academia.
- Check-in usa QR fixo por local, valida matrícula e janela de -15 min a +60 min com horário do servidor.
- QR de check-in e código de convite de turma são credenciais diferentes.
- Compatibilidade futura com Capacitor deve ser preservada.

## Fundação e segurança
- [x] RLS nas tabelas operacionais.
- [x] Cargos Aluno, Professor e Administrador.
- [x] Cadastro público limitado a Aluno.
- [x] Matrícula automática via código da turma.
- [x] Professor criado apenas por convite administrativo.
- [x] Permissões de professor limitadas às turmas atribuídas.
- [x] RPC de aluno + matrículas restrita a Administrador.
- [x] CI com lint e build.
- [ ] Ativar proteção contra senhas vazadas no Supabase Auth.
- [ ] Revisar dependências reportadas pelo npm audit.

## Alunos
- [x] Listagem, busca e filtros.
- [x] Perfil e edição.
- [x] Matrículas existentes na edição.
- [x] Frequência real no perfil.
- [ ] Histórico de graduação.
- [ ] Observações.

## Turmas
- [x] Código exclusivo de convite por turma.
- [x] Local vinculado à turma.
- [x] Estrutura de horários por dia e hora.
- [x] Relação N:N entre professores e turmas.
- [x] Exibição do código para Administrador.
- [ ] Editor completo de turma, horários, local e professores.
- [ ] Gestão de alunos da turma.
- [ ] Última chamada e frequência média.

## Check-in
- [x] Locais com token QR próprio.
- [x] Botão central de Check-in no menu do Aluno.
- [x] Leitura interna de QR quando BarcodeDetector estiver disponível.
- [x] Suporte a QR aberto pela câmera normal via URL.
- [x] Janela de -15 min a +60 min.
- [x] Hora validada no servidor em America/Sao_Paulo.
- [x] Validação de aluno, matrícula, local e horário.
- [x] Impedir check-in duplicado.
- [x] Gerar presença automaticamente.
- [ ] Gerador visual do QR para impressão.
- [ ] Configurar horários ainda ausentes nas turmas legadas.
- [ ] Avaliar geolocalização apenas se houver abuso do QR fixo.

## Professores
- [x] Convite exclusivo pelo Administrador.
- [x] Convite enviado por Edge Function protegida por JWT.
- [x] Perfil Professor criado automaticamente em convite.
- [ ] Tela para atribuir professores às turmas.
- [ ] Gestão de status de professor.

## Chamada
- [ ] Redesenhar fluxo principal.
- [ ] Carregar somente alunos matriculados.
- [ ] Marcar todos.
- [ ] Salvar chamada em transação segura.
- [ ] Histórico por turma.
- [ ] Integrar visualmente presença por check-in e presença manual.

## Próxima ordem
1. Validar cadastro de Aluno e convite de Professor em produção.
2. Finalizar editor Turmas V2.
3. Atribuição de professores.
4. Gerador de QR por local.
5. Chamada V2.
6. Dashboard.
7. Perfil/Admin.
8. PWA e testes mobile.
