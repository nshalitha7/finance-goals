import dayjs from 'dayjs';

export function computeGoalMetrics(goal, transactions) {
  const signed = transactions.map(t => ({ ...t, signedAmount: t.type === 'deposit' ? t.amount : -t.amount }));
  const totalSaved = signed.reduce((s, t) => s + t.signedAmount, 0);
  const progressPct = Math.max(0, Math.min(100, (totalSaved / goal.target_amount) * 100));
  const achieved = totalSaved >= goal.target_amount;

  const grouped = {};
  for (const t of signed) {
    const key = dayjs(t.transaction_date).format('YYYY-MM');
    grouped[key] = (grouped[key] || 0) + t.signedAmount;
  }
  const months = Object.keys(grouped).sort();
  const monthlySeries = months.map(m => ({ month: m, net: Number(grouped[m].toFixed(2)) }));
  const avgMonthly = monthlySeries.length ? monthlySeries.reduce((s, x) => s + x.net, 0) / monthlySeries.length : 0;

  const monthsToTarget = avgMonthly > 0 ? (goal.target_amount - totalSaved) / avgMonthly : Infinity;
  const projectedCompletionDate = Number.isFinite(monthsToTarget) && monthsToTarget > 0
    ? dayjs().add(Math.ceil(monthsToTarget), 'month').format('YYYY-MM-DD')
    : achieved ? dayjs().format('YYYY-MM-DD') : null;

  const targetMonths = Math.max(1, dayjs(goal.target_date).diff(dayjs(goal.start_date), 'month'));
  const elapsedMonths = Math.max(1, dayjs().diff(dayjs(goal.start_date), 'month'));
  const plannedByNow = Math.min(goal.target_amount, (goal.target_amount / targetMonths) * elapsedMonths);
  const behindPace = totalSaved + 1e-6 < plannedByNow;

  const variance = monthlySeries.length > 1
    ? monthlySeries.reduce((sum, x) => sum + Math.pow(x.net - avgMonthly, 2), 0) / (monthlySeries.length - 1)
    : 0;
  const stdDev = Math.sqrt(Math.max(0, variance));
  const confidence = avgMonthly <= 0 ? 0 : Math.max(5, Math.min(95, Math.round((1 - (stdDev / Math.max(1, avgMonthly * 1.5))) * 100)));

  return {
    totalSaved: Number(totalSaved.toFixed(2)), progressPct: Number(progressPct.toFixed(2)), achieved,
    monthlySeries, averageMonthlyContribution: Number(avgMonthly.toFixed(2)), projectedCompletionDate,
    plannedByNow: Number(plannedByNow.toFixed(2)), behindPace, confidence
  };
}

export function whatIfProjection(goal, currentSaved, monthlyContribution) {
  if (monthlyContribution <= 0) return null;
  const months = Math.max(0, Math.ceil((goal.target_amount - currentSaved) / monthlyContribution));
  return dayjs().add(months, 'month').format('YYYY-MM-DD');
}
