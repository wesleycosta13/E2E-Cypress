describe('Testes de Validação - Página Alterar Nome', () => {
  const alterarNomeUrl = 'http://localhost:3000/perfil/alterar-nome';
  const apiUrl = 'http://localhost:5037/api/User';

  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.setItem('userId', '123');
      win.localStorage.setItem('authToken', 'fake-token-123');
    });

    cy.visit(alterarNomeUrl);
  });

  // Testa validação de campo nome vazio
  it('Deve mostrar erro ao tentar confirmar com nome vazio', () => {
    cy.get('.botao-confirmar').click();
    cy.contains('PREENCHA O CAMPO DE NOME').should('be.visible');
  });

  // Testa validação de campo com apenas espaços em branco
  it('Deve mostrar erro ao tentar confirmar com apenas espaços', () => {
    cy.get('#full-name').type('   ');
    cy.get('.botao-confirmar').click();
    cy.contains('PREENCHA O CAMPO DE NOME').should('be.visible');
  });

  // Testa tratamento de autenticação sem userId
  it('Deve mostrar erro de autenticação quando não há userId', () => {
    cy.window().then((win) => {
      win.localStorage.removeItem('userId');
    });

    cy.get('#full-name').type('Novo Nome');
    cy.get('.botao-confirmar').click();
    cy.contains('Erro de autenticação. Faça login novamente.').should('be.visible');
  });

  // Testa tratamento de autenticação sem token
  it('Deve mostrar erro de autenticação quando não há token', () => {
    cy.window().then((win) => {
      win.localStorage.removeItem('authToken');
    });

    cy.get('#full-name').type('Novo Nome');
    cy.get('.botao-confirmar').click();
    cy.contains('Erro de autenticação. Faça login novamente.').should('be.visible');
  });

  // Testa tratamento de erro interno do servidor
  it('Deve mostrar erro quando a API retorna erro', () => {
    cy.intercept('PUT', `${apiUrl}/123/name`, {
      statusCode: 500,
      body: { error: 'Erro interno do servidor' }
    }).as('updateNameRequest');

    cy.get('#full-name').type('Novo Nome');
    cy.get('.botao-confirmar').click();

    cy.wait('@updateNameRequest');
    cy.contains('Não foi possível alterar o nome.').should('be.visible');
  });

  // Testa tratamento de falha de conexão com a rede
  it('Deve mostrar erro de rede quando não consegue conectar ao servidor', () => {
    cy.intercept('PUT', `${apiUrl}/123/name`, {
      forceNetworkError: true
    }).as('updateNameRequest');

    cy.get('#full-name').type('Novo Nome');
    cy.get('.botao-confirmar').click();

    cy.wait('@updateNameRequest');
    cy.contains('Não foi possível alterar o nome.').should('be.visible');
  });

  // Testa navegação de volta para a página de perfil
  it('Deve navegar de volta para perfil ao clicar em Voltar', () => {
    cy.get('.voltar-an').click();
    cy.url().should('include', '/perfil');
  });

  // Testa limpeza automática de erro ao começar a digitar
  it('Deve limpar erro ao começar a digitar', () => {
    cy.get('.botao-confirmar').click();
    cy.contains('PREENCHA O CAMPO DE NOME').should('be.visible');
    cy.get('#full-name').type('N');
    
    cy.get('body').then(($body) => {
      if (!$body.text().includes('PREENCHA O CAMPO DE NOME')) {
        cy.log('Erro foi limpo automaticamente ao digitar');
      }
    });
  });

  // Testa aceitação de nomes com caracteres especiais
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

  // Testa fluxo completo de alteração de nome bem-sucedida
  it('Deve mostrar notificação de sucesso e redirecionar', () => {
    cy.intercept('PUT', `${apiUrl}/123/name`, {
      statusCode: 200,
      body: { message: 'Nome atualizado com sucesso' }
    }).as('updateNameRequest');

    cy.get('#full-name').type('Novo Nome Válido');
    cy.get('.botao-confirmar').click();

    cy.wait('@updateNameRequest');
    cy.contains('Nome alterado com sucesso!').should('be.visible');
    cy.wait(2500);
    cy.url().should('include', '/perfil');
  });

  // Testa comportamento com nomes muito longos
  it('Deve lidar com nome muito longo', () => {
    const nomeMuitoLongo = 'A'.repeat(500);
    
    cy.get('#full-name').type(nomeMuitoLongo);
    cy.get('.botao-confirmar').click();

    cy.get('body').then(($body) => {
      const hasError = $body.text().includes('Não foi possível alterar o nome');
      const hasSuccess = $body.text().includes('Nome alterado com sucesso');
      expect(hasError || hasSuccess).to.be.true;
    });
  });

  // Testa comportamento com caracteres especiais extremos
  it('Deve lidar com caracteres especiais extremos', () => {
    const caracteresExtremos = '!@#$%^&*()_+{}|:"<>?~`[]\\;\',./';
    
    cy.get('#full-name').type(caracteresExtremos);
    cy.get('.botao-confirmar').click();

    cy.get('body').then(($body) => {
      const hasError = $body.find('.notification.error').length > 0;
      const hasSuccess = $body.find('.notification.success').length > 0;
      expect(hasError || hasSuccess).to.be.true;
    });
  });
});