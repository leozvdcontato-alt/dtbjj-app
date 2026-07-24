# TODO - DTBJJ App

## 🎯 Objetivo Atual
Consolidar a base do sistema antes de iniciar novas funcionalidades. O foco é tornar o aplicativo realmente utilizável pelos professores da Dream Team Brazilian Jiu-Jitsu.

---

# Sprint 1 - Correções e Base do Sistema

## [x] Corrigir relacionamento Aluno x Turma
- Investigar por que alunos vinculados à turma não aparecem na tela da turma.
- Garantir que o relacionamento esteja consistente no banco.
- Listar corretamente todos os alunos pertencentes à turma.

## [ ] Implementar fluxo real de chamada
- Exibir apenas os alunos da turma selecionada.
- Permitir iniciar uma chamada.
- Marcar presença dos alunos.
- Salvar a chamada no banco.
- Criar histórico de chamadas.

## [ ] Renomear "Home" para "Início"

---

# Sprint 2 - Usuários e Autenticação

## [ ] Criar fluxo de cadastro
- Nome
- Email
- CPF
- Telefone
- Senha
- Confirmar senha
- Tipo de usuário (Aluno ou Professor)

## [ ] Implementar solicitação de acesso
Após criar a conta:
- Usuário envia solicitação.
- Conta permanece pendente até aprovação.

## [ ] Criar tela de solicitações
Apenas Administradores poderão:
- Aprovar usuário.
- Recusar usuário.

## [ ] Criar perfil do usuário
- Foto
- Nome
- Email
- Telefone
- CPF
- Alterar senha
- Logout

## [ ] Personalizar cabeçalho
Trocar:

Logo
Olá Professor
Dream Team Brazilian Jiu-Jitsu

Por:

(Foto do usuário)

Olá, {Nome}

Professor DTBJJ
Aluno DTBJJ
Administrador DTBJJ

Caso não exista foto, utilizar avatar padrão.

---

# Sprint 3 - Estrutura do Banco

## [ ] Revisar modelagem atual
Analisar as tabelas:
- usuários
- alunos
- turmas
- presenças

Entender todos os relacionamentos antes de qualquer alteração estrutural.

## [ ] Definir arquitetura definitiva de usuários
Avaliar a criação de uma tabela central de perfis para evitar duplicação de informações.

---

# Sprint 4 - Melhorias de UX

## [ ] Tela "Mais"
Adicionar:
- Meu Perfil
- Solicitações (Administrador)
- Configurações
- Sair

## [ ] Melhorar experiência mobile
- Revisar espaçamentos
- Revisar navegação
- Revisar feedbacks visuais

---

# Sprint 5 - Funcionalidades Futuras

## [ ] QR Code para check-in

## [ ] Graduação automática

## [ ] Relatórios

## [ ] Dashboard

## [ ] Notificações

## [ ] Funcionamento Offline (PWA)

---

# Ideias

- Cadastro por solicitação de acesso.
- Possibilidade futura de convite por link.
- Usuário cria sua própria conta; administradores apenas aprovam.
- Evitar que professores precisem cadastrar dados de alunos.
- Manter o foco exclusivamente na Dream Team Brazilian Jiu-Jitsu nesta versão.

---

# Fora do escopo (neste momento)

- Multiacademias.
- SaaS Tatame Pro.
- Planos e assinaturas.
- Marketplace.
- Convites entre academias.
- Integrações externas.

Esses itens serão avaliados apenas após a versão da DTBJJ estar madura e validada.