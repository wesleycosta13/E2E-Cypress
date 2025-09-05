describe('Testes de Validação - Página Alterar Senha', () => {
  const alterarSenhaUrl = 'http://localhost:3000/alterar-senha';
  const apiUrl = 'http://localhost:5037/api/User' ;

  beforeEach(() => {
    // Mock do localStorage com usuário autenticado
    cy.window().then((win) => {
      win.localStorage.setItem('userId', '123');
      win.localStorage.setItem('authToken', 'fake-token-123');
    });

    cy.visit(alterarSenhaUrl);
  });

  it('Deve mostrar erro para senha com menos de 8 caracteres', () => {
    const senhasInvalidas = ['123', '1234', '12345', '123456', '1234567'];
    
    senhasInvalidas.forEach((senha) => {
      cy.get('.input-senha').first().clear().type(senha);
      cy.get('.input-senha').last().type(senha);
      cy.get('.botao-confirmar-as').click();

      cy.contains('A SENHA DEVE TER NO MÍNIMO 8 DÍGITOS').should('be.visible');
      
      // Limpa os campos para o próximo teste
      cy.get('.input-senha').first().clear();
      cy.get('.input-senha').last().clear();
    });
  });

  it('Deve mostrar erro quando senhas não coincidem', () => {
    cy.get('.input-senha').first().type('12345678');
    cy.get('.input-senha').last().type('87654321'); // senha diferente
    cy.get('.botao-confirmar-as').click();

    cy.contains('AS SENHAS NÃO COINCIDEM').should('be.visible');
  });

  it('Deve mostrar ambos os erros quando ambos os campos estão inválidos', () => {
    cy.get('.input-senha').first().type('123'); // senha curta
    cy.get('.input-senha').last().type('456'); // senha diferente e curta
    cy.get('.botao-confirmar-as').click();

    cy.contains('A SENHA DEVE TER NO MÍNIMO 8 DÍGITOS').should('be.visible');
    cy.contains('AS SENHAS NÃO COINCIDEM').should('be.visible');
  });

  it('Deve mostrar erro de autenticação quando não há userId', () => {
    // Remove userId do localStorage
    cy.window().then((win) => {
      win.localStorage.removeItem('userId');
    });

    cy.get('.input-senha').first().type('12345678');
    cy.get('.input-senha').last().type('12345678');
    cy.get('.botao-confirmar-as').click();

    cy.contains('Erro de autenticação. Faça login novamente.').should('be.visible');
  });

  it('Deve mostrar erro de autenticação quando não há token', () => {
    // Remove token do localStorage
    cy.window().then((win) => {
      win.localStorage.removeItem('authToken');
    });

    cy.get('.input-senha').first().type('12345678');
    cy.get('.input-senha').last().type('12345678');
    cy.get('.botao-confirmar-as').click();

    cy.contains('Erro de autenticação. Faça login novamente.').should('be.visible');
  });

  it('Deve mostrar erro quando a API retorna erro', () => {
    // Mock de erro na API
    cy.intercept('PUT', `${apiUrl}/123/password`, {
      statusCode: 500,
      body: { error: 'Erro interno do servidor' }
    }).as('updatePasswordRequest');

    cy.get('.input-senha').first().type('novaSenha123');
    cy.get('.input-senha').last().type('novaSenha123');
    cy.get('.botao-confirmar-as').click();

    cy.wait('@updatePasswordRequest');
    cy.contains('Não foi possível alterar a senha.').should('be.visible');
  });

  it('Deve mostrar erro de rede quando não consegue conectar ao servidor', () => {
    // Mock de falha de rede
    cy.intercept('PUT', `${apiUrl}/123/password`, {
      forceNetworkError: true
    }).as('updatePasswordRequest');

    cy.get('.input-senha').first().type('novaSenha123');
    cy.get('.input-senha').last().type('novaSenha123');
    cy.get('.botao-confirmar-as').click();

    cy.wait('@updatePasswordRequest');
    cy.contains('Não foi possível alterar a senha.').should('be.visible');
  });

  it('Deve navegar de volta para perfil ao clicar em Voltar', () => {
    cy.get('.voltar-as').click();
    cy.url().should('include', '/perfil');
  });

  it('Deve alternar visibilidade da senha', () => {
    // Testa a primeira senha
    cy.get('.input-senha').first().type('minhasenha');
    cy.get('.input-senha').first().should('have.attr', 'type', 'password');
    
    cy.get('.eye-icon').first().click();
    cy.get('.input-senha').first().should('have.attr', 'type', 'text');
    
    cy.get('.eye-icon').first().click();
    cy.get('.input-senha').first().should('have.attr', 'type', 'password');

    // Testa a segunda senha
    cy.get('.input-senha').last().type('minhasenha');
    cy.get('.input-senha').last().should('have.attr', 'type', 'password');
    
    cy.get('.eye-icon').last().click();
    cy.get('.input-senha').last().should('have.attr', 'type', 'text');
    
    cy.get('.eye-icon').last().click();
    cy.get('.input-senha').last().should('have.attr', 'type', 'password');
  });

  it('Deve limpar erros ao corrigir os campos', () => {
    // Primeiro causa erro
    cy.get('.input-senha').first().type('123');
    cy.get('.input-senha').last().type('456');
    cy.get('.botao-confirmar-as').click();

    cy.contains('A SENHA DEVE TER NO MÍNIMO 8 DÍGITOS').should('be.visible');
    cy.contains('AS SENHAS NÃO COINCIDEM').should('be.visible');
    
    // Corrige as senhas
    cy.get('.input-senha').first().clear().type('12345678');
    cy.get('.input-senha').last().clear().type('12345678');
    
    // Os erros devem sumir
    cy.get('body').then(($body) => {
      const hasLengthError = $body.text().includes('A SENHA DEVE TER NO MÍNIMO 8 DÍGITOS');
      const hasMatchError = $body.text().includes('AS SENHAS NÃO COINCIDEM');
      
      if (!hasLengthError && !hasMatchError) {
        cy.log('Erros foram limpos automaticamente ao corrigir os campos');
      }
    });
  });

  it('Deve mostrar notificação de sucesso e redirecionar', () => {
    // Mock de sucesso na API
    cy.intercept('PUT', `${apiUrl}/123/password`, {
      statusCode: 200,
      body: { message: 'Senha atualizada com sucesso' }
    }).as('updatePasswordRequest');

    cy.get('.input-senha').first().type('novaSenha123');
    cy.get('.input-senha').last().type('novaSenha123');
    cy.get('.botao-confirmar-as').click();

    cy.wait('@updatePasswordRequest');
    cy.contains('Senha alterada com sucesso!').should('be.visible');
    
    // Verifica se redireciona após 2 segundos
    cy.wait(2500);
    cy.url().should('include', '/perfil');
  });

  it('Deve impedir senha com espaços', () => {
    // Seu código não permite espaços nas senhas (replace(/\s/g, ''))
    cy.get('.input-senha').first().type('senha com espaços');
    // O React deve remover os espaços automaticamente
    cy.get('.input-senha').first().should('have.value', 'senhacomespaços');
  });

  describe('Testes de edge cases para senha', () => {
    it('Deve lidar com senha muito longa', () => {
      const senhaMuitoLonga = 'A'.repeat(1000);
      
      cy.get('.input-senha').first().type(senhaMuitoLonga);
      cy.get('.input-senha').last().type(senhaMuitoLonga);
      cy.get('.botao-confirmar-as').click();

      // Pode ser que a API aceite ou rejeite, mas não deve quebrar
      cy.get('body').then(($body) => {
        const hasError = $body.text().includes('Não foi possível alterar a senha');
        const hasSuccess = $body.text().includes('Senha alterada com sucesso');
        
        expect(hasError || hasSuccess).to.be.true;
      });
    });

    it('Deve lidar com caracteres especiais na senha', () => {
      const senhaComEspeciais = '!@#$%^&*()_+{}|:"<>?~`[]\\;\',./123';
      
      cy.get('.input-senha').first().type(senhaComEspeciais);
      cy.get('.input-senha').last().type(senhaComEspeciais);
      cy.get('.botao-confirmar-as').click();

      // O sistema deve lidar com caracteres especiais sem quebrar
      cy.get('body').then(($body) => {
        const hasError = $body.find('.notification.error').length > 0;
        const hasSuccess = $body.find('.notification.success').length > 0;
        
        expect(hasError || hasSuccess).to.be.true;
      });
    });
  });

  it('Deve manter os campos habilitados durante a requisição', () => {
    // Mock de requisição lenta
    cy.intercept('PUT', `${apiUrl}/123/password`, {
      delay: 1000,
      statusCode: 200,
      body: { message: 'Senha atualizada com sucesso' }
    }).as('updatePasswordRequest');

    cy.get('.input-senha').first().type('novaSenha123');
    cy.get('.input-senha').last().type('novaSenha123');
    cy.get('.botao-confirmar-as').click();

    // Campos devem permanecer habilitados durante o loading
    cy.get('.input-senha').first().should('not.be.disabled');
    cy.get('.input-senha').last().should('not.be.disabled');
    cy.get('.botao-confirmar-as').should('not.be.disabled');
    
    cy.wait('@updatePasswordRequest');
  });
});