// Teste de ponta a ponta do Campus no modo demonstração (Chrome headless).
// Uso: suba o app com `npm run web` (sem .env.local) e rode `npm run test:e2e`.
// Telas que ficam montadas por trás (abas, pilha) são "inert": os seletores só consideram elementos interativos.
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const BASE = process.env.E2E_URL ?? 'http://localhost:8081';
const SHOTS = process.argv[2] ?? 'tests/e2e/screenshots';
mkdirSync(SHOTS, { recursive: true });
const browser = await chromium.launch({ channel: process.env.E2E_BROWSER ?? 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, permissions: ['clipboard-read', 'clipboard-write'] });
// Sem o menu de compartilhar do sistema (no headless ele não abre): o app cai para "copiar link".
await context.addInitScript(() => { delete Navigator.prototype.share; });
const page = await context.newPage();
const LIVE = page.locator(':not([inert] *):not([inert])');

const problems = [];
page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') problems.push('console: ' + m.text()); });

let step = 0;
const results = [];
async function check(name, fn) {
  step++;
  try {
    await fn();
    results.push(`  ✔ ${name}`);
  } catch (e) {
    results.push(`  ✘ ${name} → ${e.message.split('\n')[0]}`);
    await page.screenshot({ path: `${SHOTS}/falha-${step}.png` }).catch(() => {});
  }
}
const shot = (name) => page.screenshot({ path: `${SHOTS}/${name}.png` });
const visible = (text, opts = {}) => page.getByText(text, opts).locator('visible=true').and(LIVE).first().waitFor({ state: 'visible', timeout: 8000 });
const tab = (name) => page.getByRole('tab', { name }).or(page.getByRole('link', { name })).locator('visible=true').and(LIVE).first().click();

await check('abre a tela de entrada', async () => {
  await page.goto(BASE);
  await visible('CAMPUS', { exact: true });
  await visible('Tenho um convite');
  await shot('01-entrar');
});

const pickSemester = (s) => page.getByText(s, { exact: true }).locator('visible=true').and(LIVE).first().click();

await check('termos, privacidade e aviso de independência na entrada', async () => {
  await visible('projeto independente, sem vínculo oficial', { exact: false });
  await page.getByText('Termos de uso', { exact: true }).locator('visible=true').and(LIVE).first().click();
  await visible('Regras da comunidade');
  await page.goBack();
  await page.getByText('Política de Privacidade', { exact: true }).locator('visible=true').and(LIVE).first().click();
  await visible('Dados que coletamos');
  await shot('01a-privacidade');
  await page.goBack();
  await visible('Tenho um convite');
});

await check('cadastro exige nome de usuário, curso e semestre', async () => {
  await page.getByPlaceholder('Ex.: MACK-7KQ2P').fill('ERRADO');
  await page.getByPlaceholder('Como você quer aparecer').fill('Teste Fundador');
  await page.getByPlaceholder('seu@email.com').fill('teste@mackenzista.com.br');
  await page.getByRole('switch').nth(0).click();
  await page.getByText('Entrar no Campus').click();
  await visible('O nome de usuário precisa ter pelo menos 3 caracteres.');
  await page.getByPlaceholder('ex.: ana.ribeiro').fill('@Teste Fundador');
  await visible('Use só letras sem acento', { exact: false });
  await page.getByPlaceholder('ex.: ana.ribeiro').fill('teste.fundador');
  await page.getByText('Entrar no Campus').click();
  await visible('A senha precisa ter pelo menos 8 caracteres.');
  await page.getByPlaceholder('Mínimo de 8 caracteres').fill('somenteletras');
  await page.getByText('Entrar no Campus').click();
  await visible('Use letras e números na senha.');
  await page.getByPlaceholder('Mínimo de 8 caracteres').fill('fundador2026');
  const pw = page.getByPlaceholder('Mínimo de 8 caracteres');
  if ((await pw.getAttribute('type')) !== 'password') throw new Error('senha deveria começar escondida');
  await page.getByRole('button', { name: 'Mostrar senha' }).click();
  if ((await pw.getAttribute('type')) === 'password') throw new Error('botão não mostrou a senha');
  await shot('01c-senha-visivel');
  await page.getByRole('button', { name: 'Esconder senha' }).click();
  if ((await pw.getAttribute('type')) !== 'password') throw new Error('botão não escondeu a senha');
  await page.getByText('Entrar no Campus').click();
  await visible('Escolha seu curso.');
  await page.getByRole('button', { name: 'Escolher curso' }).click();
  await page.getByPlaceholder('Buscar curso').fill('ciencia');
  await visible('Ciência da Computação');
  await page.getByPlaceholder('Buscar curso').fill('dire');
  await page.getByText('Direito', { exact: true }).locator('visible=true').and(LIVE).first().click();
  await visible('Direito', { exact: true });
  await page.getByText('Entrar no Campus').click();
  await visible('Escolha seu semestre.');
  await pickSemester('3º');
  await shot('01b-cadastro-preenchido');
});

