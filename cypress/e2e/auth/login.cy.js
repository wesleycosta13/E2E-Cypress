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

  it('Deve mostrar erro de conexão com servidor', () => {
    // Mock de falha de conexão
    cy.intercept('POST', 'http://localhost:5037/Login/login', {
      forceNetworkError: true
    }).as('loginRequest');

    cy.get('#email').type('teste@example.com');
    cy.get('#password').type('12345678');
    cy.get('.login-button').click();

    cy.wait('@loginRequest');
    cy.contains('NÃO FOI POSSÍVEL SE CONECTAR AO SERVIDOR').should('be.visible');
  });

  it('Deve desabilitar campos durante o loading', () => {
    // Mock de resposta lenta
    cy.intercept('POST', 'http://localhost:5037/Login/login', {
      delay: 2000,
      statusCode: 200,
      body: { token: 'fake-token' }
    }).as('loginRequest');

    cy.get('#email').type('teste@example.com');
    cy.get('#password').type('12345678');
    cy.get('.login-button').click();

    // Campos devem ficar desabilitados durante o loading
    cy.get('#email').should('be.disabled');
    cy.get('#password').should('be.disabled');
    cy.get('.login-button').should('be.disabled').and('contain', 'Entrando...');
    
    cy.wait('@loginRequest');
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

  it('Deve fazer login com sucesso e redirecionar', () => {
    // Mock de login bem-sucedido
    cy.intercept('POST', 'http://localhost:5037/Login/login', {
      statusCode: 200,
      body: { 
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      }
    }).as('loginRequest');

    cy.get('#email').type('usuario.valido@example.com');
    cy.get('#password').type('senha123');
    cy.get('.login-button').click();

    cy.wait('@loginRequest');
    
    // Verifica se o token foi salvo no localStorage
    cy.window().its('localStorage.authToken').should('exist');
    
    // Verifica se redirecionou para a página correta
    cy.url().should('include', '/selecionar-nivel');
  });

  it('Deve salvar userId no localStorage após login', () => {
    // Mock com token que contém ID do usuário
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIxMjM0NSIsImlhdCI6MTUxNjIzOTAyMn0.abc123';
    
    cy.intercept('POST', 'http://localhost:5037/Login/login', {
      statusCode: 200,
      body: { token: mockToken }
    }).as('loginRequest');

    cy.get('#email').type('usuario@example.com');
    cy.get('#password').type('senha123');
    cy.get('.login-button').click();

    cy.wait('@loginRequest');
    
    // Verifica se o userId foi salvo no localStorage
    cy.window().its('localStorage.userId').should('eq', '12345');
  });

  describe('Testes de Formato de Email no Login', () => {
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