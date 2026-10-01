import { useMemo, useState } from 'react';
import type { ElementData } from '../../types/chemistry';
import { elements } from '../../data/elementData';

type PeriodicTableProps = {
  selectedSymbol?: string;
  onSelect: (element: ElementData) => void;
  onAdd: (symbol: string) => void;
};

const categoryLabels: Record<string, string> = {
  'alkali metal': 'Alkali metal',
  'alkaline earth metal': 'Alkaline earth metal',
  'transition metal': 'Transition metal',
  'post-transition metal': 'Post-transition metal',
  metalloid: 'Metalloid',
  'reactive nonmetal': 'Reactive nonmetal',
  halogen: 'Halogen',
  'noble gas': 'Noble gas',
  lanthanide: 'Lanthanide',
  actinide: 'Actinide',
};

const filterOptions = ['All elements', 'Metals', 'Nonmetals', 'Metalloids', 'Noble gases', 'Halogens', 'Transition metals'];
const metalCategories = new Set(['alkali metal', 'alkaline earth metal', 'transition metal', 'post-transition metal', 'lanthanide', 'actinide']);

function matchesCategory(element: ElementData, filter: string) {
  if (filter === 'Metals') return metalCategories.has(element.category);
  if (filter === 'Nonmetals') return element.category === 'reactive nonmetal' || element.category === 'halogen';
  if (filter === 'Metalloids') return element.category === 'metalloid';
  if (filter === 'Noble gases') return element.category === 'noble gas';
  if (filter === 'Halogens') return element.category === 'halogen';
  if (filter === 'Transition metals') return element.category === 'transition metal';
  return true;
}

function ElementTile({ element, muted, selected, onSelect, onAdd }: { element: ElementData; muted: boolean; selected: boolean; onSelect: (element: ElementData) => void; onAdd: (symbol: string) => void }) {
  return <button
    type="button"
    className={`element periodic-element ${element.category.replaceAll(' ', '-')} ${selected ? 'selected' : ''} ${muted ? 'muted' : ''}`}
    style={{ gridColumn: element.group, gridRow: element.period }}
    title={`${element.name} | ${element.valenceElectrons} valence electrons | ${categoryLabels[element.category] ?? 'Element'}`}
    aria-label={`${element.name}, atomic number ${element.atomicNumber}`}
    onClick={() => { onSelect(element); onAdd(element.symbol); }}
    draggable
    onDragStart={(event) => {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('text/plain', element.symbol);
    }}
  >
    <small>{element.atomicNumber}</small>
    <b>{element.symbol}</b>
    <span>{element.name}</span>
    <em>{element.atomicMass}</em>
  </button>;
}

function DetailPanel({ element }: { element?: ElementData }) {
  if (!element) return <div className="element-detail empty-detail">Select an element to inspect its chemistry.</div>;
  return <div className="element-detail">
    <div><span className="eyebrow">SELECTED ELEMENT</span><h3>{element.name}</h3><strong>{element.symbol}</strong></div>
    <dl>
      <div><dt>Atomic number</dt><dd>{element.atomicNumber}</dd></div>
      <div><dt>Atomic mass</dt><dd>{element.atomicMass}</dd></div>
      <div><dt>Valence electrons</dt><dd>{element.valenceElectrons}</dd></div>
      <div><dt>Electronegativity</dt><dd>{element.electronegativity ?? 'N/A'}</dd></div>
      <div><dt>Category</dt><dd>{categoryLabels[element.category] ?? element.category}</dd></div>
      <div><dt>Electron configuration</dt><dd>{element.electronConfiguration}</dd></div>
    </dl>
  </div>;
}

export default function PeriodicTable({ selectedSymbol, onSelect, onAdd }: PeriodicTableProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All elements');
  const selected = elements.find(element => element.symbol === selectedSymbol);
  const normalizedQuery = query.trim().toLowerCase();
  const matching = useMemo(() => elements.filter(element => {
    const textMatch = !normalizedQuery || element.name.toLowerCase().includes(normalizedQuery) || element.symbol.toLowerCase().includes(normalizedQuery) || String(element.atomicNumber) === normalizedQuery;
    return textMatch && matchesCategory(element, filter);
  }), [filter, normalizedQuery]);
  const matchingSymbols = new Set(matching.map(element => element.symbol));
  const mainElements = elements.filter(element => element.category !== 'lanthanide' && element.category !== 'actinide');
  const lanthanides = elements.filter(element => element.category === 'lanthanide');
  const actinides = elements.filter(element => element.category === 'actinide');

  return <div className="periodic-table-wrap">
    <div className="periodic-heading">
      <div><span className="eyebrow">ELEMENT PALETTE</span><h2>Periodic table of elements</h2><p>Select or drag an element into the bonding workspace.</p></div>
      <span className="element-count">118 elements</span>
    </div>
    <div className="periodic-tools">
      <input aria-label="Search elements by name, symbol, or atomic number" placeholder="Search name, symbol, or atomic number" value={query} onChange={event => setQuery(event.target.value)} />
      <select aria-label="Filter elements by category" value={filter} onChange={event => setFilter(event.target.value)}>{filterOptions.map(option => <option key={option}>{option}</option>)}</select>
    </div>
    <div className="periodic-scroll">
      <div className="periodic-grid" aria-label="All 118 chemical elements">
        <div className="group-labels" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <span key={index}>{index + 1}</span>)}</div>
        <div className="period-labels" aria-hidden="true">{Array.from({ length: 7 }, (_, index) => <span key={index}>{index + 1}</span>)}</div>
        {mainElements.map(element => <ElementTile key={element.symbol} element={element} muted={!matchingSymbols.has(element.symbol)} selected={selectedSymbol === element.symbol} onSelect={onSelect} onAdd={onAdd} />)}
        <div className="f-block-marker" style={{ gridColumn: 3, gridRow: 6 }}>57-71</div>
        <div className="f-block-marker" style={{ gridColumn: 3, gridRow: 7 }}>89-103</div>
      </div>
    </div>
    <div className="f-block" aria-label="Lanthanides and actinides">
      <div><span>Lanthanides</span>{lanthanides.map(element => <ElementTile key={element.symbol} element={element} muted={!matchingSymbols.has(element.symbol)} selected={selectedSymbol === element.symbol} onSelect={onSelect} onAdd={onAdd} />)}</div>
      <div><span>Actinides</span>{actinides.map(element => <ElementTile key={element.symbol} element={element} muted={!matchingSymbols.has(element.symbol)} selected={selectedSymbol === element.symbol} onSelect={onSelect} onAdd={onAdd} />)}</div>
    </div>
    <div className="category-legend">{Object.entries(categoryLabels).map(([category, label]) => <span key={category}><i className={category.replaceAll(' ', '-')} />{label}</span>)}</div>
    <DetailPanel element={selected} />
  </div>;
}
