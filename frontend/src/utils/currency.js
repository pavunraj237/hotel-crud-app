const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const formatINR = (value) => {
  const amount = Number(value);
  let safeAmount = amount;

  if (!Number.isFinite(amount)) {
    safeAmount = 0;
  }

  return inrFormatter.format(safeAmount);
};
