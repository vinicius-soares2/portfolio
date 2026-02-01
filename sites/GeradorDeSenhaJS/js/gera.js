    function gerarSenha(length = 12, includeLower = true, includeSymbols = false) {
      const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const digits = "0123456789";
      const lower = includeLower ? "abcdefghijklmnopqrstuvwxyz" : "";
      const symbols = includeSymbols ? "!@#$%&*()-_=+[]{}:;?<>/\\\\|~" : "";

      const pool = upper + digits + lower + symbols;
      if (!pool) return "Erro: nenhum conjunto habilitado";

      let senha = [];
      // garantir pelo menos 1 maiúscula e 1 número
      senha.push(upper[Math.floor(Math.random() * upper.length)]);
      senha.push(digits[Math.floor(Math.random() * digits.length)]);

      for (let i = 2; i < length; i++) {
        senha.push(pool[Math.floor(Math.random() * pool.length)]);
      }

      // embaralhar Fisher-Yates
      for (let i = senha.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [senha[i], senha[j]] = [senha[j], senha[i]];
      }

      return senha.join("");
    }

    const btnGerar = document.getElementById('gerar');
    const btnCopiar = document.getElementById('copiar');
    const resultado = document.getElementById('resultado');
    const status = document.getElementById('status');

    btnGerar.addEventListener('click', () => {
      const length = parseInt(document.getElementById('length').value) || 12;
      const includeLower = document.getElementById('lower').checked;
      const includeSymbols = document.getElementById('symbols').checked;

      const senha = gerarSenha(length, includeLower, includeSymbols);
      resultado.textContent = senha;
      status.textContent = '';
      btnCopiar.disabled = false;
    });

    btnCopiar.addEventListener('click', async () => {
      const text = resultado.textContent;
      if (!text || text === '—' || text.startsWith('Erro')) return;

      // Tenta usar a API clipboard (mais segura e amigável)
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback para navegadores antigos
          const ta = document.createElement('textarea');
          ta.value = text;
          // evitar scroll para o usuário
          ta.style.position = 'fixed';
          ta.style.left = '-9999px';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        status.textContent = 'Copiado para a área de transferência ✅';
        // limpar mensagem depois de 2.5s
        setTimeout(() => (status.textContent = ''), 2500);
      } catch (err) {
        console.error('Erro ao copiar:', err);
        status.textContent = 'Não foi possível copiar — permita o uso da área de transferência.';
        setTimeout(() => (status.textContent = ''), 4000);
      }
    });