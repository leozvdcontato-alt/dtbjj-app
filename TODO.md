# TODO - Tatame Pro

## 🔔 Sistema de Notificações

### Concluído

- [x] Criar componente Toast
- [x] Melhorar layout do Toast
- [x] Criar ToastContext
- [x] Criar ToastProvider
- [x] Criar hook useToast()
- [x] Integrar ToastProvider ao projeto
- [x] Migrar PainelChamada para o Toast global

### Pendente

- [ ] Remover todos os alert() restantes do sistema
- [ ] Padronizar mensagens de sucesso
- [ ] Padronizar mensagens de erro

---

# 👨‍🎓 Gestão de Alunos

## Refatoração

### Objetivo

Separar responsabilidades do PainelAlunos para reduzir complexidade e facilitar manutenção.

### Estrutura desejada

src/components/
│
├── PainelAlunos.jsx
├── AlunoModal.jsx
└── AlunoPerfil.jsx

---

## Cadastro de Alunos

### Implementar

- [ ] Seleção de múltiplas turmas
- [ ] Carregar matrículas ao editar aluno
- [ ] Salvar matrículas ao cadastrar aluno
- [ ] Atualizar matrículas ao editar aluno
- [ ] Remover matrículas antigas antes da atualização

---

## Perfil do Aluno

- [ ] Separar componente AlunoPerfil
- [ ] Exibir turmas do aluno
- [ ] Exibir estatísticas
- [ ] Exibir progresso para graduação

---

## Listagem de Alunos

- [ ] Adicionar botão Editar
- [ ] Adicionar botão Perfil
- [ ] Adicionar botão Excluir
- [ ] Melhorar ações da tabela

---

# 🥋 Gestão de Turmas

- [ ] Migrar para Toast
- [ ] Remover alert()
- [ ] Melhorar validações

---

# 📋 Chamadas

## Corrigir

- [ ] Validar exibição de todos os alunos da turma
- [ ] Validar funcionamento após implementação das matrículas

---

# 🏠 Dashboard

## Corrigir

- [ ] Buscar última chamada diretamente do Supabase
- [ ] Atualizar card "Última chamada"
- [ ] Criar card "Próximas graduações"

---

# ⚙ Arquitetura

## Organização

- [ ] Separar componentes grandes
- [ ] Reduzir componentes acima de 400 linhas
- [ ] Centralizar consultas em services
- [ ] Centralizar notificações
- [ ] Padronizar tratamento de erros

---

# 🧪 Testes

Após cada refatoração validar:

- [ ] Cadastro de aluno
- [ ] Edição de aluno
- [ ] Matrículas
- [ ] Chamada
- [ ] Dashboard
- [ ] Toasts