await check('valida nome de usuário já usado', async () => {
  await page.getByPlaceholder('ex.: ana.ribeiro').fill('ana.an');
  await page.getByText('Entrar no Campus').click();
  await visible('Esse nome de usuário já está em uso. Escolha outro.');
  await page.getByPlaceholder('ex.: ana.ribeiro').fill('teste.fundador');
});

await check('valida convite inválido', async () => {
  await page.getByText('Entrar no Campus').click();
  await visible('Convite inválido ou esgotado.');
});

await check('cadastro direto com e-mail institucional (já verificado)', async () => {
  await page.getByPlaceholder('Ex.: MACK-7KQ2P').fill('FUNDADORES');
  await page.getByText('Entrar no Campus').click();
  await visible('Que bom ter você aqui, Teste!');
  await page.getByText('futsal', { exact: true }).locator('visible=true').and(LIVE).first().click();
  await shot('02a-boas-vindas');
  await page.getByText('Começar', { exact: true }).click();
  await visible('Pergunte, recomende, combine algo…');
  await visible('Quem vai no futsal hoje?', { exact: false });
  await shot('02-inicio');
});

await check('curtir publicação', async () => {
  const like = page.getByRole('button', { name: 'Curtir' }).locator('visible=true').and(LIVE).first();
  await like.click();
  await page.getByRole('button', { name: 'Descurtir' }).locator('visible=true').and(LIVE).first().waitFor({ timeout: 5000 });
});

await check('central de atividade (sino com novidades)', async () => {
  await page.getByRole('button', { name: 'Atividade, 2 novidades' }).locator('visible=true').and(LIVE).first().click();
  await visible('começou a seguir você', { exact: false });
  await shot('02b-atividade');
  await page.goBack();
  await page.getByRole('button', { name: 'Atividade', exact: true }).locator('visible=true').and(LIVE).first().waitFor({ timeout: 5000 });
});

await check('mensagens privadas (demo): boas-vindas, resposta automática e perfil', async () => {
  await page.getByRole('button', { name: 'Mensagens, 1 não lidas' }).locator('visible=true').and(LIVE).first().click();
  await visible('Ana Ribeiro');
  await page.getByRole('link', { name: /Conversa com Ana Ribeiro/ }).click();
  await visible('Vi que você chegou no Campus', { exact: false });
  await page.getByPlaceholder('Escreva uma mensagem…').fill('Bora! Chego às 19h.');
  await page.getByRole('button', { name: 'Enviar mensagem' }).click();
  await visible('Bora! Chego às 19h.');
  await visible('Opa! Vi agora', { exact: false });
  await shot('02d-conversa');
  await page.goto(BASE + '/usuario/u_diego');
  await page.getByText('Mensagem', { exact: true }).locator('visible=true').and(LIVE).first().click();
  await page.getByPlaceholder('Escreva uma mensagem…').fill('Oi Diego, tem lugar na combi?');
  await page.getByRole('button', { name: 'Enviar mensagem' }).click();
  await visible('Opa! Vi agora', { exact: false });
  await page.goto(BASE + '/mensagens');
  await visible('Diego Sato');
  await shot('02e-mensagens');
  await page.goto(BASE);
});

