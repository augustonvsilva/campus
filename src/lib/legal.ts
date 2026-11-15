// Textos legais do Campus: Termos de uso e Política de Privacidade.
//
// RASCUNHO para revisão jurídica antes do lançamento. Pontos a confirmar com advogado:
// razão social e CNPJ do controlador, e-mail do encarregado (DPO), idade mínima, prazos de
// retenção (incl. guarda de registros de acesso por 6 meses, art. 15 do Marco Civil) e foro.
// Os dados descritos aqui refletem o que o app realmente coleta; ao mudar o app, atualize este arquivo.

import { ACTIVE_COMMUNITY } from './community';

/** TODO: preencher antes do lançamento. */
export const LEGAL = {
  controller: 'Cúpula',
  contactEmail: 'privacidade@SEU-DOMINIO.com.br',
  updatedAt: '14/11/2026',
};

export const NOT_AFFILIATED =
  `O Campus é um projeto independente, sem vínculo oficial com a ${ACTIVE_COMMUNITY.name}. ` +
  'Nomes de universidades são usados apenas para identificar as comunidades de estudantes.';

export interface LegalSection { heading: string; paragraphs: string[] }
export interface LegalDoc { title: string; intro: string; sections: LegalSection[] }

export const TERMS: LegalDoc = {
  title: 'Termos de uso',
  intro:
    `Estes termos valem para quem usa o Campus, rede social de estudantes mantida por ${LEGAL.controller}. ` +
    'Ao criar uma conta, você concorda com eles e com a Política de Privacidade.',
  sections: [
    {
      heading: 'Quem pode usar',
      paragraphs: [
        'O Campus é feito para estudantes universitários. A entrada é por convite e o vínculo com a universidade é confirmado pelo e-mail institucional ou por comprovante analisado pela moderação.',
        'Você precisa ter 16 anos ou mais. Se tiver menos de 18, declara que seus responsáveis autorizam o uso.',
        'A conta é pessoal: não compartilhe seu acesso nem crie contas em nome de outras pessoas.',
      ],
    },
    {
      heading: 'Independência',
      paragraphs: [NOT_AFFILIATED],
    },
    {
      heading: 'Regras da comunidade',
      paragraphs: [
        'Não é permitido: assédio, ameaças, discurso de ódio ou discriminação; expor dados, fotos ou conversas de outras pessoas sem autorização; conteúdo sexual envolvendo terceiros ou menores; golpes, spam e venda de produtos ilegais; se passar por outra pessoa, entidade ou pela universidade.',
        'Você é responsável pelo que publica. Publique só o que você tem direito de compartilhar.',
      ],
    },
    {
      heading: 'Moderação',
      paragraphs: [
        'Qualquer pessoa pode denunciar conteúdo ou bloquear outro usuário. A moderação pode remover conteúdo e suspender ou encerrar contas que descumpram estes termos.',
        'Conteúdo também pode ser removido por ordem judicial, conforme o Marco Civil da Internet (Lei 12.965/2014).',
      ],
    },
    {
      heading: 'Seu conteúdo',
      paragraphs: [
        'O que você publica continua sendo seu. Você autoriza o Campus a exibir esse conteúdo para os membros da sua comunidade, apenas para o funcionamento do serviço.',
        'Ao excluir uma publicação ou a conta, o conteúdo deixa de ser exibido.',
      ],
    },
    {
      heading: 'Encerramento',
      paragraphs: [
        'Você pode excluir sua conta a qualquer momento em Perfil → Excluir conta.',
        'O serviço pode mudar ou ser descontinuado. Mudanças relevantes nestes termos serão avisadas no app.',
      ],
    },
    {
      heading: 'Contato',
      paragraphs: [`Dúvidas sobre estes termos: ${LEGAL.contactEmail}.`],
    },
  ],
};

export const PRIVACY: LegalDoc = {
  title: 'Política de Privacidade',
  intro:
    `Esta política explica quais dados o Campus coleta, para quê e quais são os seus direitos pela Lei Geral de Proteção de Dados (Lei 13.709/2018). ` +
    `O controlador dos dados é ${LEGAL.controller}.`,
  sections: [
    {
      heading: 'Dados que coletamos',
      paragraphs: [
        'Cadastro: nome, nome de usuário, e-mail de login, senha (guardada só de forma criptografada), curso, semestre e o código de convite usado.',
        'Vínculo com a universidade: o e-mail institucional que você confirma (usado só para verificar o vínculo, nunca exibido no perfil) ou o comprovante que você envia (visto só pela moderação).',
        'Perfil opcional: foto, interesses e preferências de privacidade e de notificações.',
        'Uso do app: publicações, comentários, curtidas, enquetes, Bora?, presença em eventos, reservas em saídas, comunidades, conexões (quem você segue), denúncias e bloqueios.',
        'Não coletamos sua localização e não pedimos acesso à câmera ou ao microfone. Fotos são enviadas só quando você escolhe uma.',
      ],
    },
    {
      heading: 'Para que usamos',
      paragraphs: [
        'Para criar e manter sua conta, confirmar que você é estudante, mostrar seu conteúdo à sua comunidade, sugerir pessoas e comunidades com base em curso, interesses e rolês em comum, moderar o conteúdo e manter o serviço seguro.',
        'Bases legais: execução do contrato (estes termos), legítimo interesse (segurança e moderação) e cumprimento de obrigação legal.',
        'Não vendemos seus dados e não os usamos para publicidade direcionada.',
      ],
    },
    {
      heading: 'Quem vê o quê',
      paragraphs: [
        'Membros da sua comunidade veem seu nome, nome de usuário, foto, curso e o que você publica. Com o perfil reservado, os detalhes ficam só para conexões mútuas.',
        'Pessoas de outras universidades não veem nada da sua comunidade.',
        'A moderação vê denúncias e comprovantes de vínculo.',
      ],
    },
    {
      heading: 'Com quem compartilhamos',
      paragraphs: [
        'Usamos provedores para hospedar o banco de dados e os arquivos (Supabase) e para enviar e-mails com códigos (Resend). Eles tratam os dados só para prestar esse serviço, e parte dessa estrutura pode ficar fora do Brasil.',
        'Podemos fornecer dados a autoridades quando houver ordem judicial ou obrigação legal.',
      ],
    },
    {
      heading: 'Por quanto tempo',
      paragraphs: [
        'Enquanto sua conta existir. Ao excluir a conta, seus dados e arquivos são apagados na hora; cópias de segurança do provedor podem mantê-los por um período curto até serem substituídas.',
        'Registros de acesso são guardados pelo prazo exigido pelo Marco Civil da Internet.',
      ],
    },
    {
      heading: 'Seus direitos',
      paragraphs: [
        'Você pode acessar e corrigir seus dados no perfil, excluir sua conta em Perfil → Excluir conta e pedir informações, portabilidade ou revisão de qualquer tratamento.',
        `Para exercer seus direitos ou tirar dúvidas, escreva para ${LEGAL.contactEmail}. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).`,
      ],
    },
  ],
};
