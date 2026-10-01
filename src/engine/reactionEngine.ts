import type { BondType, ReactionResult } from '../types/chemistry';
import { getGeometry } from './geometryEngine';
import { getPolarity } from './polarityEngine';

type Definition = { id:string; formula:string; name:string; atoms:Record<string,number>; bondType:BondType; order:number; explanation:string };
const seed: Array<[string,string,Record<string,number>,BondType,number]> = [
  ['H2','Hydrogen', {H:2},'nonpolar covalent',1], ['O2','Oxygen', {O:2},'nonpolar covalent',2], ['N2','Nitrogen',{N:2},'nonpolar covalent',3], ['Cl2','Chlorine',{Cl:2},'nonpolar covalent',1], ['F2','Fluorine',{F:2},'nonpolar covalent',1], ['Br2','Bromine',{Br:2},'nonpolar covalent',1], ['I2','Iodine',{I:2},'nonpolar covalent',1],
  ['H2O','Water',{H:2,O:1},'polar covalent',1], ['CO2','Carbon dioxide',{C:1,O:2},'polar covalent',2], ['NH3','Ammonia',{N:1,H:3},'polar covalent',1], ['CH4','Methane',{C:1,H:4},'nonpolar covalent',1], ['HCl','Hydrogen chloride',{H:1,Cl:1},'polar covalent',1], ['HF','Hydrogen fluoride',{H:1,F:1},'polar covalent',1], ['HI','Hydrogen iodide',{H:1,I:1},'polar covalent',1], ['H2S','Hydrogen sulfide',{H:2,S:1},'polar covalent',1],
  ['NaCl','Sodium chloride',{Na:1,Cl:1},'ionic',1], ['LiCl','Lithium chloride',{Li:1,Cl:1},'ionic',1], ['KBr','Potassium bromide',{K:1,Br:1},'ionic',1], ['MgO','Magnesium oxide',{Mg:1,O:1},'ionic',1], ['MgCl2','Magnesium chloride',{Mg:1,Cl:2},'ionic',1], ['CaCl2','Calcium chloride',{Ca:1,Cl:2},'ionic',1], ['Li2O','Lithium oxide',{Li:2,O:1},'ionic',1], ['Na2O','Sodium oxide',{Na:2,O:1},'ionic',1], ['K2O','Potassium oxide',{K:2,O:1},'ionic',1],
  ['AlCl3','Aluminium chloride',{Al:1,Cl:3},'ionic',1], ['Al2O3','Aluminium oxide',{Al:2,O:3},'ionic',1], ['FeCl3','Iron(III) chloride',{Fe:1,Cl:3},'ionic',1], ['Fe2O3','Iron(III) oxide',{Fe:2,O:3},'ionic',1], ['ZnO','Zinc oxide',{Zn:1,O:1},'ionic',1], ['SiO2','Silicon dioxide',{Si:1,O:2},'polar covalent',2], ['SO2','Sulfur dioxide',{S:1,O:2},'polar covalent',2], ['SO3','Sulfur trioxide',{S:1,O:3},'polar covalent',2], ['NO2','Nitrogen dioxide',{N:1,O:2},'polar covalent',2], ['N2O','Dinitrogen monoxide',{N:2,O:1},'polar covalent',2],
];
const defs:Definition[] = seed.map(([formula,name,atoms,bondType,order]) => ({ id:formula, formula, name, atoms, bondType, order, explanation: bondType === 'ionic' ? 'An electron-transfer model: ions attract after electrons move to complete a stable outer shell.' : 'A shared-electron model: the bond forms as atoms share valence electrons.' }));
export const supportedReactions = () => defs.map(({ formula, name, atoms, bondType }) => ({ formula, name, atoms: { ...atoms }, bondType }));
export const generateReactionKey = (symbols:string[]) => [...symbols].sort().join('+');
const includes = (have:Record<string,number>, need:Record<string,number>) => Object.entries(need).every(([s,n]) => (have[s] ?? 0) >= n);
function counts(symbols:string[]) { return symbols.reduce<Record<string,number>>((all,s) => ({...all,[s]:(all[s] ?? 0)+1}), {}); }
export function validateReaction(symbols:string[]):ReactionResult {
  if (!symbols.length) return {valid:false,reactants:[],products:[],feedback:'Add elements to begin the laboratory simulation.'};
  const present = counts(symbols); const exact = defs.filter(d => includes(present,d.atoms) && Object.keys(present).every(s => s in d.atoms) && Object.keys(d.atoms).every(s => s in present));
  const match = exact.sort((a,b) => Object.values(b.atoms).reduce((x,y)=>x+y,0)-Object.values(a.atoms).reduce((x,y)=>x+y,0))[0];
  if (match) return { valid:true, reactants:symbols, products:[match.formula], formula:match.formula, compoundName:match.name, bondType:match.bondType, bondOrders:[match.order], atomIndices:symbols.map((_,i)=>i), geometry:getGeometry(match.formula), polarity:getPolarity(match.formula,match.bondType), explanation:match.explanation, animationType:match.bondType === 'ionic' ? 'electron-transfer' : match.order === 3 ? 'triple-bond' : match.order === 2 ? 'double-bond' : 'electron-sharing' };
  const candidate = defs.filter(d => Object.entries(present).every(([s,n]) => (d.atoms[s] ?? 0) >= n)).sort((a,b)=>Object.keys(a.atoms).length-Object.keys(b.atoms).length)[0];
  if (candidate) { const missing:string[]=[]; for (const [s,n] of Object.entries(candidate.atoms)) for(let i=present[s]??0;i<n;i++) missing.push(s); return {valid:false,reactants:symbols,products:[],missingAtoms:missing,feedback:`Incomplete: add ${missing.join(' + ')} to form ${candidate.formula}.`}; }
  return {valid:false,reactants:symbols,products:[],feedback:'Unable to analyze this combination. It is unsupported or chemically ambiguous in this learning model.'};
}
export const checkReaction = validateReaction;
export function checkReactionMulti(symbols:string[]) { return validateReaction(symbols); }
export function getCompatibleElements(symbol:string) { return defs.filter(d => symbol in d.atoms).flatMap(d => Object.keys(d.atoms)).filter(s=>s!==symbol).filter((s,i,a)=>a.indexOf(s)===i); }
