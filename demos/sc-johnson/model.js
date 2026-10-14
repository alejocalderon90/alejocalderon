'use strict';
const ProductionModel = (() => {
  const validate = row => {
    for (const key of ['planned', 'produced', 'rejected', 'downtime']) {
      if (!Number.isSafeInteger(row[key]) || row[key] < 0) throw new Error('Completá los valores con números enteros válidos.');
    }
    if (row.planned < 1 || row.produced < 1 || row.planned > 100000 || row.produced > 100000 || row.downtime > 480) throw new Error('Revisá las unidades y el tiempo de parada.');
    if (row.rejected > row.produced) throw new Error('Las unidades rechazadas no pueden superar las producidas.');
    return row;
  };
  const needsReview = row => row.rejected / row.produced > .02 || row.downtime > 30;
  const summarize = rows => {
    const total = rows.reduce((sum, row) => {
      for (const key of ['planned', 'produced', 'rejected', 'downtime']) sum[key] += row[key];
      return sum;
    }, { planned: 0, produced: 0, rejected: 0, downtime: 0 });
    return { ...total, good: total.produced - total.rejected, performance: total.planned ? total.produced / total.planned : 0, rejection: total.produced ? total.rejected / total.produced : 0 };
  };
  return { validate, needsReview, summarize };
})();
if (typeof module !== 'undefined') module.exports = ProductionModel;