await check('busca por @usuário, comunidade e evento', async () => {
  await page.getByRole('button', { name: 'Buscar' }).locator('visible=true').and(LIVE).first().click();
  const box = page.getByPlaceholder('Pessoas, @usuário, comunidades, eventos…');
  await box.fill('@ana');
  await visible('Ana Ribeiro');
  await box.fill('bateria');
  await visible('Bateria Universitária');
  await box.fill('xyzsemresultado');
  await visible('Nada encontrado');
  await shot('02c-busca');
  await page.goBack();
});

await check('aba Agora', async () => {
  await tab('Agora');
  await visible('Rolando agora');
  await visible('Feira de Estágios');
  await visible('Bora? nas próximas horas');
  await shot('03-agora');
});

await check('aba Eventos + filtro', async () => {
  await tab('Eventos');
  await visible('Agenda universitária');
  await visible('Calourada de Fim de Ano');
  await page.getByRole('button', { name: /Jogos$/ }).locator('visible=true').and(LIVE).first().click();
  await visible('Interatlética de Vôlei');
  await shot('04-eventos');
  await page.getByRole('button', { name: /Todos$/ }).locator('visible=true').and(LIVE).first().click();
});

await check('evento: "Eu vou"', async () => {
  await page.getByText('Sarau no Gramado').locator('visible=true').and(LIVE).first().click();
  await page.getByText('Eu vou', { exact: true }).click();
  await visible('Eu vou ✓');
  await shot('05-evento');
  await page.goBack();
});

await check('aba Explorar + lugar + recomendação', async () => {
  await tab('Explorar');
  await visible('Lugares, pessoas e comunidades');
  await page.getByText('Lanchonete Ponto Final').click();
  await visible('Ainda sem recomendações', { exact: false }).catch(() => {});
  await page.getByPlaceholder('O que vale a pena? Preço, prato, clima, horário bom…').fill('Coxinha boa e barata, rápido no intervalo.');
  await page.getByText('Publicar recomendação').click();
  await visible('Coxinha boa e barata');
  await visible('Você já recomendou este lugar.');
  await shot('06-lugar');
  await page.goBack();
});

await check('criar Bora?', async () => {
  await tab('Início');
  await page.getByRole('button', { name: 'Criar publicação, Bora? ou evento' }).locator('visible=true').and(LIVE).first().click();
  await page.getByText('Bora?', { exact: true }).locator('visible=true').and(LIVE).first().click();
  await page.getByPlaceholder('estudar em grupo, ver o jogo, almoçar depois da aula…').fill('Jogar truco no intervalo');
  await page.getByPlaceholder('Ex.: portão principal, biblioteca, entrada do ginásio').fill('Mesas da praça de alimentação');
  await page.getByPlaceholder('Sem limite').fill('4');
  await shot('07-criar-bora');
  await page.getByText('Publicar Bora?').click();
  await visible('Jogar truco no intervalo');
  await visible('Cancelar plano');
  await shot('08-bora');
});

await check('comentar no Bora?', async () => {
  await page.getByPlaceholder('Mande uma mensagem pro grupo…').fill('Levo o baralho!');
  await page.getByRole('button', { name: 'Enviar comentário' }).click();
  await visible('Levo o baralho!');
  await page.goBack();
});

await check('publicar com enquete e validade', async () => {
  await page.getByRole('button', { name: 'Criar publicação, Bora? ou evento' }).locator('visible=true').and(LIVE).first().click();
  await page.getByPlaceholder('Uma pergunta, recomendação ou aviso para a comunidade…').fill('Melhor horário pra academia do campus?');
  await page.getByText('Adicionar enquete').locator('..').locator('..').getByRole('switch').click();
  await page.getByRole('textbox').nth(1).fill('Manhã');
  await page.getByRole('textbox').nth(2).fill('Noite');
  await page.getByText('2 h', { exact: true }).click();
  await page.getByText('Publicar', { exact: true }).click();
  await visible('Melhor horário pra academia do campus?');
  await page.getByRole('button', { name: 'Votar em Noite' }).click();
  await visible('100%');
  await shot('09-enquete');
});

