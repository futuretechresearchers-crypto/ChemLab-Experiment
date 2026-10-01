export type BondType = 'ionic' | 'nonpolar covalent' | 'polar covalent' | 'metallic';
export interface ElementData {
  atomicNumber:number; symbol:string; name:string; category:string; period:number; group?:number;
  atomicMass:number; valenceElectrons:number; electronConfiguration:string; electronegativity?:number;
  oxidationStates:number[]; shells:number[];
}
export interface Atom { id:string; element:ElementData; x:number; y:number; state:'idle'|'reacting'|'product'; }
export interface ReactionResult {
  valid:boolean; reactants:string[]; products:string[]; formula?:string; compoundName?:string;
  bondType?:BondType; bondOrders?:number[]; atomIndices?:number[]; geometry?:string; polarity?:string;
  explanation?:string; animationType?:string; missingAtoms?:string[]; feedback?:string;
}
