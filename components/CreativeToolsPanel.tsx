import React, { useState, ChangeEvent } from 'react';
import {
  generateSimile,
  explodeWord,
  unexpect,
  chainWords,
  pov,
  alliteration,
  acronym,
  fuse,
  scene,
  unfold
} from '../services/creativeToolsService';

const toolList = [
  { key: 'simile', label: 'Simile', inputCount: 1, placeholder: 'Enter a word or concept...' },
  { key: 'explode', label: 'Explode', inputCount: 1, placeholder: 'Enter a word...' },
  { key: 'unexpect', label: 'Unexpect', inputCount: 1, placeholder: 'Enter a scene or concept...' },
  { key: 'chain', label: 'Chain', inputCount: 1, placeholder: 'Enter a word...' },
  { key: 'pov', label: 'POV', inputCount: 1, placeholder: 'Enter a topic...' },
  { key: 'alliteration', label: 'Alliteration', inputCount: 2, placeholder: 'Topic, Letter' },
  { key: 'acronym', label: 'Acronym', inputCount: 1, placeholder: 'Enter a word...' },
  { key: 'fuse', label: 'Fuse', inputCount: 2, placeholder: 'Concept 1, Concept 2' },
  { key: 'scene', label: 'Scene', inputCount: 1, placeholder: 'Enter a scene or place...' },
  { key: 'unfold', label: 'Unfold', inputCount: 1, placeholder: 'Enter a word...' },
];

const toolFunctions: Record<string, (...args: string[]) => string[]> = {
  simile: generateSimile,
  explode: explodeWord,
  unexpect: unexpect,
  chain: chainWords,
  pov: pov,
  alliteration: alliteration,
  acronym: acronym,
  fuse: fuse,
  scene: scene,
  unfold: unfold,
};

const CreativeToolsPanel: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState(toolList[0].key);
  const [inputs, setInputs] = useState<string[]>(['', '']);
  const [results, setResults] = useState<string[]>([]);

  const handleToolChange = (key: string) => {
    setSelectedTool(key);
    setInputs(['', '']);
    setResults([]);
  };

  const handleInputChange = (idx: number, value: string) => {
    const newInputs = [...inputs];
    newInputs[idx] = value;
    setInputs(newInputs);
  };

  const handleRun = () => {
    const tool = toolList.find(t => t.key === selectedTool)!;
    const args = inputs.slice(0, tool.inputCount).map(i => i.trim());
    if (args.some(a => !a)) return;
    const fn = toolFunctions[selectedTool];
    setResults(fn(...args));
  };

  const tool = toolList.find(t => t.key === selectedTool)!;

  return (
    <div className="creative-tools-panel p-4 bg-white rounded-xl shadow mb-8">
      <h2 className="text-2xl font-bold mb-4">Creative Writing Tools</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        {toolList.map(t => (
          <button
            key={t.key}
            className={`tool-btn ${selectedTool === t.key ? 'active' : ''}`}
            onClick={() => handleToolChange(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-4">
        {[...Array(tool.inputCount)].map((_, idx) => (
          <input
            key={idx}
            type="text"
            value={inputs[idx] || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(idx, e.target.value)}
            placeholder={tool.inputCount === 2 && idx === 1 ? 'Second input...' : tool.placeholder}
            className="tool-input"
          />
        ))}
        <button className="tool-run-btn" onClick={handleRun}>Run</button>
      </div>
      {results.length > 0 && (
        <div className="tool-results bg-gray-50 rounded p-3">
          <ul className="list-disc pl-5">
            {results.map((r: string, i: number) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CreativeToolsPanel;
