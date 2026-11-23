import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./DocumentoLegal.css";

/* ------------------------------------------------------------------
 * PREENCHA ANTES DE PUBLICAR O SITE
 * Estes textos são um modelo escrito com base no que o Ideia Futura
 * realmente faz. Troque os dados abaixo e, se possível, peça para
 * alguém (professor, advogado) dar uma lida.
 * Se mudar algo importante, atualize também VERSAO_TERMOS no backend
 * (backend/src/config/termos.js) e a data aqui.
 * ------------------------------------------------------------------ */
const RESPONSAVEL = "[NOME DE QUEM MANTÉM O SITE]";
const CONTATO = "[SEU E-MAIL DE CONTATO]";
const DATA_VERSAO = "16/11/2026";

interface Secao {
  titulo: string;
  texto: (string | string[])[];
}

const TERMOS: Secao[] = [
  {
    titulo: "1. O que é o Ideia Futura",
    texto: [
      "O Ideia Futura é um site onde pessoas publicam ideias que não vão tirar do papel, para que outras pessoas possam conhecê-las, comentar, curtir, salvar e, se quiserem, entrar em contato com quem teve a ideia.",
      `O site é mantido por ${RESPONSAVEL} (“nós”). Ao criar uma conta, você declara que leu e concorda com estes Termos e com a Política de Privacidade.`,
    ],
  },
  {
    titulo: "2. Sua conta",
    texto: [
      "Para criar a conta é preciso ter 14 anos ou mais. Entre 14 e 17 anos, o uso deve ser feito com o conhecimento dos responsáveis.",
      "Você precisa informar um e-mail seu e confirmá-lo pelo link que enviamos. A senha é pessoal: não a passe para ninguém. O que acontecer na sua conta é, em regra, de sua responsabilidade.",
      "Se suspeitar que alguém entrou na sua conta, troque a senha em Meu perfil > Alterar senha.",
    ],
  },
  {
    titulo: "3. Suas ideias e comentários",
    texto: [
      "O que você publica é de sua responsabilidade. Você continua sendo o autor, e nos autoriza apenas a exibir o conteúdo no site, de acordo com a visibilidade que você escolheu (pública, oculta ou rascunho).",
      "Importante: o site não registra a ideia em seu nome nem garante proteção legal sobre ela. Se a ideia tiver valor comercial ou for sigilosa, pense bem antes de publicá-la. Ideias publicadas como públicas podem ser lidas por qualquer pessoa com conta.",
      "Você pode publicar de forma anônima. Nesse caso, seu nome não aparece para os outros usuários, mas a moderação consegue identificar a autoria se houver uma denúncia.",
    ],
  },
  {
    titulo: "4. O que não é permitido",
    texto: [
      "Não publique nem envie, em ideias, comentários ou conversas:",
      [
        "conteúdo ilegal, discriminatório, que incite violência ou ódio;",
        "ofensas, ameaças, assédio ou perseguição a outras pessoas;",
        "dados pessoais de terceiros (telefone, endereço, documentos) sem autorização;",
        "conteúdo sexual explícito ou que envolva menores;",
        "golpes, spam, propaganda enganosa ou vírus;",
        "conteúdo que você copiou de outra pessoa como se fosse seu;",
        "tentativas de burlar a segurança do site ou de usar contas falsas.",
      ],
    ],
  },
  {
    titulo: "5. Contato entre usuários e conversas privadas",
    texto: [
      "Quem tiver interesse numa ideia pode pedir contato com o autor, que aceita ou recusa. Se aceitar, os dois conversam em um chat dentro do site.",
      "Essas conversas são privadas, mas qualquer participante pode denunciá-las. Quando há denúncia, a equipe de moderação pode ler a conversa para decidir o caso, e cada leitura fica registrada.",
    ],
  },
  {
    titulo: "6. Denúncias e moderação",
    texto: [
      "Qualquer pessoa pode denunciar ideias, comentários e conversas. A moderação analisa e pode: manter o conteúdo, ocultá-lo, removê-lo, enviar uma advertência, suspender a conta ou excluí-la.",
      "Em casos muito graves, a conta pode ser suspensa ou excluída sem aviso prévio. Se você acha que houve engano, fale com a gente pelo contato no fim desta página.",
    ],
  },
  {
    titulo: "7. Disponibilidade",
    texto: [
      "Fazemos o possível para manter o site no ar, mas ele pode ficar fora do ar, mudar ou ser encerrado. Por isso, guarde uma cópia do que for importante para você.",
    ],
  },
  {
    titulo: "8. Responsabilidade",
    texto: [
      "O site é oferecido como está. Não somos responsáveis pelo conteúdo publicado pelos usuários, nem por acordos, parcerias ou negócios feitos entre eles a partir do site. Converse com cuidado e não envie dinheiro ou dados sensíveis a pessoas que você não conhece.",
    ],
  },
  {
    titulo: "9. Mudanças nestes Termos",
    texto: [
      "Podemos atualizar estes Termos. Quando a mudança for importante, avisaremos no site ou por e-mail e pediremos um novo aceite se necessário. Continuar usando o site depois do aviso significa que você concorda com a versão nova.",
    ],
  },
  {
    titulo: "10. Lei aplicável e contato",
    texto: [
      "Estes Termos seguem as leis do Brasil. Dúvidas, pedidos ou reclamações: " + CONTATO + ".",
    ],
  },
];

