import Header from '../components/Header';

const DEVOCIONAIS = [
  {
    titulo: 'O Descanso que Deus Oferece',
    escritura: 'Mateus 11:28-30',
    passagem: '"Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos arei descanso. Tomai sobre vós o meu jugo e aprendei de mim, porque sou manso e humilde de coração, e achareis descanso para as vossas almas."',
    reflexao: 'Em um mundo que exalta a produtividade e condena o descanso, Jesus faz um convite radical: venha até Mim. Não como um último recurso, mas como o primeiro passo. O "jugo" que Jesus oferece não é pesado — é leve, porque Ele o carrega junto conosco. Quantas vezes carregamos cargas que Deus nunca nos pediu? O descanso verdadeiro não é inatividade; é confiar que Ele é suficiente.',
    oracao: 'Senhor, ensina-me a descansar em Ti. Que eu não tente carregar sozinho o que só você pode sustentar. Quero aprender da Tua mansidão e encontrar paz na Tua presença. Amém.',
  },
  {
    titulo: 'Confiar no Invisível',
    escritura: 'Hebreus 11:1',
    passagem: '"Ora, a fé é o firme fundamento das coisas que se esperam e a prova das coisas que se não vêem."',
    reflexao: 'A fé não é ingenuidade — é uma certeza baseada no caráter de Deus. Quando não conseguimos ver o caminho à frente, quando as circunstâncias parecem contradizer as promessas, a fé afirma: "Deus é fiel." Não porque a situação mudou, mas porque Ele não muda. A fé é um músculo que se fortalece exatamente quando é exercitado no escuro.',
    oracao: 'Pai, aumenta a minha fé. Quando não consigo ver o que Tu estás fazendo, ajuda-me a confiar no que sei sobre Quem és. Tu és fiel, ontem, hoje e sempre. Amém.',
  },
  {
    titulo: 'Gratidão como Estilo de Vida',
    escritura: '1 Tessalonicenses 5:18',
    passagem: '"Em tudo dai graças, porque esta é a vontade de Deus em Cristo Jesus para convosco."',
    reflexao: '"Em tudo" — não "por tudo", mas "em tudo". Deus não nos pede para fingir que a dor não existe. Ele nos convida a encontrar razões de gratidão mesmo dentro da dor. A gratidão muda nossa perspectiva: nos ajuda a ver a mão de Deus mesmo em dias difíceis. Uma vida de gratidão é um ato de fé que declara: "Deus está no controle."',
    oracao: 'Obrigado, Senhor, por cada detalhe da minha vida — os que entendo e os que ainda não entendo. Treina meu coração para enxergar Tua bondade em tudo. Amém.',
  },
  {
    titulo: 'Ser Luz no Mundo',
    escritura: 'Mateus 5:14-16',
    passagem: '"Vós sois a luz do mundo. Não se pode esconder uma cidade edificada sobre um monte... Assim resplandeça a vossa luz diante dos homens, para que vejam as vossas boas obras e glorifiquem a vosso Pai que está nos céus."',
    reflexao: 'Jesus não disse "sejam luz" — Ele disse "vós sois a luz". Não é algo que precisamos nos esforçar para nos tornar; é o que somos em Cristo. A questão é: estamos deixando essa luz brilhar? Muitas vezes o medo, a vergonha ou o conformismo nos fazem esconder nossa fé. Mas a luz foi feita para iluminar, não para se esconder.',
    oracao: 'Senhor, que minha vida seja um reflexo do Teu amor. Que minhas palavras, minhas escolhas e minha presença apontem para Ti. Quero ser luz onde há escuridão. Amém.',
  },
  {
    titulo: 'A Paz que Guarda o Coração',
    escritura: 'Filipenses 4:6-7',
    passagem: '"Não andeis ansiosos por coisa alguma; antes em tudo, pela oração e pela súplica, com ações de graças, apresentai os vossos pedidos a Deus. E a paz de Deus, que excede todo o entendimento, guardará os vossos corações e os vossos pensamentos em Cristo Jesus."',
    reflexao: 'A ansiedade é uma das epidemias da nossa geração. Paulo não nos diz para ignorá-la — ele nos diz para transformá-la em oração. Cada preocupação pode se tornar uma conversa com Deus. E o resultado? Uma paz que não tem lógica humana. Ela não depende das circunstâncias serem resolvidas — ela vem de saber que Deus está ouvindo.',
    oracao: 'Senhor, recebo hoje a Tua paz. Entrego cada ansiedade aos Teus pés e confio que Tu cuidas de mim. Guarda meu coração e minha mente em Cristo Jesus. Amém.',
  },
  {
    titulo: 'Renovação Diária',
    escritura: 'Lamentações 3:22-23',
    passagem: '"As misericórdias do Senhor são a causa de não sermos consumidos, porque as suas misericórdias não têm fim. Renovam-se cada manhã. Grande é a tua fidelidade."',
    reflexao: 'Cada manhã é uma nova página. Ontem pode ter sido um dia de falhas, de dúvidas, de queda — mas as misericórdias de Deus se renovam. Não semanalmente, não anualmente, mas CADA MANHÃ. Isso significa que hoje é uma nova oportunidade. Não carregue o peso de ontem para hoje. A fidelidade de Deus é maior que qualquer erro nosso.',
    oracao: 'Pai, obrigado pelas misericórdias renovadas desta manhã. Que eu não carregue o peso de ontem. Começo este dia em Tua graça e fidelidade. Amém.',
  },
  {
    titulo: 'Amor ao Próximo',
    escritura: 'João 13:34-35',
    passagem: '"Amai-vos uns aos outros; como eu vos amei, que também vós uns aos outros vos ameis. Nisto conhecerão todos que sois meus discípulos, se vos amardes uns aos outros."',
    reflexao: 'A marca de um seguidor de Jesus não é uma teologia perfeita ou um conhecimento bíblico profundo — é o amor. Um amor prático, visível, que as pessoas de fora conseguem enxergar. Jesus amou até quando custou. Quem ao redor de você precisa desse amor hoje? A resposta pode ser mais simples do que parece: uma ligação, uma palavra, uma presença.',
    oracao: 'Jesus, ensina-me a amar como Tu amas. Não apenas os que me amam de volta, mas os difíceis, os distantes, os esquecidos. Que o Teu amor flua através de mim hoje. Amém.',
  },
];

