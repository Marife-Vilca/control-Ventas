let pedidos = [];
let modalClienteInstance = null;
let modalDetalleInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  modalClienteInstance = new bootstrap.Modal(document.getElementById('modalCliente'));
  modalDetalleInstance = new bootstrap.Modal(document.getElementById('modalDetalle'));
  
  cargarPedidosLocalStorage();
  renderizarApp();
});

function cargarPedidosLocalStorage() {
  const data = localStorage.getItem("chuletadas_db");
  pedidos = data ? JSON.parse(data) : [];
}

function guardarLocalStorage() {
  localStorage.setItem("chuletadas_db", JSON.stringify(pedidos));
  renderizarApp();
}

function renderizarApp() {
  filtrarPedidos();
  actualizarEstadisticas();
}

function actualizarEstadisticas() {
  let totalChuletadas = 0;
  let pendientes = 0;
  let entregados = 0;
  let montoEsperado = 0;
  let totalCobrado = 0;
  let pendienteCobro = 0;

  pedidos.forEach(p => {
    totalChuletadas += p.cantidadTotal;
    montoEsperado += p.montoTotal;

    if (p.estadoPedido === "Pendiente") pendientes++;
    if (p.estadoPedido === "Entregado") entregados++;

    if (p.estadoPago === "Pagado") {
      totalCobrado += p.montoTotal;
    } else {
      pendienteCobro += p.montoTotal;
    }
  });

  document.getElementById("statTotalChuletadas").textContent = totalChuletadas;
  document.getElementById("statPendientes").textContent = pendientes;
  document.getElementById("statVendidos").textContent = entregados; // Muestra el total de entregados
  document.getElementById("statMontoEsperado").textContent = `S/ ${montoEsperado.toFixed(2)}`;
  document.getElementById("statTotalCobrado").textContent = `S/ ${totalCobrado.toFixed(2)}`;
  document.getElementById("statPendienteCobro").textContent = `S/ ${pendienteCobro.toFixed(2)}`;

  document.getElementById("dashTotalVendido").textContent = `S/ ${montoEsperado.toFixed(2)}`;
  document.getElementById("dashTotalCobrado").textContent = `S/ ${totalCobrado.toFixed(2)}`;
  document.getElementById("dashPendienteCobro").textContent = `S/ ${pendienteCobro.toFixed(2)}`;
  document.getElementById("dashTotalChuletadas").textContent = totalChuletadas;
  document.getElementById("dashClientes").textContent = pedidos.length;
  
  const promedio = pedidos.length > 0 ? (montoEsperado / pedidos.length) : 0;
  document.getElementById("dashPromedio").textContent = `S/ ${promedio.toFixed(2)}`;
}

