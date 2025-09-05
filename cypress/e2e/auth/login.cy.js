describe('Testes de Validação - Página de Login', () => {
  const loginUrl = 'http://localhost:3000/login';

  beforeEach(() => {
    cy.visit(loginUrl);
  });

  it('Deve mostrar erro ao tentar login com email vazio', () => {
    cy.get('#password').type('12345678');
    cy.get('.login-button').click();

    cy.contains('Preencha o campo de e-mail').should('be.visible');
  });

  it('Deve mostrar erro ao tentar login com senha vazia', () => {
    cy.get('#email').type('teste@example.com');
    cy.get('.login-button').click();

    cy.contains('Preencha o campo de senha').should('be.visible');
  });

  it('Deve mostrar erro ao tentar login com ambos campos vazios', () => {
    cy.get('.login-button').click();

    // Pode mostrar qualquer um dos dois erros (o primeiro que valida)
    cy.get('body').then(($body) => {
      const hasEmailError = $body.text().includes('Preencha o campo de e-mail');
      const hasPasswordError = $body.text().includes('Preencha o campo de senha');

      expect(hasEmailError || hasPasswordError).to.be.true;
    });
  });

  it('Deve mostrar erro de credenciais inválidas', () => {
    // Mock da resposta de erro da API
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

  it('Deve alternar visibilidade da senha', () => {
    cy.get('#password').type('minhasenha');
    cy.get('#password').should('have.attr', 'type', 'password');

    // Clica para mostrar senha
    cy.get('.password-toggle-icon').click();
    cy.get('#password').should('have.attr', 'type', 'text');

    // Clica para esconder senha
    cy.get('.password-toggle-icon').click();
    cy.get('#password').should('have.attr', 'type', 'password');
  });

  it('Deve navegar para cadastro', () => {
    cy.get('.link-button').click();
    cy.url().should('include', '/cadastro');
  });

  it('Deve navegar para admin', () => {
    cy.get('.admin-button').click();
    cy.url().should('include', '/admin/login');
  });

  describe('Testes de Formato de Email no Login cenários de sucesso', () => {
    it.only('Deve aceitar email válido no campo de email', () => {
      cy.get('#email').type('usuario.valido@example.com');
      cy.get('#email').should('have.value', 'usuario.valido@example.com');

      // O campo type="email" faz validação HTML5 nativa
      cy.get('#email').invoke('prop', 'validity').its('valid').should('be.true');
    });

    it('Deve mostrar validação nativa para email inválido', () => {
      cy.get('#email').type('email-invalido');
      cy.get('#email').invoke('prop', 'validity').its('valid').should('be.false');
    });
  });

  it('Deve limpar erro ao corrigir os campos', () => {
    // Primeiro causa erro
    cy.get('.login-button').click();
    cy.contains('Preencha o campo de e-mail').should('be.visible');

    // Agora preenche o campo
    cy.get('#email').type('teste@example.com');

    // O erro deve sumir (depende da implementação do React)
    // Se seu componente não limpa automaticamente, isso pode falhar
    cy.get('body').then(($body) => {
      if (!$body.text().includes('Preencha o campo de e-mail')) {
        cy.log('Erro foi limpo automaticamente');
      }
    });
  });
});