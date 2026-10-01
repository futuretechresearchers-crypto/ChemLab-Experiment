import { describe, expect, it } from 'vitest';
import { validateReaction } from './reactionEngine';
describe('reaction engine',()=>{
  it('forms water from exact stoichiometry',()=>expect(validateReaction(['H','H','O']).formula).toBe('H2O'));
  it('keeps partial water incomplete',()=>expect(validateReaction(['H','O']).missingAtoms).toEqual(['H']));
  it('forms lithium oxide only from needed atoms',()=>expect(validateReaction(['Li','Li','O']).formula).toBe('Li2O'));
  it('does not invent carbon monoxide',()=>expect(validateReaction(['C','O']).valid).toBe(false));
  it('models carbon dioxide as nonpolar overall',()=>expect(validateReaction(['C','O','O']).polarity).toContain('nonpolar'));
  it('models nitrogen with a triple bond',()=>expect(validateReaction(['N','N']).animationType).toBe('triple-bond'));
  it('rejects empty selections',()=>expect(validateReaction([]).valid).toBe(false));
});