function filtrarPedidos() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const filterEstado = document.getElementById("filterEstado").value;
  const filterPago = document.getElementById("filterPago").value;

  const resultado = pedidos.filter(p => {
    const cumpleCliente = p.cliente.toLowerCase().includes(search);
    const cumpleDireccion = p.entregas.some(e => 
      e.lugar.toLowerCase().includes(search) || e.direccion.toLowerCase().includes(search)
    );
    const cumpleBusqueda = cumpleCliente || cumpleDireccion;

    const cumpleEstado = filterEstado === "todos" || p.estadoPedido === filterEstado;
    const cumplePago = filterPago === "todos" || p.estadoPago === filterPago;

    return cumpleBusqueda && cumpleEstado && cumplePago;
  });

  const tbody = document.getElementById("tablaPedidosBody");
  tbody.innerHTML = "";

  if (resultado.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4 fs-11">No hay pedidos que coincidan con la búsqueda.</td></tr>`;
    return;
  }

  resultado.forEach((p, index) => {
    const tr = document.createElement("tr");

    // Badge para Estado de Pedido (Pendiente / Entregado)
    const badgeEstado = p.estadoPedido === "Entregado" 
      ? `<span class="pill-badge green"><span class="dot"></span>Entregado</span>`
      : `<span class="pill-badge yellow"><span class="dot"></span>Pendiente</span>`;

    // Badge para Estado de Pago
    const badgePago = p.estadoPago === "Pagado"
      ? `<span class="pill-badge blue"><span class="dot"></span>Pagado</span>`
      : `<span class="pill-badge red"><span class="dot"></span>No pagado</span>`;

    const idFormateado = String(index + 1).padStart(2, '0');
    const lugarPral = p.entregas[0] ? `[${p.entregas[0].lugar}] ${p.entregas[0].direccion}` : 'Sin dirección';

    tr.innerHTML = `
      <td class="ps-3 text-center text-secondary fw-500">${idFormateado}</td>
      <td><strong class="text-dark">${p.cliente}</strong></td>
      <td class="text-secondary" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${lugarPral}</td>
      <td class="text-center"><span class="qty-box">${p.cantidadTotal}</span></td>
      <td class="text-center fw-600 green-text">S/ ${p.montoTotal.toFixed(2)}</td>
      <td class="text-center cursor-pointer" onclick="alternarEstado('${p.id}', 'estadoPedido')">${badgeEstado}</td>
      <td class="text-center cursor-pointer" onclick="alternarEstado('${p.id}', 'estadoPago')">${badgePago}</td>
      <td class="pe-3 text-end">
        <div class="d-inline-flex gap-1">
          <button class="btn-action-icon" style="background:#f0f9ff; color:#0284c7;" onclick="verDetalle('${p.id}')" title="Ver detalle"><i class="fa-solid fa-eye"></i></button>
          <button class="btn-action-icon" style="background:#fefce8; color:#ca8a04;" onclick="editarPedido('${p.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-action-icon" onclick="eliminarPedido('${p.id}')" title="Eliminar"><i class="fa-solid fa-minus"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Cambia el estado de Pendiente a Entregado y de No pagado a Pagado al hacer clic
function alternarEstado(id, campo) {
  const p = pedidos.find(item => item.id === id);
  if (p) {
    if (campo === 'estadoPedido') {
      p.estadoPedido = p.estadoPedido === 'Pendiente' ? 'Entregado' : 'Pendiente';
    } else {
      p.estadoPago = p.estadoPago === 'No pagado' ? 'Pagado' : 'No pagado';
    }
    guardarLocalStorage();
    mostrarToast("Estado actualizado correctamente");
  }
}

function prepararNuevoPedido() {
  document.getElementById("formPedido").reset();
  document.getElementById("pedidoId").value = "";
  document.getElementById("precioUnitario").value = "18.00";
  document.getElementById("modalClienteLabel").textContent = "Nuevo Pedido";
  document.getElementById("contenedorEntregas").innerHTML = "";
  agregarFilaEntrega();
}

function agregarFilaEntrega(lugar = "Casa", direccion = "", cantidad = 1) {
  const container = document.getElementById("contenedorEntregas");
  const div = document.createElement("div");
  div.className = "row g-1 align-items-center mb-1 entrega-row";
  div.innerHTML = `
    <div class="col-4">
      <select class="form-select-compact lugar-input">
        <option value="Casa" ${lugar === 'Casa' ? 'selected' : ''}>Casa</option>
        <option value="Trabajo" ${lugar === 'Trabajo' ? 'selected' : ''}>Trabajo</option>
        <option value="Mercado" ${lugar === 'Mercado' ? 'selected' : ''}>Mercado</option>
        <option value="Otro" ${lugar === 'Otro' ? 'selected' : ''}>Otro</option>
      </select>
    </div>
    <div class="col-5">
      <input type="text" class="form-control-compact direccion-input" placeholder="Dirección" value="${direccion}" required>
    </div>
    <div class="col-2">
      <input type="number" class="form-control-compact cantidad-input" min="1" value="${cantidad}" oninput="recalcularTotalesFormulario()" required>
    </div>
    <div class="col-1 text-center">
      <button type="button" class="btn p-0 text-danger" onclick="eliminarFilaEntrega(this)"><i class="fa-solid fa-xmark"></i></button>
    </div>
  `;
  container.appendChild(div);
  recalcularTotalesFormulario();
}

function eliminarFilaEntrega(btn) {
  const container = document.getElementById("contenedorEntregas");
  if (container.children.length > 1) {
    btn.closest(".entrega-row").remove();
    recalcularTotalesFormulario();
  }
}

function recalcularTotalesFormulario() {
  const cantidades = document.querySelectorAll(".cantidad-input");
  let cantidadTotal = 0;
  cantidades.forEach(input => cantidadTotal += parseInt(input.value) || 0);

  const precio = parseFloat(document.getElementById("precioUnitario").value) || 0;
  const montoTotal = cantidadTotal * precio;

  document.getElementById("formCantidadTotal").textContent = cantidadTotal;
  document.getElementById("formMontoTotal").textContent = `S/ ${montoTotal.toFixed(2)}`;
}

function guardarPedido(e) {
  e.preventDefault();
  const id = document.getElementById("pedidoId").value;
  const cliente = document.getElementById("clienteNombre").value.trim();
  const precioUnitario = parseFloat(document.getElementById("precioUnitario").value) || 18.00;

  const filasEntrega = document.querySelectorAll(".entrega-row");
  const entregas = [];
  let cantidadTotal = 0;

  filasEntrega.forEach(f => {
    const lugar = f.querySelector(".lugar-input").value;
    const direccion = f.querySelector(".direccion-input").value.trim();
    const cantidad = parseInt(f.querySelector(".cantidad-input").value) || 0;

    entregas.push({ lugar, direccion, cantidad });
    cantidadTotal += cantidad;
  });

  const montoTotal = cantidadTotal * precioUnitario;

  if (id) {
    const index = pedidos.findIndex(p => p.id === id);
    if (index !== -1) {
      pedidos[index] = { ...pedidos[index], cliente, precioUnitario, cantidadTotal, montoTotal, entregas };
    }
  } else {
    pedidos.push({
      id: Date.now().toString(),
      cliente,
      precioUnitario,
      cantidadTotal,
      montoTotal,
      estadoPedido: "Pendiente",
      estadoPago: "No pagado",
      entregas,
      fecha: new Date().toLocaleDateString("es-PE")
    });
  }

  guardarLocalStorage();
  modalClienteInstance.hide();
  mostrarToast("Pedido guardado exitosamente");
}

function editarPedido(id) {
  const p = pedidos.find(item => item.id === id);
  if (!p) return;

  document.getElementById("pedidoId").value = p.id;
  document.getElementById("clienteNombre").value = p.cliente;
  document.getElementById("precioUnitario").value = p.precioUnitario;
  document.getElementById("modalClienteLabel").textContent = "Editar Pedido";

  const container = document.getElementById("contenedorEntregas");
  container.innerHTML = "";
  p.entregas.forEach(e => agregarFilaEntrega(e.lugar, e.direccion, e.cantidad));

  recalcularTotalesFormulario();
  modalClienteInstance.show();
}

function eliminarPedido(id) {
  if (confirm("¿Deseas eliminar este registro?")) {
    pedidos = pedidos.filter(p => p.id !== id);
    guardarLocalStorage();
    mostrarToast("Registro eliminado");
  }
}

function verDetalle(id) {
  const p = pedidos.find(item => item.id === id);
  if (!p) return;

  let entregasHTML = p.entregas.map((e, index) => `
    <div class="d-flex justify-content-between border-bottom py-1">
      <span><strong>#${index + 1} ${e.lugar}:</strong> ${e.direccion}</span>
      <span class="brown-text fw-600">${e.cantidad} chuletada(s)</span>
    </div>
  `).join('');

  document.getElementById("detalleBody").innerHTML = `
    <div class="mb-2"><strong>Cliente:</strong> ${p.cliente} <span class="text-secondary">(${p.fecha})</span></div>
    <div class="my-2">${entregasHTML}</div>
    <div class="d-flex justify-content-between fw-600 fs-12 mt-2 pt-2 border-top">
      <span>Total (${p.cantidadTotal} pcs × S/${p.precioUnitario}):</span>
      <span class="green-text">S/ ${p.montoTotal.toFixed(2)}</span>
    </div>
  `;
  modalDetalleInstance.show();
}

function mostrarToast(mensaje) {
  const box = document.getElementById("liveToast");
  document.getElementById("toastMessage").textContent = mensaje;
  box.classList.remove("d-none");
  setTimeout(() => box.classList.add("d-none"), 2000);
}