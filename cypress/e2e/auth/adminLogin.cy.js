describe('Testes de Login Administrativo', () => {
    const adminLoginUrl = 'http://localhost:3000/admin/login';

    beforeEach(() => {
        cy.visit(adminLoginUrl);
    });

    it('Deve mostrar erro ao tentar login com campos vazios', () => {
        cy.get('.login-button').click();
        cy.contains('PREENCHA OS CAMPOS DE E-MAIL E SENHA!').should('be.visible');
    });

    it('Deve mostrar erro ao tentar login com email vazio', () => {
        cy.get('#password').type('senha123');
        cy.get('.login-button').click();
        cy.contains('PREENCHA OS CAMPOS DE E-MAIL E SENHA!').should('be.visible');
    });

    it('Deve mostrar erro ao tentar login com senha vazia', () => {
        cy.get('#email').type('admin@email.com');
        cy.get('.login-button').click();
        cy.contains('PREENCHA OS CAMPOS DE E-MAIL E SENHA!').should('be.visible');
    });

    it('Deve bloquear acesso para usuário comum', () => {
        // Mock de resposta para usuário comum (role = User)
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

    it('Deve mostrar erro para credenciais inválidas', () => {
        // Mock de erro de login
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

    describe('Teste de Login com dados do Fixture - Cenário de sucesso', () => {
        it.only('Deve permitir acesso para administrador', () => {
            // Primeiro carrega os dados do fixture
            cy.fixture('auth/admin.json').then((adminData) => {
                const admin = adminData.admin;

                // Mock a resposta da API com base nos dados reais
                cy.intercept('POST', 'http://localhost:5037/Login/login', {
                    statusCode: 200,
                    body: {
                        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiQWRtaW4iLCJuYW1laWQiOiIxMjMiLCJpYXQiOjE1MTYyMzkwMjJ9.def456'
                    }
                }).as('loginRequest');

                // Usa os dados do JSON para preencher o formulário
                cy.get('#email').type(admin.email);
                cy.get('#password').type(admin.password);
                cy.get('.login-button').click();

                cy.wait('@loginRequest');

                // Verifica se salvou no localStorage
                cy.window().its('localStorage.adminAuthToken').should('exist');
                cy.window().its('localStorage.adminId').should('eq', '123');

                // VERIFICA SE REDIRECIONOU
                cy.url().should('include', '/admin/dashboard');

                // CLICA NO BOTÃO - correto
                cy.get('.nav-button-dash').click();

                // VERIFICA SE FOI PARA LOGIN - correto  
                cy.url().should('include', '/login');
            });
        });
    });

    it('Deve navegar de volta para login principal', () => {
        cy.get('.back-button').click();
        cy.url().should('include', '/login');
    });

    it('Deve alternar visibilidade da senha', () => {
        cy.get('#password').type('admin123');
        cy.get('#password').should('have.attr', 'type', 'password');

        cy.get('.password-toggle-icon').click();
        cy.get('#password').should('have.attr', 'type', 'text');

        cy.get('.password-toggle-icon').click();
        cy.get('#password').should('have.attr', 'type', 'password');
    });

    it('Deve lidar com erro de rede', () => {
        // Mock de falha de rede
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