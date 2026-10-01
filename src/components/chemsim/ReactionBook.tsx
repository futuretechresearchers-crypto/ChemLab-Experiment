import { supportedReactions } from '../../engine/reactionEngine';
import { formatChemicalFormula } from '../../engine/formatting';

type ReactionBookProps = { onChoose: (symbols:string[]) => void; onClose: () => void };
export default function ReactionBook({ onChoose, onClose }: ReactionBookProps) {
  return <div className="overlay" role="dialog" aria-modal="true" aria-label="Reaction book"><div className="modal reaction-book"><button className="close" onClick={onClose} aria-label="Close reaction book">×</button><span className="eyebrow">REACTION BOOK</span><h2>Supported learning reactions</h2><p>Choose a recipe to load its reactants, then run the normal validation and animation.</p><div className="reaction-list">{supportedReactions().map(reaction => { const symbols=Object.entries(reaction.atoms).flatMap(([symbol,count])=>Array.from({length:count},()=>symbol)); return <button key={reaction.formula} onClick={()=>onChoose(symbols)}><strong>{formatChemicalFormula(reaction.formula)}</strong><span>{symbols.join(' + ')} · {reaction.name}</span></button>; })}</div></div></div>;
}
