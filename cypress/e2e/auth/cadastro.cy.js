describe('Testes de Validação - Página de Cadastro', () => {
  const baseUrl = 'http://localhost:3000/cadastro';

  beforeEach(() => {
    cy.visit(baseUrl);
  });

  // Testa validação de campos obrigatórios vazios
  it('Deve mostrar erro ao tentar cadastrar com campos vazios', () => {
    cy.get('.cadastro-button').click();
    cy.contains('Por favor, preencha todos os campos.').should('be.visible');
    
    cy.get('#name').type('Usuário Teste');
    cy.get('.cadastro-button').click();
    cy.contains('Por favor, preencha todos os campos.').should('be.visible');
  });

  // Testa validação de tamanho mínimo da senha
  it('Deve mostrar erro para senha com menos de 8 caracteres', () => {
    const senhasInvalidas = ['123', '1234', '12345', '123456', '1234567'];

    senhasInvalidas.forEach((senha) => {
      cy.visit(baseUrl);
      const nome = `Usuario${Math.random().toString(36).substring(2, 8)}`;
      const email = `teste${Date.now()}${Math.random().toString(36).substring(2, 6)}@example.com`;
      
      cy.get('#name').type(nome);
      cy.get('#email').type(email);
      cy.get('#password').type(senha);
      cy.get('#confirm-password').type(senha);
      cy.get('.cadastro-button').click();

      cy.contains('A senha deve ter no mínimo 8 caracteres.').should('be.visible');
    });
  });

  // Testa validação de confirmação de senha
  it('Deve mostrar erro quando senhas não coincidem', () => {
    cy.get('#name').type('Usuário Teste');
    cy.get('#email').type(`teste${Date.now()}@example.com`);
    cy.get('#password').type('12345678');
    cy.get('#confirm-password').type('87654321');
    cy.get('.cadastro-button').click();

    cy.contains('As senhas não coincidem!').should('be.visible');
  });

  // Testa fluxo completo de cadastro bem-sucedido
  it('Deve cadastrar com sucesso quando todos os campos são válidos', () => {
    const uniqueEmail = `cypress_${Date.now()}@example.com`;

    cy.get('#name').type('Wesley Costa');
    cy.get('#email').type(uniqueEmail);
    cy.get('#password').type('245172192');
    cy.get('#confirm-password').type('245172192');
    cy.get('.cadastro-button').click();

    cy.contains('Cadastro realizado com sucesso!').should('be.visible');
    cy.wait(2500);
    cy.url().should('include', '/login');
  });

  // Testa navegação de volta para a página de login
  it('Deve permitir navegar de volta para login', () => {
    cy.get('.back-button').click();
    cy.url().should('include', '/login');
  });

  // Testa funcionalidade de mostrar/esconder senha
  it('Deve alternar a visibilidade da senha', () => {
    cy.get('#password').type('minhasenha');
    cy.get('#password').should('have.attr', 'type', 'password');
    
    cy.get('.password-toggle-icon').first().click();
    cy.get('#password').should('have.attr', 'type', 'text');
    
    cy.get('.password-toggle-icon').first().click();
    cy.get('#password').should('have.attr', 'type', 'password');
  });
});

// Testes de validação de formato de email
describe('Testes de Formato de Email - Página de Cadastro', () => {
  const baseUrl = 'http://localhost:3000/cadastro';

  beforeEach(() => {
    cy.visit(baseUrl);
  });

  // Testa aceitação de emails com formato válido
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

  // Testa comportamento com emails de formato inválido
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

      cy.get('body').then(($body) => {
        const hasAnyError = $body.find('.notification.error').length > 0;
        if (hasAnyError) {
          cy.get('.notification.error').should('be.visible');
        }
      });
    });
  });
});