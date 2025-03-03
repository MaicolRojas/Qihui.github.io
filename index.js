let myChart = null;
        let pieChart = null;
        let hasCalculations = false;

        // Manejar cambio de pestañas
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;
                document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
                button.classList.add('active');
                document.getElementById(tabId).classList.add('active');
                
                // Resetear resultados
                resetResults();
            });
        });

        function resetResults() {
            hasCalculations = false;
            document.querySelector('.view-selector').style.display = 'none';
            document.getElementById('tablaResultados').style.display = 'none';
            document.getElementById('graficoVariacion').style.display = 'none';
            document.querySelector('.results-summary').style.display = 'none';
            document.querySelector('.pie-chart-container').style.display = 'none';
            document.querySelector('#tablaResultados tbody').innerHTML = '';
            if(myChart) myChart.destroy();
            if(pieChart) pieChart.destroy();
        }

        // Formatear moneda en inputs
        function formatearMoneda(input) {
            let valor = input.value.replace(/[^\d]/g, '');
            if(valor === '') {
                input.value = '';
                return;
            }
            
            const numero = Number(valor);
            input.value = numero.toLocaleString('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
        }

        // Convertir a número
        function convertirANumero(valorFormateado) {
            return Number(valorFormateado.replace(/[^\d]/g, '')) || 0;
        }

        // Actualizar gráfico de línea
        function updateChart(labels, data) {
            const ctx = document.getElementById('investmentChart').getContext('2d');
            
            if(myChart) myChart.destroy();

            myChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Valor de la Inversión',
                        data: data,
                        borderColor: '#2F80ED',
                        backgroundColor: 'rgba(47, 128, 237, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 3,
                        pointBackgroundColor: '#2F80ED'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            ticks: {
                                callback: function(value) {
                                    return value.toLocaleString('es-CO', {
                                        style: 'currency',
                                        currency: 'COP',
                                        minimumFractionDigits: 0
                                    });
                                }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.parsed.y.toLocaleString('es-CO', {
                                        style: 'currency',
                                        currency: 'COP',
                                        minimumFractionDigits: 0
                                    });
                                }
                            }
                        }
                    }
                }
            });
        }

        // Actualizar gráfico circular
        function updatePieChart(inicial, ganancias) {
            const ctx = document.getElementById('pieChart').getContext('2d');
            
            if(pieChart) pieChart.destroy();

            pieChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Inversión Inicial', 'Ganancias'],
                    datasets: [{
                        data: [inicial, ganancias],
                        backgroundColor: ['#2F80ED', '#4CAF50'],
                        borderWidth: 2,
                        borderColor: '#FFFFFF'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { 
                            position: 'bottom',
                            labels: {
                                usePointStyle: true,
                                padding: 20
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.label || '';
                                    if (label) label += ': ';
                                    if (context.parsed !== null) {
                                        const total = context.dataset.data.reduce((a, b) => a + b);
                                        const percentage = ((context.parsed / total) * 100).toFixed(2);
                                        label += ` (${percentage}%)`;
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        }

        // Cálculo por días
        function calcularInversion() {
            const inversionInicial = convertirANumero(document.getElementById("inversion").value);
            const dias = parseInt(document.getElementById("dias").value);

            if (!inversionInicial || !dias) {
                alert("Complete todos los campos");
                return;
            }

            const tbody = document.querySelector("#tablaResultados tbody");
            tbody.innerHTML = "";
            
            let saldo = inversionInicial;
            let gananciasTotales = 0;
            const profitDiario = 0.0058;
            const labels = [];
            const data = [];

            for (let dia = 1; dia <= dias; dia++) {
                const profit1 = saldo * profitDiario;
                const profit2 = (saldo + profit1) * profitDiario;
                const profit3 = (saldo + profit1 + profit2) * profitDiario;
                const totalGanadoDia = profit1 + profit2 + profit3;
                saldo += totalGanadoDia;
                gananciasTotales += totalGanadoDia;

                labels.push(`Día ${dia}`);
                data.push(saldo);

                const fila = document.createElement("tr");
                fila.innerHTML = `
                    <td>${dia}</td>
                    <td>${formatearMonedaTabla(inversionInicial)}</td>
                    <td>${formatearMonedaTabla(profit1)}</td>
                    <td>${formatearMonedaTabla(profit2)}</td>
                    <td>${formatearMonedaTabla(profit3)}</td>
                    <td>${formatearMonedaTabla(totalGanadoDia)}</td>
                    <td>${formatearMonedaTabla(saldo)}</td>
                `;
                tbody.appendChild(fila);
            }

            document.getElementById("inversion-total").textContent = formatearMonedaTabla(saldo);
            document.getElementById("ganancias-totales").textContent = formatearMonedaTabla(gananciasTotales);
            document.getElementById("dias-requeridos").textContent = dias;

            document.querySelector('.view-selector').style.display = 'flex';
            document.getElementById('tablaResultados').style.display = 'block';
            document.querySelector('.results-summary').style.display = 'block';
            document.querySelector('.pie-chart-container').style.display = 'block';
            hasCalculations = true;

            updateChart(labels, data);
            updatePieChart(inversionInicial, gananciasTotales);
        }

        // Cálculo por meta
        function calcularTiempoMeta() {
            const inversionInicial = convertirANumero(document.getElementById("inversion-meta").value);
            const meta = convertirANumero(document.getElementById("meta").value);
            
            if (!inversionInicial || !meta) {
                alert("Complete todos los campos");
                return;
            }

            if (meta <= inversionInicial) {
                alert("La meta debe ser mayor al monto inicial");
                return;
            }

            const tbody = document.querySelector("#tablaResultados tbody");
            tbody.innerHTML = "";
            
            let saldo = inversionInicial;
            let dia = 0;
            const profitDiario = 0.0058;
            const maxDias = 365 * 50;
            const labels = [];
            const data = [];
            let gananciasTotales = 0;

            while (saldo < meta && dia < maxDias) {
                dia++;
                const profit1 = saldo * profitDiario;
                const profit2 = (saldo + profit1) * profitDiario;
                const profit3 = (saldo + profit1 + profit2) * profitDiario;
                const totalGanadoDia = profit1 + profit2 + profit3;
                const saldoAnterior = saldo;
                saldo += totalGanadoDia;
                gananciasTotales += totalGanadoDia;

                labels.push(`Día ${dia}`);
                data.push(saldo);

                const fila = document.createElement("tr");
                fila.innerHTML = `
                    <td>${dia}</td>
                    <td>${formatearMonedaTabla(saldoAnterior)}</td>
                    <td>${formatearMonedaTabla(profit1)}</td>
                    <td>${formatearMonedaTabla(profit2)}</td>
                    <td>${formatearMonedaTabla(profit3)}</td>
                    <td>${formatearMonedaTabla(totalGanadoDia)}</td>
                    <td>${formatearMonedaTabla(saldo)}</td>
                `;
                tbody.appendChild(fila);
            }

            document.getElementById("inversion-total").textContent = formatearMonedaTabla(saldo);
            document.getElementById("ganancias-totales").textContent = formatearMonedaTabla(gananciasTotales);
            document.getElementById("dias-requeridos").textContent = dia;

            document.querySelector('.view-selector').style.display = 'flex';
            document.getElementById('tablaResultados').style.display = 'block';
            document.querySelector('.results-summary').style.display = 'block';
            document.querySelector('.pie-chart-container').style.display = 'block';
            hasCalculations = true;

            updateChart(labels, data);
            updatePieChart(inversionInicial, gananciasTotales);

            const modalIcon = document.getElementById('modalIcon');
            const modalTitle = document.getElementById('modalTitle');
            const modalContent = document.getElementById('modalContent');
            
            if (saldo >= meta) {
                modalIcon.className = 'fas fa-check-circle modal-icon';
                modalTitle.textContent = '🎉 Se alcanzara la Meta En:';
                modalContent.innerHTML = `
                    <p><strong>${dia}</strong> días</p>
                    <p>Saldo final: <strong>${formatearMonedaTabla(saldo)}</strong></p>
                `;
            } else {
                modalIcon.className = 'fas fa-times-circle modal-icon';
                modalTitle.textContent = '⏳ Meta No Alcanzada';
                modalContent.innerHTML = `
                    <p>Límite de <strong>${maxDias}</strong> días</p>
                    <p>Saldo final: <strong>${formatearMonedaTabla(saldo)}</strong></p>
                    <p style="color: #e53e3e; margin-top: 1rem;">
                        <i class="fas fa-exclamation-triangle"></i> Considera aumentar tu inversión
                    </p>
                `;
            }
            showModal();
        }

        // Selector de vistas
        document.querySelectorAll('.view-button').forEach(button => {
            button.addEventListener('click', () => {
                if(!hasCalculations) return;
                
                const view = button.dataset.view;
                document.querySelectorAll('.view-button').forEach(b => b.classList.remove('active'));
                button.classList.add('active');
                
                document.getElementById('tablaResultados').style.display = view === 'tabla' ? 'block' : 'none';
                document.getElementById('graficoVariacion').style.display = view === 'grafico' ? 'block' : 'none';
            });
        });

        // Formatear moneda para la tabla
        function formatearMonedaTabla(valor) {
            return valor.toLocaleString('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
        }

        // Manejo del modal
        function showModal() {
            document.getElementById('modalOverlay').style.display = 'flex';
        }

        function closeModal() {
            document.getElementById('modalOverlay').style.display = 'none';
        }

        document.getElementById('modalOverlay').addEventListener('click', (e) => {
            if(e.target === document.getElementById('modalOverlay')) closeModal();
        });

        document.addEventListener('keydown', (e) => {
            if(e.key === 'Escape') closeModal();
        });