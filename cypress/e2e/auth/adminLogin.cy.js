describe('Testes de Login Administrativo', () => {
  const adminLoginUrl = 'http://localhost:3000/admin/login';

  beforeEach(() => {
    cy.visit(adminLoginUrl);
  });

  // Testa validação de campos obrigatórios - todos vazios
  it('Deve mostrar erro ao tentar login com campos vazios', () => {
    cy.get('.login-button').click();
    cy.contains('PREENCHA OS CAMPOS DE E-MAIL E SENHA!').should('be.visible');
  });

  // Testa validação de campo email vazio
  it('Deve mostrar erro ao tentar login com email vazio', () => {
    cy.get('#password').type('senha123');
    cy.get('.login-button').click();
    cy.contains('PREENCHA OS CAMPOS DE E-MAIL E SENHA!').should('be.visible');
  });

  // Testa validação de campo senha vazia
  it('Deve mostrar erro ao tentar login com senha vazia', () => {
    cy.get('#email').type('admin@email.com');
    cy.get('.login-button').click();
    cy.contains('PREENCHA OS CAMPOS DE E-MAIL E SENHA!').should('be.visible');
  });

  // Testa bloqueio de acesso para usuários não administradores
  it('Deve bloquear acesso para usuário comum', () => {
    cy.intercept('POST', 'http://localhost:5037/Login/login', {
      statusCode: 200,
      body: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiVXNlciIsImlhdCI6MTUxNjIzOTAyMn0.abc123'
      }
    }).as('loginRequest');

    cy.get('#email').type('usuario@email.com');
    cy.get('#password').type('senha123');
    cy.get('.login-button').click();

    cy.wait('@loginRequest');
    cy.contains('Acesso negado. Esta área é restrita para administradores.').should('be.visible');
  });

  // Testa tratamento de credenciais inválidas
  it('Deve mostrar erro para credenciais inválidas', () => {
    cy.intercept('POST', 'http://localhost:5037/Login/login', {
      statusCode: 401,
      body: { error: 'Credenciais inválidas' }
    }).as('loginRequest');

    cy.get('#email').type('admin@invalido.com');
    cy.get('#password').type('senhaerrada');
    cy.get('.login-button').click();

    cy.wait('@loginRequest');
    cy.contains('CREDENCIAS DE ADMINISTRADOR INVÁLIDAS').should('be.visible');
  });

  // Teste completo de fluxo de login bem-sucedido com dados do fixture
  it.only('Deve permitir acesso para administrador', () => {
    cy.fixture('auth/admin.json').then((adminData) => {
      const admin = adminData.admin;

      cy.intercept('POST', 'http://localhost:5037/Login/login', {
        statusCode: 200,
        body: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiQWRtaW4iLCJuYW1laWQiOiIxMjMiLCJpYXQiOjE1MTYyMzkwMjJ9.def456'
        }
      }).as('loginRequest');

      cy.get('#email').type(admin.email);
      cy.get('#password').type(admin.password);
      cy.get('.login-button').click();

      cy.wait('@loginRequest');
      cy.window().its('localStorage.adminAuthToken').should('exist');
      cy.window().its('localStorage.adminId').should('eq', '123');
      cy.url().should('include', '/admin/dashboard');
      cy.get('.nav-button-dash').click();
      cy.url().should('include', '/login');
    });
  });

  // Testa navegação de volta para a página de login principal
  it('Deve navegar de volta para login principal', () => {
    cy.get('.back-button').click();
    cy.url().should('include', '/login');
  });

  // Testa funcionalidade de mostrar/esconder senha
  it('Deve alternar visibilidade da senha', () => {
    cy.get('#password').type('admin123');
    cy.get('#password').should('have.attr', 'type', 'password');
    cy.get('.password-toggle-icon').click();
    cy.get('#password').should('have.attr', 'type', 'text');
    cy.get('.password-toggle-icon').click();
    cy.get('#password').should('have.attr', 'type', 'password');
  });

  // Testa tratamento de erro de conexão com a rede
  it('Deve lidar com erro de rede', () => {
    cy.intercept('POST', 'http://localhost:5037/Login/login', {
      forceNetworkError: true
    }).as('loginRequest');

    cy.get('#email').type('admin@email.com');
    cy.get('#password').type('senha123');
    cy.get('.login-button').click();

    cy.wait('@loginRequest');
    cy.contains('CREDENCIAS DE ADMINISTRADOR INVÁLIDAS').should('be.visible');
  });
});