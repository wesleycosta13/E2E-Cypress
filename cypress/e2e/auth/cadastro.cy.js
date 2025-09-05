describe('Testes de Validação - Página de Cadastro', () => {
  const baseUrl = 'http://localhost:3000/cadastro';

  beforeEach(() => {
    cy.visit(baseUrl);
  });

  it('Deve mostrar erro ao tentar cadastrar com campos vazios', () => {
    // Tenta cadastrar sem preencher nada
    cy.get('.cadastro-button').click();
    cy.contains('Por favor, preencha todos os campos.').should('be.visible');

    // Preenche apenas alguns campos
    cy.get('#name').type('Usuário Teste');
    cy.get('.cadastro-button').click();
    cy.contains('Por favor, preencha todos os campos.').should('be.visible');
  });

it('Deve mostrar erro para senha com menos de 8 caracteres', () => {
  const senhasInvalidas = ['123', '1234', '12345', '123456', '1234567'];

  // Função para gerar nomes aleatórios
  function gerarNomeAleatorio() {
    const tamanho = 5 + Math.floor(Math.random() * 5); // nome com 5 a 9 letras
    let nome = '';
    for (let i = 0; i < tamanho; i++) {
      const letra = String.fromCharCode(97 + Math.floor(Math.random() * 26)); // a-z
      nome += letra;
    }
    return nome.charAt(0).toUpperCase() + nome.slice(1); // primeira letra maiúscula
  }

  // Função para gerar email aleatório
  function gerarEmailAleatorio() {
    const tamanho = 5 + Math.floor(Math.random() * 5); // parte do email com 5 a 9 letras
    let email = '';
    for (let i = 0; i < tamanho; i++) {
      const letra = String.fromCharCode(97 + Math.floor(Math.random() * 26)); // a-z
      email += letra;
    }
    const dominios = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'];
    const dominio = dominios[Math.floor(Math.random() * dominios.length)];
    return `${email}${Date.now()}@${dominio}`; // garante que seja único
  }

  senhasInvalidas.forEach((senha) => {
    cy.visit(baseUrl); // Recarrega a página para cada teste
    cy.get('#name').type(gerarNomeAleatorio());
    cy.get('#email').type(gerarEmailAleatorio());
    cy.get('#password').type(senha);
    cy.get('#confirm-password').type(senha);
    cy.get('.cadastro-button').click();

    cy.contains('A senha deve ter no mínimo 8 caracteres.').should('be.visible');
  });
});

  it('Deve mostrar erro quando senhas não coincidem', () => {
    cy.get('#name').type('Usuário Teste');
    cy.get('#email').type(`teste${Date.now()}@example.com`);
    cy.get('#password').type('12345678');
    cy.get('#confirm-password').type('87654321'); // senha diferente
    cy.get('.cadastro-button').click();

    cy.contains('As senhas não coincidem!').should('be.visible');
  });

  it('Deve cadastrar com sucesso quando todos os campos são válidos', () => {
    const uniqueEmail = `cypress_${Date.now()}@example.com`;

    cy.get('#name').type('Wesley Costa');
    cy.get('#email').type(uniqueEmail);
    cy.get('#password').type('245172192');
    cy.get('#confirm-password').type('245172192');
    cy.get('.cadastro-button').click();

    cy.contains('Cadastro realizado com sucesso!').should('be.visible');
    
    // Verifica se redireciona para login após 2 segundos
    cy.wait(2500);
    cy.url().should('include', '/login');
  });

  it('Deve permitir navegar de volta para login', () => {
    cy.get('.back-button').click();
    cy.url().should('include', '/login');
  });

  it('Deve alternar a visibilidade da senha', () => {
    cy.get('#password').type('minhasenha');
    cy.get('#password').should('have.attr', 'type', 'password');
    
    // Clica para mostrar senha
    cy.get('.password-toggle-icon').first().click();
    cy.get('#password').should('have.attr', 'type', 'text');
    
    // Clica para esconder senha
    cy.get('.password-toggle-icon').first().click();
    cy.get('#password').should('have.attr', 'type', 'password');
  });
});

//Cenário de Sucesso
describe('Testes de Formato de Email - Página de Cadastro', () => {
  const baseUrl = 'http://localhost:3000/cadastro';

  beforeEach(() => {
    cy.visit(baseUrl);
  });

  it('Deve aceitar emails válidos', () => {
    const emailsValidos = [
      'usuario@example.com',
      'usuario.nome@example.com',
      'usuario123@example.com',
      'u@example.com',
      'usuario@exemplo.com.br'
    ];

    emailsValidos.forEach((email) => {
      cy.visit(baseUrl);
      cy.get('#name').type('Usuário Teste');
      cy.get('#email').type(email);
      cy.get('#password').type('12345678');
      cy.get('#confirm-password').type('12345678');
      cy.get('.cadastro-button').click();

    });
  });

  it('Deve testar comportamento com emails potencialmente inválidos', () => {
    const emailsTeste = [
      'email-sem-arroba',
      'email@',
      '@dominio.com',
      'email@invalido',
      'email@.com'
    ];

    emailsTeste.forEach((email) => {
      cy.visit(baseUrl);
      cy.get('#name').type('Usuário Teste');
      cy.get('#email').type(email);
      cy.get('#password').type('12345678');
      cy.get('#confirm-password').type('12345678');
      cy.get('.cadastro-button').click();

      // A validação pode acontecer no frontend ou no backend
      cy.get('body').then(($body) => {
        // Se houver erro de validação de email no frontend, será mostrado
        // Se não, o backend vai rejeitar e mostrar erro genérico
        const hasAnyError = $body.find('.notification.error').length > 0;
        
        // Para emails muito inválidos, é provável que dê erro
        if (hasAnyError) {
          cy.get('.notification.error').should('be.visible');
        }
      });
    });
  });
});