await check('editar a própria publicação e comentário', async () => {
  await page.goto(BASE);
  await page.getByText('Melhor horário pra academia do campus?').locator('visible=true').and(LIVE).first().click();
  await page.getByText('Editar', { exact: true }).locator('visible=true').and(LIVE).last().click();
  await page.locator('textarea').locator('visible=true').and(LIVE).first().fill('Melhor horário pra academia? (editado pelo teste)');
  await page.getByText('Salvar', { exact: true }).locator('visible=true').and(LIVE).first().click();
  await visible('(editado pelo teste)', { exact: false });
  await visible('editado', { exact: false });
  await page.getByPlaceholder('Escreva um comentário…').fill('Comentário com erro de digitação');
  await page.getByRole('button', { name: 'Enviar comentário' }).click();
  await visible('Comentário com erro de digitação');
  await page.getByText('Editar', { exact: true }).locator('visible=true').and(LIVE).first().click();
  await page.getByLabel('Editar comentário').fill('Comentário corrigido');
  await page.getByText('Salvar', { exact: true }).locator('visible=true').and(LIVE).first().click();
  await visible('Comentário corrigido');
  await page.getByText('Apagar', { exact: true }).locator('visible=true').and(LIVE).first().click();
  await page.getByText('Comentário corrigido').waitFor({ state: 'detached', timeout: 5000 });
  await page.goto(BASE);
});

await check('saída: conversa, Pix, compartilhar e agenda', async () => {
  await page.goto(BASE + '/saida/ride1');
  await visible('Conversa da saída', { exact: false });
  await visible('A volta é que horas mais ou menos?');
  await page.getByText('Copiar chave Pix').click();
  await visible('Chave copiada');
  const pix = await page.evaluate(() => navigator.clipboard.readText());
  if (pix !== 'atletica.eng@exemplo.com') throw new Error('Pix copiado errado: ' + pix);
  await page.getByText('Compartilhar', { exact: true }).locator('visible=true').and(LIVE).first().click();
  await visible('Link copiado', { exact: false });
  const link = await page.evaluate(() => navigator.clipboard.readText());
  if (!link.endsWith('/saida/ride1')) throw new Error('link compartilhado errado: ' + link);
  await page.getByPlaceholder('Pergunte ou avise algo…').fill('Posso embarcar no meio do caminho?');
  await page.getByRole('button', { name: 'Enviar comentário' }).click();
  await visible('Posso embarcar no meio do caminho?');
  await visible('Google Agenda');
  await shot('09b-saida');
  await page.goto(BASE);
});

await check('denunciar e bloquear', async () => {
  await page.getByRole('button', { name: 'Denunciar publicação' }).locator('visible=true').and(LIVE).first().click();
  await page.getByText('Informação falsa').click();
  await page.getByRole('switch').locator('visible=true').and(LIVE).first().click();
  await page.getByText('Enviar denúncia').click();
  await visible('Recebemos sua denúncia');
  await page.getByText('Fechar').click();
  await page.waitForTimeout(500);
  const diego = await page.getByText('Alguém sabe se a biblioteca abre no sábado?').locator('visible=true').and(LIVE).count();
  if (diego) throw new Error('post do usuário bloqueado continua visível');
});

await check('perfil: convites', async () => {
  await page.getByLabel('Abrir perfil').locator('visible=true').and(LIVE).first().click();
  await visible('Vínculo verificado');
  await page.getByText('Gerar convite').click();
  await visible('0 de 5 usados');
  await shot('10-perfil');
});

