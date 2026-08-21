# TODO - DTBJJ App V2

## Objetivo
Redesenhar o aplicativo inteiro com foco em fluidez, clareza, segurança, uso mobile e manutenção simples. A prioridade é entregar uma experiência realmente utilizável na rotina da DTBJJ antes de expandir o produto.

## Princípios do redesign
- Mobile first.
- Poucos passos para concluir ações frequentes.
- Dados sempre consistentes no banco.
- Segurança por padrão.
- Componentes simples e reutilizáveis.
- Feedback visual claro para loading, sucesso, vazio e erro.
- DTBJJ como produto atual, mantendo o banco preparado para evolução futura.

---

# Fase 0 - Fundação e segurança

## Banco e autenticação
- [x] Revisar estrutura atual do Supabase.
- [x] Habilitar RLS em matriculas, chamadas e presencas.
- [x] Remover políticas públicas desnecessárias de alunos e turmas.
- [x] Criar índices para foreign keys principais.
- [x] Impedir matrículas duplicadas por aluno/turma.
- [x] Impedir presença duplicada por chamada/aluno.
- [x] Garantir unicidade de usuarios.auth_id.
- [x] Criar trigger base auth.users -> usuarios.
- [ ] Ajustar cadastro para enviar nome e academia_id como metadata.
- [ ] Remover INSERT manual em usuarios do frontend.
- [ ] Tratar sessão autenticada sem perfil de forma segura.
- [ ] Revisar políticas RLS de usuarios para performance.
- [ ] Ativar proteção contra senhas vazadas no Supabase Auth.

## Qualidade
- [ ] Remover console.log e código de debug.
- [ ] Remover arquivos de teste e assets padrão não utilizados.
- [ ] Padronizar tratamento de erros.
- [ ] Padronizar loading, empty state e feedback de sucesso.

---

# Fase 1 - Arquitetura do frontend

- [ ] Separar telas, componentes, hooks e services.
- [ ] Criar services/alunos.js.
- [ ] Criar services/turmas.js.
- [ ] Criar services/chamadas.js.
- [ ] Criar services/usuarios.js.
- [ ] Centralizar regras de negócio fora dos componentes visuais.
- [ ] Revisar AuthContext.
- [ ] Criar estrutura de permissões por cargo.
- [ ] Criar componentes reutilizáveis de PageHeader, Card, EmptyState, LoadingState, SearchField e Modal.

---

# Fase 2 - Navegação e sistema visual

## Estrutura
- [ ] Redesenhar navegação inferior.
- [ ] Definir Início, Alunos, Turmas, Chamada e Mais.
- [ ] Padronizar cabeçalhos e títulos.
- [ ] Criar hierarquia visual consistente.
- [ ] Revisar espaçamentos, tipografia, tamanhos de toque e contraste.
- [ ] Melhorar safe areas no iPhone/PWA.

## Identidade
- [ ] Consolidar paleta DTBJJ.
- [ ] Definir escala tipográfica.
- [ ] Definir padrões de cards, chips, botões e inputs.
- [ ] Padronizar ícones com Lucide.
- [ ] Criar estados ativos/inativos consistentes.

---

# Fase 3 - Cadastro e acesso

- [ ] Redesenhar tela de login.
- [ ] Finalizar criação de conta.
- [ ] Validar código da academia.
- [ ] Exibir academia reconhecida antes de enviar cadastro.
- [ ] Criar fluxo de confirmação de email quando aplicável.
- [ ] Criar recuperação de senha.
- [ ] Criar solicitação de acesso.
- [ ] Criar status Pendente / Ativo / Recusado.
- [ ] Criar tela administrativa de solicitações.
- [ ] Definir permissões de Aluno, Professor e Administrador.

---

# Fase 4 - Alunos

- [ ] Corrigir filtro por turma.
- [ ] Refatorar listagem de alunos.
- [ ] Busca instantânea.
- [ ] Filtros por turma, faixa e status.
- [ ] Redesenhar card do aluno.
- [ ] Redesenhar perfil do aluno.
- [ ] Melhorar criação e edição.
- [ ] Carregar matrículas existentes ao editar.
- [ ] Salvar aluno + matrículas de forma atômica.
- [ ] Adicionar histórico de graduação.
- [ ] Adicionar frequência real.
- [ ] Adicionar status e observações.

---

# Fase 5 - Turmas

- [ ] Redesenhar lista de turmas.
- [ ] Redesenhar detalhe da turma.
- [ ] Exibir alunos matriculados corretamente.
- [ ] Exibir dias, horários e professor de forma clara.
- [ ] Criar edição simples de turma.
- [ ] Criar gestão de alunos da turma.
- [ ] Exibir última chamada e frequência média.

---

# Fase 6 - Chamada

- [ ] Criar fluxo principal de chamada.
- [ ] Escolher turma.
- [ ] Carregar somente alunos matriculados.
- [ ] Marcar/desmarcar presença com um toque.
- [ ] Ação "Marcar todos".
- [ ] Salvar chamada em transação segura.
- [ ] Evitar presença duplicada.
- [ ] Criar confirmação visual após salvar.
- [ ] Criar histórico por turma.
- [ ] Permitir abrir detalhes de chamada anterior.

---

# Fase 7 - Início / Dashboard

- [ ] Redesenhar dashboard como central operacional.
- [ ] Próximas turmas do dia.
- [ ] Atalho para iniciar chamada.
- [ ] Quantidade de alunos ativos.
- [ ] Últimas chamadas.
- [ ] Pendências administrativas.
- [ ] Indicadores úteis sem poluir a tela.

---

# Fase 8 - Perfil e Mais

- [ ] Redesenhar Meu Perfil.
- [ ] Foto/avatar.
- [ ] Nome, email, telefone e CPF.
- [ ] Alteração de senha.
- [ ] Sair.
- [ ] Área administrativa conforme cargo.
- [ ] Configurações do aplicativo.
- [ ] Informações da academia.

---

# Fase 9 - PWA e experiência

- [ ] Revisar manifesto e ícones.
- [ ] Melhorar tela de instalação.
- [ ] Criar update prompt para nova versão.
- [ ] Revisar cache do service worker.
- [ ] Definir funcionamento offline útil.
- [ ] Criar fallback para perda de conexão.
- [ ] Testar Android e iPhone.

---

# Fase 10 - Testes, observabilidade e produção

- [ ] Criar testes para regras críticas.
- [ ] Testar cadastro/login/logout.
- [ ] Testar CRUD de alunos.
- [ ] Testar aluno x turma.
- [ ] Testar chamada e presença.
- [ ] Revisar logs de produção.
- [ ] Criar fluxo branch -> preview -> produção.
- [ ] Documentar mudanças de banco via migrations.
- [ ] Revisar Supabase Security Advisor antes de releases.

---

# Fase 11 - Evolução futura

Somente depois da DTBJJ estar estável e validada:
- [ ] QR Code para check-in.
- [ ] Check-in automático.
- [ ] Controle avançado de graduação.
- [ ] Relatórios.
- [ ] Notificações.
- [ ] Multiacademias completo.
- [ ] Tatame Pro.
- [ ] Planos e assinaturas.

---

# Ordem atual de execução

1. Segurança + autenticação.
2. Limpeza e arquitetura do frontend.
3. Sistema visual + navegação.
4. Alunos.
5. Turmas.
6. Chamada.
7. Dashboard.
8. Perfil/Admin.
9. PWA.
10. Testes e produção.
