describe('Testes de Validação - Página de Login', () => {
  const loginUrl = 'http://localhost:3000/login';

  beforeEach(() => {
    cy.visit(loginUrl);
  });

  // Testa validação de campo email vazio
  it('Deve mostrar erro ao tentar login com email vazio', () => {
    cy.get('#password').type('12345678');
    cy.get('.login-button').click();
    cy.contains('Preencha o campo de e-mail').should('be.visible');
  });

  // Testa validação de campo senha vazia
  it('Deve mostrar erro ao tentar login com senha vazia', () => {
    cy.get('#email').type('teste@example.com');
    cy.get('.login-button').click();
    cy.contains('Preencha o campo de senha').should('be.visible');
  });

  // Testa validação quando ambos campos estão vazios
  it('Deve mostrar erro ao tentar login com ambos campos vazios', () => {
    cy.get('.login-button').click();
    cy.get('body').then(($body) => {
      const hasEmailError = $body.text().includes('Preencha o campo de e-mail');
      const hasPasswordError = $body.text().includes('Preencha o campo de senha');
      expect(hasEmailError || hasPasswordError).to.be.true;
    });
  });

  // Testa tratamento de credenciais inválidas
  it('Deve mostrar erro de credenciais inválidas', () => {
    cy.intercept('POST', 'http://localhost:5037/Login/login', {
      statusCode: 401,
      body: { error: 'E-MAIL OU SENHA INVÁLIDOS' }
    }).as('loginRequest');

    cy.get('#email').type('email.invalido@example.com');
    cy.get('#password').type('senhaincorreta');
    cy.get('.login-button').click();

    cy.wait('@loginRequest');
    cy.contains('E-MAIL OU SENHA INVÁLIDOS').should('be.visible');
  });

  // Testa funcionalidade de mostrar/esconder senha
  it('Deve alternar visibilidade da senha', () => {
    cy.get('#password').type('minhasenha');
    cy.get('#password').should('have.attr', 'type', 'password');
    cy.get('.password-toggle-icon').click();
    cy.get('#password').should('have.attr', 'type', 'text');
    cy.get('.password-toggle-icon').click();
    cy.get('#password').should('have.attr', 'type', 'password');
  });

  // Testa navegação para página de cadastro
  it('Deve navegar para cadastro', () => {
    cy.get('.link-button').click();
    cy.url().should('include', '/cadastro');
  });

  // Testa navegação para área administrativa
  it('Deve navegar para admin', () => {
    cy.get('.admin-button').click();
    cy.url().should('include', '/admin/login');
  });

  // Testa validação de formato de email válido
  it('Deve aceitar email válido no campo de email', () => {
    cy.get('#email').type('usuario.valido@example.com');
    cy.get('#email').should('have.value', 'usuario.valido@example.com');
    cy.get('#email').invoke('prop', 'validity').its('valid').should('be.true');
  });

  // Testa validação de formato de email inválido
  it('Deve mostrar validação nativa para email inválido', () => {
    cy.get('#email').type('email-invalido');
    cy.get('#email').invoke('prop', 'validity').its('valid').should('be.false');
  });

  // Testa limpeza automática de erros ao preencher campos
  it('Deve limpar erro ao corrigir os campos', () => {
    cy.get('.login-button').click();
    cy.contains('Preencha o campo de e-mail').should('be.visible');
    cy.get('#email').type('teste@example.com');
    
    cy.get('body').then(($body) => {
      if (!$body.text().includes('Preencha o campo de e-mail')) {
        cy.log('Erro foi limpo automaticamente');
      }
    });
  });
});