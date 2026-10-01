export function formatChemicalFormula(formula:string):string {
  return formula.replace(/([0-9]+)/g, (_, digits:string) => [...digits].map(d => '₀₁₂₃₄₅₆₇₈₉'[Number(d)]).join(''));
}