const PRIVACIDADE: Secao[] = [
  {
    titulo: "1. Quem cuida dos seus dados",
    texto: [
      `O responsável pelo tratamento dos seus dados pessoais é ${RESPONSAVEL}. Contato para assuntos de privacidade (incluindo o encarregado/DPO): ${CONTATO}.`,
      "Esta política segue a Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018).",
    ],
  },
  {
    titulo: "2. Quais dados coletamos",
    texto: [
      [
        "Cadastro: nome de usuário, e-mail e senha (a senha é guardada embaralhada com bcrypt; nem nós conseguimos lê-la).",
        "Conta: data de criação, e-mail confirmado ou não, versão dos Termos que você aceitou e quando.",
        "O que você cria: ideias, rascunhos, anexos (imagens e PDFs), comentários, curtidas, favoritos e mensagens das conversas privadas.",
        "Uso do site: notificações, pedidos de contato e quantidade de visualizações das ideias.",
        "Moderação: denúncias (feitas e recebidas), decisões, advertências e registros de quem da equipe tomou cada decisão.",
        "Dados técnicos: o endereço IP é usado para limitar tentativas abusivas (por exemplo, muitos logins errados) e aparece nos registros do servidor de hospedagem.",
      ],
      "Não pedimos CPF, telefone, endereço, localização nem dados sensíveis. Pedimos que você também não os coloque em ideias e comentários.",
    ],
  },
  {
    titulo: "3. Para que usamos e em que base legal",
    texto: [
      [
        "Criar e manter sua conta, mostrar suas ideias e permitir os contatos: execução do contrato (os Termos de Uso).",
        "Confirmar o e-mail, evitar contas falsas, fraude e abuso, e manter a segurança: legítimo interesse.",
        "Moderar denúncias e proteger outras pessoas: legítimo interesse e cumprimento de obrigações legais.",
        "Enviar e-mails do serviço (confirmação, recuperação e troca de senha, avisos de segurança): execução do contrato.",
        "Guardar o aceite dos Termos: comprovar o seu consentimento.",
      ],
      "Não usamos seus dados para publicidade e não vendemos seus dados.",
    ],
  },
  {
    titulo: "4. Cookies e armazenamento no navegador",
    texto: [
      "Usamos apenas o necessário: dois cookies de login (accessToken e refreshToken), que mantêm você conectado e não podem ser lidos por scripts do navegador, e uma preferência de tema (claro/escuro) guardada no seu aparelho. Não usamos cookies de publicidade nem de rastreamento.",
    ],
  },
  {
    titulo: "5. Com quem compartilhamos",
    texto: [
      "Só com empresas que fazem o site funcionar: hospedagem do site, banco de dados e serviço de envio de e-mail. Elas tratam os dados apenas para prestar esse serviço. Podemos também compartilhar dados se uma autoridade exigir por lei.",
      "Suas ideias públicas e seus comentários são visíveis a outros usuários, e o nome aparece a menos que a ideia seja anônima.",
    ],
  },
  {
    titulo: "6. Por quanto tempo guardamos",
    texto: [
      "Enquanto sua conta existir. Se você excluir a conta (Meu perfil), seus dados de cadastro, ideias, comentários e conversas são apagados.",
      "Podemos manter por mais tempo apenas o que for necessário para segurança, defesa de direitos ou obrigação legal, como o histórico de denúncias e decisões de moderação.",
    ],
  },
  {
    titulo: "7. Seus direitos",
    texto: [
      "Você pode, a qualquer momento: saber quais dados temos, corrigir dados (Meu perfil), pedir uma cópia, pedir a exclusão (o botão de excluir conta está em Meu perfil), retirar o consentimento e pedir informações sobre compartilhamento.",
      `Para exercer qualquer direito que não esteja disponível direto no site, escreva para ${CONTATO}. Respondemos em até 15 dias. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).`,
    ],
  },
  {
    titulo: "8. Como protegemos",
    texto: [
      "Senhas embaralhadas, conexão criptografada (HTTPS), limites contra tentativas abusivas, confirmação de e-mail, encerramento de sessões quando a senha é trocada e acesso restrito aos dados pela equipe. Nenhum sistema é 100% seguro: se houver um incidente que possa causar risco a você, avisaremos você e a ANPD, como manda a lei.",
    ],
  },
  {
    titulo: "9. Menores de idade",
    texto: [
      "O site é para maiores de 14 anos. Se soubermos de uma conta de alguém mais novo, ela poderá ser excluída. Responsáveis podem pedir a exclusão pelo contato acima.",
    ],
  },
  {
    titulo: "10. Mudanças nesta política",
    texto: [
      "Podemos atualizar esta política. A data da versão fica no topo da página; mudanças importantes serão avisadas no site ou por e-mail.",
    ],
  },
];

