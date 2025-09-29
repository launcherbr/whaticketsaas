export function getRandomRGBA() {
  const limiar = 190;

  const r = Math.floor(Math.random() * limiar);
  const g = Math.floor(Math.random() * limiar);
  const b = Math.floor(Math.random() * limiar);

  const a = Math.random() * 0.5 + 0.5;

  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
}
