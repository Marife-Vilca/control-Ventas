function exportarExcel() {
  if (typeof XLSX === "undefined") {
    alert("La librería de Excel no se ha cargado correctamente.");
    return;
  }

  if (!pedidos || pedidos.length === 0) {
    alert("No hay datos registrados para exportar.");
    return;
  }

  const datosExcel = pedidos.map((p, index) => {
    const direcciones = p.entregas
      .map(e => `${e.completado ? '[✓ Entregado]' : '[✗ Pendiente]'} ${e.lugar}: ${e.direccion} (${e.cantidad} pcs)`)
      .join(" | ");

    const estadoGeneral = calcularEstadoGeneral(p.entregas);

    return {
      "ID": String(index + 1).padStart(2, '0'),
      "Cliente": p.cliente,
      "Detalle de Entregas": direcciones,
      "Cantidad Total": p.cantidadTotal,
      "Precio Unitario": `S/ ${p.precioUnitario.toFixed(2)}`,
      "Monto Total": `S/ ${p.montoTotal.toFixed(2)}`,
      "Estado Pedido": estadoGeneral, 
      "Estado Pago": p.estadoPago,    
      "Fecha Registro": p.fecha
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(datosExcel);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Chuletadas");

  worksheet["!cols"] = [
    { wch: 6 },  
    { wch: 22 },
    { wch: 55 }, 
    { wch: 12 }, 
    { wch: 15 }, 
    { wch: 15 }, 
    { wch: 18 }, 
    { wch: 15 }, 
    { wch: 15 } 
  ];

  XLSX.writeFile(workbook, `Reporte_Chuletadas_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function exportarPDF() {
  if (typeof html2pdf === "undefined") {
    alert("La librería de PDF no se ha cargado correctamente.");
    return;
  }

  if (!pedidos || pedidos.length === 0) {
    alert("No hay datos registrados para generar el PDF.");
    return;
  }

  const elementoPDF = document.createElement("div");
  elementoPDF.style.padding = "20px";
  elementoPDF.style.fontFamily = "Arial, sans-serif";

  let filasHTML = pedidos.map((p, i) => {
    const idFormateado = String(i + 1).padStart(2, '0');
    const estadoGen = calcularEstadoGeneral(p.entregas);
    
    const direccResumen = p.entregas
      .map(e => `${e.completado ? '<b>✓</b> ' : ''}[${e.lugar}] ${e.direccion}`)
      .join('<br>');

    return `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 10px;">
        <td style="padding: 6px; text-align: center;">${idFormateado}</td>
        <td style="padding: 6px;"><strong>${p.cliente}</strong></td>
        <td style="padding: 6px; color: #475569;">${direccResumen}</td>
        <td style="padding: 6px; text-align: center;">${p.cantidadTotal}</td>
        <td style="padding: 6px; text-align: center; color: #1e8e3e; font-weight: bold;">S/ ${p.montoTotal.toFixed(2)}</td>
        <td style="padding: 6px; text-align: center;">${estadoGen}</td>
        <td style="padding: 6px; text-align: center;">${p.estadoPago}</td>
      </tr>
    `;
  }).join('');

  const totalMonto = pedidos.reduce((acc, p) => acc + p.montoTotal, 0);
  const totalCantidad = pedidos.reduce((acc, p) => acc + p.cantidadTotal, 0);

  elementoPDF.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #6b4423; padding-bottom: 10px; margin-bottom: 15px;">
      <div>
        <h2 style="margin: 0; color: #1e1b18; font-size: 18px;">Reporte de Control de Chuletadas</h2>
        <span style="font-size: 10px; color: #64748b;">Fecha de emisión: ${new Date().toLocaleDateString("es-PE")}</span>
      </div>
      <div style="text-align: right; font-size: 11px; color: #6b4423; font-weight: bold;">
        TOTAL RECAUDADO: S/ ${totalMonto.toFixed(2)}
      </div>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
      <thead>
        <tr style="background-color: #f8fafc; color: #64748b; font-size: 10px; text-align: left; border-bottom: 1px solid #cbd5e1;">
          <th style="padding: 6px; text-align: center;">ID</th>
          <th style="padding: 6px;">CLIENTE</th>
          <th style="padding: 6px;">LUGAR / DIRECCIÓN</th>
          <th style="padding: 6px; text-align: center;">CANT.</th>
          <th style="padding: 6px; text-align: center;">TOTAL</th>
          <th style="padding: 6px; text-align: center;">ESTADO</th>
          <th style="padding: 6px; text-align: center;">PAGO</th>
        </tr>
      </thead>
      <tbody>
        ${filasHTML}
      </tbody>
    </table>

    <div style="font-size: 10px; color: #475569; background: #f1f5f9; padding: 10px; border-radius: 6px;">
      <strong>Resumen:</strong> Total de Pedidos: ${pedidos.length} | Cantidad de Chuletadas: ${totalCantidad} pcs
    </div>
  `;

  const opciones = {
    margin: 10,
    filename: `Reporte_Chuletadas_${new Date().toISOString().slice(0, 10)}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opciones).from(elementoPDF).save();
}