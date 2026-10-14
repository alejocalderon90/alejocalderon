'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const seed = [
    { id: 'DEMO-001', line: 'Línea A', shift: 'Mañana', planned: 1200, produced: 1160, rejected: 14, downtime: 10 },
    { id: 'DEMO-002', line: 'Línea B', shift: 'Mañana', planned: 1000, produced: 970, rejected: 9, downtime: 18 },
    { id: 'DEMO-003', line: 'Línea C', shift: 'Tarde', planned: 1500, produced: 1430, rejected: 40, downtime: 35 },
    { id: 'DEMO-004', line: 'Línea A', shift: 'Tarde', planned: 1200, produced: 1180, rejected: 10, downtime: 8 }
  ];
  let rows = seed.map(row => ({ ...row }));
  let pending;
  let sequence = 4;
  const number = new Intl.NumberFormat('es-AR');
  const percent = value => new Intl.NumberFormat('es-AR', { style: 'percent', maximumFractionDigits: 1 }).format(value);
  const render = () => {
    const filtered = rows.filter(row => $('filterLine').value === 'all' || row.line === $('filterLine').value);
    const totals = ProductionModel.summarize(filtered);
    $('goodKpi').textContent = number.format(totals.good);
    $('performanceKpi').textContent = percent(totals.performance);
    $('rejectKpi').textContent = percent(totals.rejection);
    $('downtimeKpi').textContent = number.format(totals.downtime);
    const lines = ['Línea A', 'Línea B', 'Línea C'].filter(line => $('filterLine').value === 'all' || line === $('filterLine').value);
    const groups = lines.map(line => ({ line, ...ProductionModel.summarize(filtered.filter(row => row.line === line)) }));
    const maximum = Math.max(1, ...groups.flatMap(group => [group.planned, group.produced]));
    $('productionChart').replaceChildren(...groups.map(group => {
      const node = document.createElement('div');
      node.className = 'chart-row';
      const label = document.createElement('span'); label.textContent = group.line; node.append(label);
      const bars = document.createElement('div'); bars.className = 'chart-bars';
      for (const key of ['planned', 'produced']) {
        const bar = document.createElement('div'); bar.className = `bar ${key}`;
        bar.style.setProperty('--width', `${group[key] / maximum * 100}%`);
        const count = document.createElement('span'); count.textContent = number.format(group[key]); bar.append(count); bars.append(bar);
      }
      node.append(bars); return node;
    }));
    $('productionChart').setAttribute('aria-label', groups.map(g => `${g.line}: ${g.planned} unidades planificadas y ${g.produced} producidas`).join('. '));
    $('records').replaceChildren(...filtered.slice().reverse().map(row => {
      const tr = document.createElement('tr');
      for (const value of [`${row.id} · ${row.shift}`, row.line, number.format(row.produced), `${number.format(row.rejected)} (${percent(row.rejected / row.produced)})`, `${row.downtime} min`]) {
        const td = document.createElement('td'); td.textContent = value; tr.append(td);
      }
      return tr;
    }));
    $('recordCount').textContent = `${filtered.length} registros aprobados`;
    $('dashboardStatus').textContent = filtered.length ? 'Indicadores calculados sobre los registros visibles.' : 'No hay registros aprobados para esta línea.';
  };
  const finish = approved => {
    if (!pending) return;
    const batch = pending; pending = undefined;
    if (approved) { rows.push(batch); render(); }
    $('review').hidden = true;
    $('batchForm').querySelector('button[type="submit"]').disabled = false;
    $('flowStatus').textContent = approved ? `${batch.id}: registro consolidado → indicadores actualizados. Si filtrás otra línea, cambiá el filtro para verlo.` : `${batch.id}: registro rechazado en revisión. No se incorporó al reporte.`;
  };
  $('batchForm').addEventListener('submit', event => {
    event.preventDefault();
    if (pending || !$('batchForm').reportValidity()) return;
    const data = new FormData(event.currentTarget);
    const batch = { line: data.get('line'), shift: data.get('shift'), reason: String(data.get('reason') || '').trim() };
    for (const key of ['planned', 'produced', 'rejected', 'downtime']) batch[key] = Number(data.get(key));
    try { ProductionModel.validate(batch); }
    catch (error) { $('flowStatus').textContent = error.message; return; }
    batch.id = `DEMO-${String(++sequence).padStart(3, '0')}`;
    pending = batch;
    if (ProductionModel.needsReview(batch)) {
      $('review').hidden = false;
      $('reviewText').textContent = `${batch.id} · ${batch.line}: ${percent(batch.rejected / batch.produced)} de rechazo y ${batch.downtime} minutos de parada. ${batch.reason || 'Sin observación adicional.'}`;
      $('flowStatus').textContent = 'Forms recibido → validación completada → pendiente de revisión. Los indicadores todavía no cambiaron.';
      $('batchForm').querySelector('button[type="submit"]').disabled = true;
      $('approve').focus();
    } else finish(true);
  });
  $('approve').addEventListener('click', () => finish(true));
  $('reject').addEventListener('click', () => finish(false));
  $('filterLine').addEventListener('change', render);
  $('deviationExample').addEventListener('click', () => {
    $('planned').value = 1200; $('produced').value = 1080; $('rejected').value = 45; $('downtime').value = 42;
    $('reason').value = 'Desvío de envasado detectado en el arranque del turno.';
    $('flowStatus').textContent = pending ? 'Hay una revisión pendiente. Resolvela antes de enviar otro lote.' : 'Ejemplo listo. Enviá el registro para activar la revisión.';
  });
  $('reset').addEventListener('click', () => {
    rows = seed.map(row => ({ ...row })); pending = undefined; sequence = 4;
    $('batchForm').reset(); $('filterLine').value = 'all'; $('review').hidden = true;
    $('batchForm').querySelector('button[type="submit"]').disabled = false;
    $('flowStatus').textContent = 'Demo reiniciada con cuatro lotes ficticios aprobados.'; render();
  });
  render();
})();