await check('perfil: foto (recorte, persistência e remoção)', async () => {
  // Imagem de origem retangular (300×200), gerada a partir da própria tela.
  const src = `${SHOTS}/avatar-origem.png`;
  await page.screenshot({ path: src, clip: { x: 0, y: 0, width: 300, height: 200 } });
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Trocar foto de perfil' }).locator('visible=true').and(LIVE).first().click();
  await (await chooser).setFiles(src);
  const photo = page.locator('[aria-label="Foto de Teste Fundador"]').locator('visible=true').and(LIVE).first();
  await photo.waitFor({ timeout: 10000 });
  await visible('Remover foto');
  // Conferir que a imagem salva é um JPEG quadrado de 256 px.
  const dims = await page.evaluate(async () => {
    const s = JSON.parse(localStorage.getItem('campus:state:v3'));
    const me = s.users[s.session.userId];
    const img = new Image();
    img.src = me.avatarUrl;
    await img.decode();
    return { w: img.naturalWidth, h: img.naturalHeight, jpeg: me.avatarUrl.startsWith('data:image/jpeg') };
  });
  if (dims.w !== 256 || dims.h !== 256 || !dims.jpeg) throw new Error('foto não processada: ' + JSON.stringify(dims));
  await shot('10b-perfil-foto');
  await page.reload();
  await page.locator('[aria-label="Foto de Teste Fundador"]').locator('visible=true').and(LIVE).first().waitFor({ timeout: 10000 });
  await page.getByText('Remover foto').locator('visible=true').and(LIVE).first().click();
  await page.getByRole('button', { name: 'Trocar foto de perfil' }).locator('visible=true').and(LIVE).first().waitFor();
  const still = await page.getByText('Remover foto').locator('visible=true').and(LIVE).count();
  if (still) throw new Error('foto não foi removida');
  // Coloca a foto de volta para aparecer nas próximas telas.
  const again = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Trocar foto de perfil' }).locator('visible=true').and(LIVE).first().click();
  await (await again).setFiles(src);
  await visible('Remover foto');
});