const DocumentoLegal: React.FC<{ titulo: string; secoes: Secao[]; irPara: { texto: string; to: string } }> = ({
  titulo,
  secoes,
  irPara,
}) => {
  const navigate = useNavigate();

  return (
    <main className="dl-pagina">
      <div className="dl-folha">
        <div className="dl-topo">
          <button type="button" className="dl-voltar" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}>
            <i className="fa-solid fa-arrow-left" aria-hidden="true"></i> Voltar
          </button>
          <span className="dl-marca">Ideia Futura</span>
        </div>

        <h1>{titulo}</h1>
        <p className="dl-versao">Versão de {DATA_VERSAO}</p>

        {secoes.map((s) => (
          <section key={s.titulo} className="dl-secao">
            <h2>{s.titulo}</h2>
            {s.texto.map((t, i) =>
              Array.isArray(t) ? (
                <ul key={i}>
                  {t.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p key={i}>{t}</p>
              ),
            )}
          </section>
        ))}

        <p className="dl-fim">
          Veja também: <Link to={irPara.to}>{irPara.texto}</Link>
        </p>
      </div>
    </main>
  );
};

export const TermosPage: React.FC = () => (
  <DocumentoLegal titulo="Termos de Uso" secoes={TERMOS} irPara={{ texto: "Política de Privacidade", to: "/privacidade" }} />
);

export const PrivacidadePage: React.FC = () => (
  <DocumentoLegal titulo="Política de Privacidade" secoes={PRIVACIDADE} irPara={{ texto: "Termos de Uso", to: "/termos" }} />
);
