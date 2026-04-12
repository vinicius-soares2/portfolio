let dividas = JSON.parse(localStorage.getItem('dividas')) || [];

    function salvar() {
      localStorage.setItem('dividas', JSON.stringify(dividas));
    }

    function formatarMoeda(valor) {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    }

    function adicionarDivida() {
      const nome = document.getElementById('nome').value.trim();
      const valor = parseFloat(document.getElementById('valor').value);
      const vencimento = document.getElementById('vencimento').value;
      const juros = parseFloat(document.getElementById('juros').value) || 0;

      if (!nome || !valor) {
        alert("Preencha pelo menos o nome e o valor da dívida!");
        return;
      }

      dividas.push({ nome, valor, vencimento, juros });
      salvar();
      atualizarTabela();
      limparFormulario();
    }

    function removerDivida(index) {
      dividas.splice(index, 1);
      salvar();
      atualizarTabela();
    }

    function atualizarTabela() {
      const tbody = document.getElementById('tabela-dividas');
      tbody.innerHTML = '';

      let total = 0;
      let totalComJuros = 0;

      dividas.forEach((d, index) => {
        const jurosMensal = d.valor * (d.juros / 100);
        const valorComJuros = d.valor + jurosMensal;

        total += d.valor;
        totalComJuros += valorComJuros;

        tbody.innerHTML += `
          <tr class="debt-row border-b border-zinc-800">
            <td class="py-4">${d.nome}</td>
            <td class="py-4">${formatarMoeda(d.valor)}</td>
            <td class="py-4">${d.vencimento || '-'}</td>
            <td class="py-4">${d.juros}%</td>
            <td class="py-4 font-medium">${formatarMoeda(valorComJuros)}</td>
            <td class="py-4 text-center">
              <button onclick="removerDivida(${index})" class="text-red-500 hover:text-red-400">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>`;
      });

      document.getElementById('total-dividas').textContent = dividas.length;
      document.getElementById('total-valor').textContent = formatarMoeda(total);
      document.getElementById('total-com-juros').textContent = formatarMoeda(totalComJuros);
    }

    function limparFormulario() {
      document.getElementById('nome').value = '';
      document.getElementById('valor').value = '';
      document.getElementById('vencimento').value = '';
      document.getElementById('juros').value = '0';
    }

    function gerarPDF() {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.text("Relatório de Gestão de Dívidas", 20, 20);
      doc.setFontSize(12);
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 35);

      let y = 50;
      let total = 0;
      let totalJuros = 0;

      dividas.forEach(d => {
        const juros = d.valor * (d.juros / 100);
        const comJuros = d.valor + juros;
        total += d.valor;
        totalJuros += comJuros;

        doc.text(`${d.nome}`, 20, y);
        doc.text(`${formatarMoeda(d.valor)}`, 120, y);
        doc.text(`Juros: ${d.juros}%`, 170, y);
        y += 10;
      });

      y += 10;
      doc.setFontSize(14);
      doc.text(`Total de Dívidas: ${dividas.length}`, 20, y);
      y += 10;
      doc.text(`Valor Total: ${formatarMoeda(total)}`, 20, y);
      y += 10;
      doc.text(`Valor Estimado com Juros: ${formatarMoeda(totalJuros)}`, 20, y);

      doc.save("Relatorio_Dividas.pdf");
    }

    // Inicializa a página
    atualizarTabela();