// ───────── Conexões e comunidades ─────────
const live = (loc) => loc.locator('visible=true').and(LIVE).first();
const btn = (name) => live(page.getByRole('button', { name }));
const tomorrow = (() => { const d = new Date(Date.now() + 86_400_000); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`; })();

await check('conexões: sugestão por rolê em comum e seguir', async () => {
  await page.goto(BASE);
  await visible('Pergunte, recomende, combine algo…');
  await tab('Explorar');
  await btn(/Pessoas$/).click();
  await visible('Quem vai aos mesmos rolês que você');
  // O teste marcou "Eu vou" no Sarau, onde a Gabriela tem interesse.
  const gabi = btn('Ver perfil de Gabriela Nunes');
  await gabi.waitFor();
  if (!(await gabi.textContent()).includes('rolê em comum')) throw new Error('motivo da sugestão não mostra rolê em comum: ' + (await gabi.textContent()));
  const gabiRow = live(page.locator('[aria-label="Pessoa: Gabriela Nunes"]'));
  await gabiRow.getByRole('button', { name: 'Seguir', exact: true }).click();
  await gabiRow.getByRole('button', { name: 'Deixar de seguir' }).waitFor();
  await shot('20-pessoas');
});

await check('perfil de outra pessoa: rolês em comum e comunidades', async () => {
  await btn('Ver perfil de Gabriela Nunes').click();
  await visible('Vocês vão aos mesmos rolês (1)');
  await visible('Sarau no Gramado');
  await visible('Bateria Universitária');
  await visible('Seguindo');
  await shot('21-perfil-outro');
  await page.goBack();
});

await check('perfil reservado só abre para conexões mútuas', async () => {
  await page.getByPlaceholder('Buscar por nome, curso ou interesse').locator('visible=true').and(LIVE).first().fill('eduarda');
  await btn('Ver perfil de Eduarda Lima').click();
  await visible('Perfil reservado', { exact: false });
  const posts = await page.getByText('Perdi um guarda-chuva', { exact: false }).locator('visible=true').and(LIVE).count();
  if (posts) throw new Error('publicações de perfil reservado visíveis');
  await page.goBack();
});

await check('feed "Seguindo"', async () => {
  await tab('Início');
  await btn(/Seguindo \(\d+\)$/).click();
  await visible('A exposição de fim de semestre de Design', { exact: false });
  const other = await page.getByText('Quem vai no futsal hoje?').locator('visible=true').and(LIVE).count();
  if (other) throw new Error('post de quem não sigo apareceu em "Seguindo"');
  await btn(/Para você$/).click();
});

await check('comunidade: entrar, reservar saída e publicar no mural', async () => {
  await tab('Explorar');
  await btn(/Comunidades$/).click();
  await visible('Comunidades do campus');
  await live(page.getByText('Bateria Universitária', { exact: true })).click();
  await visible('Ensaios toda semana', { exact: false });
  await btn(/Entrar na comunidade$/).click();
  await visible('Participando ✓');
  await btn(/Saídas \(1\)$/).click();
  await visible('Ônibus da bateria para a Calourada');
  await btn('Reservar lugar').click();
  await visible('Reservado ✓');
  await shot('22-comunidade-saidas');
  await btn(/Mural$/).click();
  await btn(/Publicar no mural$/).click();
  await page.getByPlaceholder('Uma pergunta, recomendação ou aviso para a comunidade…').locator('visible=true').and(LIVE).first().fill('Primeira vez no ensaio, alguém me empresta um tamborim?');
  await live(page.getByText('Publicar', { exact: true })).click();
  await visible('Primeira vez no ensaio', { exact: false });
  await visible('Participando ✓');
});

await check('criar comunidade + evento de treino + saída com reserva', async () => {
  await page.goto(BASE);
  await visible('Pergunte, recomende, combine algo…');
  await tab('Explorar');
  await btn(/Comunidades$/).click();
  await btn(/Criar comunidade$/).click();
  await page.getByPlaceholder('Ex.: Atlética de Direito').locator('visible=true').and(LIVE).first().fill('Atlética de Teste');
  await live(page.getByText('Criar comunidade', { exact: true })).click();
  await visible('Você é admin');
  await btn(/Agenda \(0\)$/).click();
  await btn(/Novo evento/).click();
  await page.getByRole('textbox').locator('visible=true').and(LIVE).first().fill('Treino de vôlei');
  await btn(/Treinos e ensaios$/).click();
  await page.getByPlaceholder('dd/mm').locator('visible=true').and(LIVE).first().fill(tomorrow);
  await page.getByPlaceholder('hh:mm').locator('visible=true').and(LIVE).first().fill('18:00');
  await page.getByRole('textbox').locator('visible=true').and(LIVE).nth(3).fill('Quadra 1');
  await visible('Organização: Atlética de Teste');
  await live(page.getByText('Publicar evento', { exact: true })).click();
  await visible('Treino de vôlei');
  await btn(/Nova saída para este evento$/).click();
  await page.getByPlaceholder('dd/mm').locator('visible=true').and(LIVE).first().fill(tomorrow);
  await page.getByPlaceholder('hh:mm').locator('visible=true').and(LIVE).first().fill('17:15');
  await page.getByPlaceholder('Ex.: Portão principal').locator('visible=true').and(LIVE).first().fill('Portão principal');
  await page.getByPlaceholder('Sem limite').locator('visible=true').and(LIVE).first().fill('8');
  await page.getByPlaceholder('Ex.: R$ 15').locator('visible=true').and(LIVE).first().fill('Grátis');
  await shot('23-criar-saida');
  await live(page.getByText('Publicar saída', { exact: true })).click();
  await visible('Combi para Treino de vôlei');
  await visible('Ponto de partida: Portão principal');
  await btn(/Reservar meu lugar$/).click();
  await visible('1 de 8 lugares reservados');
  await shot('24-saida');
});

await check('moderação: remover spam e aprovar verificação', async () => {
  await page.goto(BASE);
  await visible('Pergunte, recomende, combine algo…');
  await live(page.getByLabel('Abrir perfil')).click();
  await live(page.getByText('Painel de moderação')).click();
  await visible('Spam ou golpe');
  await visible('VENDO INGRESSO', { exact: false });
  await shot('11-moderacao');
  await page.getByRole('button', { name: 'Remover' }).locator('visible=true').and(LIVE).nth(1).click();
  await page.getByText('VENDO INGRESSO', { exact: false }).locator('visible=true').waitFor({ state: 'detached', timeout: 5000 });
  await page.getByText('Verificações (1)').click();
  await visible('Henrique Alves');
  await page.getByRole('button', { name: 'Aprovar' }).locator('visible=true').and(LIVE).first().click();
  await visible('Nenhuma verificação pendente');
});

await check('post removido some do feed', async () => {
  await page.goto(BASE);
  await visible('Pergunte, recomende, combine algo…');
  const n = await page.getByText('VENDO INGRESSO', { exact: false }).locator('visible=true').count();
  if (n) { const t = await page.getByText('VENDO INGRESSO', { exact: false }).locator('visible=true').first().evaluate((e) => e.closest('[data-testid], body')?.tagName + ' ' + (e.textContent ?? '').slice(0, 40)); throw new Error('post de spam ainda aparece: ' + t); }
});

await check('sair e entrar de novo com "Já tenho conta"', async () => {
  await page.getByLabel('Abrir perfil').locator('visible=true').and(LIVE).first().click();
  await page.getByText('Sair', { exact: true }).locator('visible=true').and(LIVE).first().click();
  await visible('Tenho um convite');
  await page.getByText('Já tenho conta').click();
  await page.getByPlaceholder('seu@email.com').fill('teste@mackenzista.com.br');
  await page.getByText('Entrar no Campus').click();
  await visible('Digite sua senha.');
  await page.getByPlaceholder('Sua senha').fill('senhaerrada1');
  await page.getByText('Entrar no Campus').click();
  await visible('E-mail ou senha incorretos.');
  await page.getByPlaceholder('Sua senha').fill('fundador2026');
  await page.getByText('Entrar no Campus').click();
  await visible('Pergunte, recomende, combine algo…');
});

await check('trocar a senha no perfil e entrar com a nova', async () => {
  await page.getByLabel('Abrir perfil').locator('visible=true').and(LIVE).first().click();
  const field = page.getByPlaceholder('Mínimo de 8 caracteres, com letras e números').locator('visible=true').and(LIVE).first();
  await field.fill('curta1');
  await page.getByText('Salvar senha').locator('visible=true').and(LIVE).first().click();
  await visible('A senha precisa ter pelo menos 8 caracteres.');
  await field.fill('novasenha2026');
  await page.getByText('Salvar senha').locator('visible=true').and(LIVE).first().click();
  await visible('Senha salva.');
  await page.getByText('Sair', { exact: true }).locator('visible=true').and(LIVE).first().click();
  await page.getByText('Já tenho conta').click();
  await page.getByPlaceholder('seu@email.com').fill('teste@mackenzista.com.br');
  await page.getByPlaceholder('Sua senha').fill('fundador2026');
  await page.getByText('Entrar no Campus').click();
  await visible('E-mail ou senha incorretos.');
  await page.getByPlaceholder('Sua senha').fill('novasenha2026');
  await page.getByText('Entrar no Campus').click();
  await visible('Pergunte, recomende, combine algo…');
});

await check('entrar por "Esqueci a senha" (código por e-mail)', async () => {
  await page.getByLabel('Abrir perfil').locator('visible=true').and(LIVE).first().click();
  await page.getByText('Sair', { exact: true }).locator('visible=true').and(LIVE).first().click();
  await page.getByText('Já tenho conta').click();
  await page.getByPlaceholder('seu@email.com').fill('');
  await page.getByText('Esqueci a senha (entrar com código)').click();
  await visible('Digite seu e-mail para receber o código.');
  await page.getByPlaceholder('seu@email.com').fill('teste@mackenzista.com.br');
  await page.getByText('Esqueci a senha (entrar com código)').click();
  await visible('Pergunte, recomende, combine algo…');
});

await check('cadastro com e-mail pessoal fica sem publicar até verificar', async () => {
  await page.getByLabel('Abrir perfil').locator('visible=true').and(LIVE).first().click();
  await page.getByText('Sair', { exact: true }).locator('visible=true').and(LIVE).first().click();
  await page.getByPlaceholder('Ex.: MACK-7KQ2P').fill('MACK2026');
  await page.getByPlaceholder('Como você quer aparecer').fill('Aluna Pessoal');
  await page.getByPlaceholder('ex.: ana.ribeiro').fill('aluna.pessoal');
  await page.getByPlaceholder('seu@email.com').fill('aluna@gmail.com');
  await page.getByPlaceholder('Mínimo de 8 caracteres').fill('aluna2026');
  await page.getByRole('button', { name: 'Escolher curso' }).click();
  await page.getByText('Outro curso (digitar)').click();
  await page.getByPlaceholder('Digite o nome do seu curso').fill('Gastronomia');
  await pickSemester('1º');
  await page.getByRole('switch').nth(0).click();
  await page.getByText('Entrar no Campus').click();
  await visible('Que bom ter você aqui, Aluna!');
  await page.getByText('Pular por agora').click();
  await visible('Confirme que você é aluno', { exact: false });
  await page.getByRole('button', { name: 'Criar publicação, Bora? ou evento' }).locator('visible=true').and(LIVE).first().click();
  await visible('Para publicar, confirme seu vínculo', { exact: false });
  await shot('12-nao-verificado');
});

await check('verificação pelo e-mail institucional no perfil', async () => {
  await page.goto(BASE + '/perfil');
  await visible('Vínculo não verificado');
  const inst = page.getByPlaceholder('voce@mackenzista.com.br').locator('visible=true').and(LIVE).first();
  await inst.fill('aluna@gmail.com');
  await page.getByText('Enviar código', { exact: true }).locator('visible=true').and(LIVE).first().click();
  await visible('Use um e-mail institucional', { exact: false });
  await inst.fill('teste@mackenzista.com.br');
  await page.getByText('Enviar código', { exact: true }).locator('visible=true').and(LIVE).first().click();
  await visible('já confirmou outra conta', { exact: false });
  await inst.fill('aluna@mackenzista.com.br');
  await page.getByText('Enviar código', { exact: true }).locator('visible=true').and(LIVE).first().click();
  const hint = await page.getByText('Modo demonstração: o código é', { exact: false }).locator('visible=true').and(LIVE).first().textContent();
  const demoCode = hint?.match(/\d{6}/)?.[0];
  if (!demoCode) throw new Error('código da demo não apareceu');
  const codeField = page.getByPlaceholder('000000').locator('visible=true').and(LIVE).first();
  await codeField.fill(demoCode === '000000' ? '111111' : '000000');
  await page.getByText('Confirmar vínculo').locator('visible=true').and(LIVE).first().click();
  await visible('Código incorreto', { exact: false });
  await codeField.fill(demoCode);
  await page.getByText('Confirmar vínculo').locator('visible=true').and(LIVE).first().click();
  await visible('Vínculo verificado');
  await visible('Verificado por aluna@mackenzista.com.br');
  await visible('@aluna.pessoal · Mackenzie · Gastronomia (1º sem.)', { exact: false });
  await shot('13-verificado');
});

await check('excluir conta (confirmação pelo nome de usuário)', async () => {
  await page.goto(BASE + '/perfil');
  await page.getByText('Excluir conta', { exact: true }).locator('visible=true').and(LIVE).first().click();
  const confirmBtn = page.getByRole('button', { name: 'Excluir para sempre' }).locator('visible=true').and(LIVE).first();
  const field = page.getByPlaceholder('aluna.pessoal').locator('visible=true').and(LIVE).first();
  await field.fill('outra.pessoa');
  if (!(await confirmBtn.isDisabled())) throw new Error('botão deveria ficar desativado com nome errado');
  await field.fill('@aluna.pessoal');
  await shot('14-excluir-conta');
  await confirmBtn.click();
  await visible('Tenho um convite');
  await page.getByText('Já tenho conta').click();
  await page.getByPlaceholder('seu@email.com').fill('aluna@gmail.com');
  await page.getByPlaceholder('Sua senha').fill('aluna2026');
  await page.getByText('Entrar no Campus').click();
  await visible('Não encontramos uma conta com esse e-mail neste aparelho.');
});

console.log(results.join('\n'));
const relevant = problems.filter((p) => !/Download the React DevTools|favicon/.test(p));
console.log(relevant.length ? `\nErros no navegador (${relevant.length}):\n` + [...new Set(relevant)].slice(0, 15).join('\n') : '\nSem erros no console do navegador.');
await browser.close();
process.exit(results.some((r) => r.includes('✘')) ? 1 : 0);
