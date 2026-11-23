# Novas funções: o que você precisa fazer e como testar

## 1. Antes de publicar (obrigatório)

1. **Preencha seus dados** nos Termos e na Privacidade: abra `frontend/src/pages/DocumentoLegal.tsx` e troque, no topo do arquivo, `RESPONSAVEL` e `CONTATO` (hoje aparecem como `[NOME ...]` e `[SEU E-MAIL ...]` na página). Os textos são um modelo escrito com base no que o seu site faz. Peça para um professor ou alguém de confiança ler antes de publicar. Se mudar algo importante, mude também a data em `backend/src/config/termos.js` (`VERSAO_TERMOS`).
2. **Configure o envio de e-mail** no `.env` do backend (`EMAIL_USER` e `EMAIL_PASSWORD`). Para Gmail, a senha é uma "senha de app" (Conta Google > Segurança > Verificação em duas etapas > Senhas de app). **Sem isso, em produção o e-mail de confirmação não sai e ninguém consegue concluir o cadastro.** No seu computador, sem esses dados, o link aparece no terminal do backend (procure `[EMAIL DEV/SIMULADO]`).
3. `FRONTEND_URL` no `.env` precisa ser o endereço real do site, porque é ele que vai dentro do link do e-mail.

## 2. O que acontece com quem já tem conta
Nada muda para eles. Na primeira vez que o backend subir, as contas que já existem ficam marcadas como confirmadas. Só contas **novas** precisam confirmar o e-mail. As colunas e a tabela novas são criadas sozinhas.

## 3. Como as funções se comportam
- **Cadastro:** exige marcar o aceite dos Termos e da Privacidade (o servidor também confere, não dá para burlar). Não entra logado: vai aparecer "Confira seu e-mail".
- **Login sem confirmar:** só avisa depois de acertar a senha, e mostra o botão "Reenviar e-mail de confirmação".
- **Link do e-mail:** vale 24 h e só funciona uma vez. Abre a página `/confirmar-email`.
- **Cadastro repetido:** se alguém tentar cadastrar de novo um e-mail que ainda está esperando confirmação (dentro das 24 h), a senha do primeiro cadastro NÃO é trocada, só reenviamos o link. Isso impede que um intruso "assuma" o cadastro de outra pessoa.
- **Trocar e-mail (Meu perfil):** o e-mail antigo continua valendo até a pessoa clicar no link enviado ao novo. Assim um erro de digitação não tranca ninguém fora da conta. O endereço antigo recebe um aviso.
- **Alterar senha (Meu perfil > Segurança):** pede a senha atual, exige a mesma regra de senha forte, derruba as outras sessões (inclusive links de acesso antigos) e manda aviso por e-mail. Quem trocou continua conectado.
- **Excluir conta (Meu perfil > Segurança):** pede a senha e uma confirmação.

## 4. Roteiro rápido de teste (5 minutos)
1. Suba o backend e o front. Cadastre uma conta nova (sem marcar o aceite deve dar erro).
2. Tente entrar antes de confirmar: deve bloquear e mostrar o botão de reenviar.
3. Copie o link do terminal do backend (ou do e-mail) e abra: "E-mail confirmado". Entre.
4. Em Meu perfil, troque a senha. Abra o site em outra janela anônima, logada antes, e veja que ela foi deslogada.
5. Troque o e-mail no perfil e confirme que o antigo continua valendo até clicar no link.
6. Abra `/termos` e `/privacidade`.

## 5. O que ainda não existe
- Desbanir usuário e lista de banidos na tela de administração.
- Tela para ver o registro (log) de moderação.
- Arquivos anexados que sobrevivem em hospedagem grátis (o disco apaga quando o site reinicia).
- Contas nunca confirmadas ficam no banco; dá para limpar de tempos em tempos com
  `DELETE FROM USUARIOS WHERE EMAIL_CONFIRMADO_EM IS NULL AND CREATED_AT < NOW() - INTERVAL 7 DAY;`
