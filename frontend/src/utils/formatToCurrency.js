/* eslint-disable new-cap */
export default function formatToCurrency(value) {
  return Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}
