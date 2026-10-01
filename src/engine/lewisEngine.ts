import { elementBySymbol } from '../data/elementData';
export interface LewisData { formula:string; totalValenceElectrons:number; bonds:string; note:string; }
export function buildLewisStructure(symbols:string[], formula:string, bondOrder=1):LewisData {
  const total = symbols.reduce((sum, symbol) => sum + (elementBySymbol(symbol)?.valenceElectrons ?? 0), 0);
  const bonds = ({ H2:'H—H', O2:'O=O', N2:'N≡N', Cl2:'Cl—Cl', H2O:'H—O—H', CO2:'O=C=O', NH3:'  H\n  |\nH—N—H', CH4:'  H\n  |\nH—C—H\n  |\n  H' } as Record<string,string>)[formula] ?? 'Lewis model available after selecting a supported compound.';
  return { formula, totalValenceElectrons:total, bonds, note:'Dots and bonds are a simplified octet-rule learning model.' };
}
