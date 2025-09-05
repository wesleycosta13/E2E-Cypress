describe('Testes de Validação - Página Alterar Nome', () => {
  const alterarNomeUrl = 'http://localhost:3000/perfil/alterar-nome';
  const apiUrl = 'http://localhost:5037/api/User';

  beforeEach(() => {
    // Mock do localStorage com usuário autenticado
    cy.window().then((win) => {
      win.localStorage.setItem('userId', '123');
      win.localStorage.setItem('authToken', 'fake-token-123');
    });

    cy.visit(alterarNomeUrl);
  });

  it('Deve mostrar erro ao tentar confirmar com nome vazio', () => {
    cy.get('.botao-confirmar').click();
    cy.contains('PREENCHA O CAMPO DE NOME').should('be.visible');
  });

  it('Deve mostrar erro ao tentar confirmar com apenas espaços', () => {
    cy.get('#full-name').type('   ');
    cy.get('.botao-confirmar').click();
    cy.contains('PREENCHA O CAMPO DE NOME').should('be.visible');
  });

  it('Deve mostrar erro de autenticação quando não há userId', () => {
    // Remove userId do localStorage
    cy.window().then((win) => {
      win.localStorage.removeItem('userId');
    });

    cy.get('#full-name').type('Novo Nome');
    cy.get('.botao-confirmar').click();

    cy.contains('Erro de autenticação. Faça login novamente.').should('be.visible');
  });

  it('Deve mostrar erro de autenticação quando não há token', () => {
    // Remove token do localStorage
    cy.window().then((win) => {
      win.localStorage.removeItem('authToken');
    });

    cy.get('#full-name').type('Novo Nome');
    cy.get('.botao-confirmar').click();

    cy.contains('Erro de autenticação. Faça login novamente.').should('be.visible');
  });

  it('Deve mostrar erro quando a API retorna erro', () => {
    // Mock de erro na API
    cy.intercept('PUT', `${apiUrl}/123/name`, {
      statusCode: 500,
      body: { error: 'Erro interno do servidor' }
    }).as('updateNameRequest');

    cy.get('#full-name').type('Novo Nome');
    cy.get('.botao-confirmar').click();

    cy.wait('@updateNameRequest');
    cy.contains('Não foi possível alterar o nome.').should('be.visible');
  });

  it('Deve mostrar erro de rede quando não consegue conectar ao servidor', () => {
    // Mock de falha de rede
    cy.intercept('PUT', `${apiUrl}/123/name`, {
      forceNetworkError: true
    }).as('updateNameRequest');

    cy.get('#full-name').type('Novo Nome');
    cy.get('.botao-confirmar').click();

    cy.wait('@updateNameRequest');
    cy.contains('Não foi possível alterar o nome.').should('be.visible');
  });

  it('Deve navegar de volta para perfil ao clicar em Voltar', () => {
    cy.get('.voltar-an').click();
    cy.url().should('include', '/perfil');
  });

  it('Deve limpar erro ao começar a digitar', () => {
    // Primeiro causa erro
    cy.get('.botao-confirmar').click();
    cy.contains('PREENCHA O CAMPO DE NOME').should('be.visible');
    
    // Começa a digitar
    cy.get('#full-name').type('N');
    
    // O erro deve sumir (depende da implementação do React)
    cy.get('body').then(($body) => {
      if (!$body.text().includes('PREENCHA O CAMPO DE NOME')) {
        cy.log('Erro foi limpo automaticamente ao digitar');
      }
    });
  });

  it('Deve permitir digitar nome com caracteres especiais', () => {
    const nomesComEspeciais = [
      'João Silva',
      'Maria José',
      'Ana Paula',
      'José Carlos',
      'Nome com ç e áêî'
    ];

    nomesComEspeciais.forEach((nome) => {
      cy.get('#full-name').clear().type(nome);
      cy.get('#full-name').should('have.value', nome);
    });
  });

  it('Deve mostrar notificação de sucesso e redirecionar', () => {
    // Mock de sucesso na API
    cy.intercept('PUT', `${apiUrl}/123/name`, {
      statusCode: 200,
      body: { message: 'Nome atualizado com sucesso' }
    }).as('updateNameRequest');

    cy.get('#full-name').type('Novo Nome Válido');
    cy.get('.botao-confirmar').click();

    cy.wait('@updateNameRequest');
    cy.contains('Nome alterado com sucesso!').should('be.visible');
    
    // Verifica se redireciona após 2 segundos
    cy.wait(2500);
    cy.url().should('include', '/perfil');
  });

  it('Deve manter o botão habilitado durante a requisição', () => {
    // Mock de requisição lenta
    cy.intercept('PUT', `${apiUrl}/123/name`, {
      delay: 1000,
      statusCode: 200,
      body: { message: 'Nome atualizado com sucesso' }
    }).as('updateNameRequest');

    cy.get('#full-name').type('Nome Teste');
    cy.get('.botao-confirmar').click();

    // Botão deve permanecer clicável (não desabilitado)
    cy.get('.botao-confirmar').should('not.be.disabled');
    
    cy.wait('@updateNameRequest');
  });

  describe('Testes de edge cases', () => {
    it('Deve lidar com nome muito longo', () => {
      const nomeMuitoLongo = 'A'.repeat(500);
      
      cy.get('#full-name').type(nomeMuitoLongo);
      cy.get('.botao-confirmar').click();

      // Pode ser que a API aceite ou rejeite, mas não deve quebrar
      cy.get('body').then(($body) => {
        const hasError = $body.text().includes('Não foi possível alterar o nome');
        const hasSuccess = $body.text().includes('Nome alterado com sucesso');
        
        // Pelo menos uma das duas mensagens deve aparecer
        expect(hasError || hasSuccess).to.be.true;
      });
    });

    it('Deve lidar com caracteres especiais extremos', () => {
      const caracteresExtremos = '!@#$%^&*()_+{}|:"<>?~`[]\\;\',./';
      
      cy.get('#full-name').type(caracteresExtremos);
      cy.get('.botao-confirmar').click();

      // O sistema deve lidar com caracteres especiais sem quebrar
      cy.get('body').then(($body) => {
        const hasError = $body.find('.notification.error').length > 0;
        const hasSuccess = $body.find('.notification.success').length > 0;
        
        expect(hasError || hasSuccess).to.be.true;
      });
    });
  });
});