export default function Devocional() {
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 1)) / 86400000);
  const dev = DEVOCIONAIS[dayOfYear % DEVOCIONAIS.length];

  const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const dataStr = `${diasSemana[now.getDay()]}, ${now.getDate()} de ${meses[now.getMonth()]}`;

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <Header title="Devocional" backButton={true} />

      <main style={{ paddingTop: 'var(--spacing-md)' }}>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-md)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{dataStr}</p>

        {/* Título */}
        <section className="glass-card hero-card" style={{ marginBottom: 'var(--spacing-md)' }}>
          <span className="hero-tag">Devocional do Dia</span>
          <h1 className="hero-title" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.7rem', marginBottom: '8px', lineHeight: 1.2 }}>{dev.titulo}</h1>
          <p className="hero-time" style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="ph ph-book-bookmark"></i> {dev.escritura}
          </p>
        </section>

        {/* Passagem */}
        <section className="glass-card word-card" style={{ marginBottom: 'var(--spacing-md)' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '10px' }}>Passagem</p>
          <p style={{ fontStyle: 'italic', fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{dev.passagem}</p>
        </section>

        {/* Reflexão */}
        <section className="glass-card" style={{ marginBottom: 'var(--spacing-md)' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '12px' }}>Reflexão</p>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>{dev.reflexao}</p>
        </section>

        {/* Oração */}
        <section style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <i className="ph ph-hands-praying" style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}></i>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Oração do Dia</p>
          </div>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.8, fontStyle: 'italic' }}>{dev.oracao}</p>
        </section>

      </main>
    </div>
  );
}
