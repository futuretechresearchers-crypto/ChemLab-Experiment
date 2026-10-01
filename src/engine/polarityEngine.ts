export function getPolarity(formula:string, bondType?:string):string {
  if (formula === 'CO2') return 'Overall nonpolar: polar C=O bond dipoles cancel in a linear geometry.';
  if (['H2','O2','N2','Cl2','F2','Br2','I2'].includes(formula)) return 'Nonpolar molecule: identical atoms share electrons equally.';
  if (bondType === 'ionic') return 'Ionic lattice: electron transfer forms oppositely charged ions.';
  return bondType === 'polar covalent' ? 'Polar molecule: shared electron density is uneven.' : 'Polarity depends on the molecular geometry.';
}
