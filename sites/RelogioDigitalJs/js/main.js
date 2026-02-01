function atualizarRelogio() {
      const agora = new Date();
      const opcoesHora = {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      };
      const horaBrasilia = agora.toLocaleTimeString('pt-BR', opcoesHora);

      const opcoesData = {
        timeZone: 'America/Sao_Paulo',
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      };
      const dataBrasilia = agora.toLocaleDateString('pt-BR', opcoesData);

      document.getElementById('relogio').textContent = horaBrasilia;
      document.getElementById('data').textContent = dataBrasilia;
    }

    setInterval(atualizarRelogio, 1000);
    atualizarRelogio();