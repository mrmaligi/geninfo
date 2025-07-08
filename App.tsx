/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Chart, registerables} from 'chart.js';
import {streamInfographicContent} from './services/geminiService';
import {InfographicCardData, ChartCardData, ChartData, KPIData, ChartCardProps, Source, QuoteCardData, TimelineCardData, TimelineEvent} from './types';
import html2canvas from 'html2canvas';
import { saveInfographic, loadInfographic, clearInfographic } from './services/storageService';

// Register Chart.js components
Chart.register(...registerables);

// --- Chart Rendering Component (Internal to ChartCard) ---
const ChartComponent: React.FC<{chartType: ChartCardProps['chartType'], data: ChartData}> = ({chartType, data}: {chartType: ChartCardProps['chartType'], data: ChartData}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        const backgroundColors = [
          'rgba(54, 162, 235, 0.6)', 'rgba(255, 99, 132, 0.6)',
          'rgba(75, 192, 192, 0.6)', 'rgba(255, 206, 86, 0.6)',
          'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)',
        ];
        const borderColors = [
          'rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)', 'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)',
        ];

        const coloredDatasets = data.datasets.map((dataset: any, index: number) => ({
          ...dataset,
          backgroundColor: chartType === 'line' ? 'transparent' : (chartType === 'pie' || chartType === 'doughnut') ? backgroundColors : backgroundColors[index % backgroundColors.length],
          borderColor: borderColors[index % borderColors.length],
          borderWidth: chartType === 'line' ? 2 : 1,
          pointBackgroundColor: borderColors[index % borderColors.length],
          tension: 0.1,
        }));

        chartInstance.current = new Chart(ctx, {
          type: chartType,
          data: {...data, datasets: coloredDatasets},
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'top', labels: { color: '#4A5568', font: { family: "'Inter', sans-serif", size: 14 }}},
              title: { display: false },
            },
            scales: chartType === 'pie' || chartType === 'doughnut' ? {} : {
              y: { beginAtZero: true, grid: { color: '#E2E8F0' }, ticks: { color: '#4A5568' }},
              x: { grid: { display: false }, ticks: { color: '#4A5568' }},
            },
          },
        });
      }
    }
    return () => {
      chartInstance.current?.destroy();
    };
  }, [chartType, data]);

  return <canvas ref={chartRef}></canvas>;
};

// --- Citation Component ---
const SourceList: React.FC<{ sources?: Source[] }> = ({ sources }: { sources?: Source[] }) => {
  if (!sources || sources.length === 0) return null;
  return (
    <div className="source-container">
      <h4 className="source-list-title">Sources</h4>
      <div className="flex flex-wrap gap-2">
        {sources.map((source: Source, index: number) => (
          <a
            key={index}
            href={source.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="source-pill"
            title={source.title}
          >
            <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
            <span className="truncate">{new URL(source.uri).hostname}</span>
          </a>
        ))}
      </div>
    </div>
  );
};

// --- Infographic Card Components ---
const TitleCard: React.FC<{title: string}> = ({title}) => (
  <div className="title-card">
    <h2 className="text-3xl font-bold text-gray-800">{title}</h2>
  </div>
);

// Typewriter effect for text content
const TypewriterText: React.FC<{text: string}> = ({ text }) => {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    if (!text) return;
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed((prev) => prev + text[i]);
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 12);
    return () => clearInterval(interval);
  }, [text]);
  return <span>{displayed}</span>;
};

const TextCard: React.FC<{content: string; icon?: string; sources?: Source[]}> = ({ content, icon, sources }) => (
    <div className="text-card h-full">
        <div className="flex items-start flex-grow">
            {icon && <span className="text-4xl mr-4 mt-1">{icon}</span>}
            <p className="text-lg text-gray-600 flex-1"><TypewriterText text={content || ''} /></p>
        </div>
        <SourceList sources={sources} />
    </div>
);


const KPICard: React.FC<{items: KPIData[], sources?: Source[]}> = ({items, sources}) => (
    <div className="kpi-card-container h-full">
        <div className="kpi-card-grid flex-grow">
            {items.map((item, index) => (
            <div key={index} className="kpi-card">
                <div className="flex items-center">
                {item.icon && <span className="kpi-icon">{item.icon}</span>}
                <div>
                    <div className="kpi-value">{item.value}</div>
                    <div className="kpi-label">{item.label}</div>
                </div>
                </div>
            </div>
            ))}
        </div>
        <div className="bg-white rounded-b-xl px-6 pb-4 pt-2 -mt-2">
           <SourceList sources={sources} />
        </div>
    </div>
);

const ChartCard: React.FC<ChartCardData & { sources?: Source[] }> = ({title, chartType: initialChartType, data, sources}) => {
  const [chartType, setChartType] = useState(initialChartType);
  const chartTypes: ChartCardProps['chartType'][] = ['bar', 'line', 'pie'];
  
  return (
    <div className="chart-card h-full">
      <div className="flex flex-col items-center">
        <h3 className="chart-title">{title}</h3>
        <div className="chart-switch-container">
          {chartTypes.map(type => (
            <button 
              key={type} 
              onClick={() => setChartType(type)}
              className={`chart-switch-button ${chartType === type ? 'active' : ''}`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="relative h-72 w-full flex-grow"><ChartComponent chartType={chartType} data={data} /></div>
      <SourceList sources={sources} />
    </div>
  );
};

const QuoteCard: React.FC<QuoteCardData> = ({ content, author, icon, sources }) => (
    <div className="quote-card h-full">
        <div className="flex-grow">
            <p className="quote-content">"{content}"</p>
            <p className="quote-author">&mdash; {author}</p>
        </div>
        <SourceList sources={sources} />
    </div>
);

const TimelineCard: React.FC<TimelineCardData> = ({ title, events, sources }) => (
    <div className="timeline-card h-full">
        <h3 className="timeline-title">{title}</h3>
        <div className="flex-grow">
            {events.map((event, index) => (
                <div key={index} className="timeline-item">
                    <div className="timeline-dot"></div>
                    <p className="timeline-date">{event.date}</p>
                    <h4 className="timeline-item-title">{event.title}</h4>
                    <p className="timeline-item-desc">{event.description}</p>
                </div>
            ))}
        </div>
        <SourceList sources={sources} />
    </div>
);

// --- Creative Card Components ---
const SimileCard: React.FC<{input: string; similes: string[]; width?: string}> = ({ input, similes }) => (
  <div className="creative-card simile-card">
    <h3 className="font-bold mb-1">Similes for: <span className="italic">{input}</span></h3>
    <ul className="list-disc pl-5 text-gray-700">
      {similes.map((s, i) => <li key={i}>{s}</li>)}
    </ul>
  </div>
);

const ExplodeCard: React.FC<{input: string; explosions: string[]; width?: string}> = ({ input, explosions }) => (
  <div className="creative-card explode-card">
    <h3 className="font-bold mb-1">Explode: <span className="italic">{input}</span></h3>
    <ul className="list-disc pl-5 text-gray-700">
      {explosions.map((e, i) => <li key={i}>{e}</li>)}
    </ul>
  </div>
);

const UnexpectCard: React.FC<{input: string; unexpecteds: string[]; width?: string}> = ({ input, unexpecteds }) => (
  <div className="creative-card unexpect-card">
    <h3 className="font-bold mb-1">Unexpect: <span className="italic">{input}</span></h3>
    <ul className="list-disc pl-5 text-gray-700">
      {unexpecteds.map((u, i) => <li key={i}>{u}</li>)}
    </ul>
  </div>
);

const ChainCard: React.FC<{input: string; chain: string[]; width?: string}> = ({ input, chain }) => (
  <div className="creative-card chain-card">
    <h3 className="font-bold mb-1">Chain from: <span className="italic">{input}</span></h3>
    <div className="text-gray-700">{chain.join(' → ')}</div>
  </div>
);

const POVCard: React.FC<{input: string; perspectives: string[]; width?: string}> = ({ input, perspectives }) => (
  <div className="creative-card pov-card">
    <h3 className="font-bold mb-1">POV: <span className="italic">{input}</span></h3>
    <ul className="list-disc pl-5 text-gray-700">
      {perspectives.map((p, i) => <li key={i}>{p}</li>)}
    </ul>
  </div>
);

const AlliterationCard: React.FC<{topic: string; letter: string; words: string[]; width?: string}> = ({ topic, letter, words }) => (
  <div className="creative-card alliteration-card">
    <h3 className="font-bold mb-1">Alliteration for "{topic}" with "{letter}"</h3>
    <ul className="list-disc pl-5 text-gray-700">
      {words.map((w, i) => <li key={i}>{w}</li>)}
    </ul>
  </div>
);

const AcronymCard: React.FC<{input: string; acronyms: string[]; width?: string}> = ({ input, acronyms }) => (
  <div className="creative-card acronym-card">
    <h3 className="font-bold mb-1">Acronym for: <span className="italic">{input}</span></h3>
    <ul className="list-disc pl-5 text-gray-700">
      {acronyms.map((a, i) => <li key={i}>{a}</li>)}
    </ul>
  </div>
);

const FuseCard: React.FC<{concept1: string; concept2: string; fusions: string[]; width?: string}> = ({ concept1, concept2, fusions }) => (
  <div className="creative-card fuse-card">
    <h3 className="font-bold mb-1">Fuse: <span className="italic">{concept1}</span> + <span className="italic">{concept2}</span></h3>
    <ul className="list-disc pl-5 text-gray-700">
      {fusions.map((f, i) => <li key={i}>{f}</li>)}
    </ul>
  </div>
);

const SceneCard: React.FC<{input: string; details: string[]; width?: string}> = ({ input, details }) => (
  <div className="creative-card scene-card">
    <h3 className="font-bold mb-1">Scene: <span className="italic">{input}</span></h3>
    <ul className="list-disc pl-5 text-gray-700">
      {details.map((d, i) => <li key={i}>{d}</li>)}
    </ul>
  </div>
);

const UnfoldCard: React.FC<{input: string; unfolds: string[]; width?: string}> = ({ input, unfolds }) => (
  <div className="creative-card unfold-card">
    <h3 className="font-bold mb-1">Unfold: <span className="italic">{input}</span></h3>
    <ul className="list-disc pl-5 text-gray-700">
      {unfolds.map((u, i) => <li key={i}>{u}</li>)}
    </ul>
  </div>
);

// --- Main App Screens ---

const TopicInputScreen: React.FC<{
  onSubmitTopic: (topic: string) => void;
  isLoading: boolean;
}> = ({ onSubmitTopic, isLoading }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSubmitTopic(inputValue.trim());
    }
  };

  return (
    <div className="w-full min-h-screen p-4 flex flex-col items-center justify-center text-center bg-gray-50">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-800 mb-3 tracking-tight">
        Generative Infographic AI
      </h1>
      <p className="text-lg sm:text-xl text-gray-500 mb-12 max-w-2xl">
        Enter any topic to generate a rich, data-driven, and fact-checked infographic with dynamic layouts.
      </p>
      <form onSubmit={handleSubmit} className="w-full max-w-xl">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="e.g., The History of the Internet"
            className="topic-input"
            disabled={isLoading}
          />
          <button type="submit" className="topic-submit-button" disabled={isLoading}>
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              'Generate'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};


const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center h-48">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
  </div>
);

// --- Card Action Buttons
const CardActions: React.FC<{
  onDelete: () => void;
  onRegenerate: () => void;
  onEdit?: () => void;
  draggableProps?: React.HTMLAttributes<HTMLDivElement>;
}> = ({ onDelete, onRegenerate, onEdit, draggableProps }) => (
  <div className="flex gap-2 absolute top-3 right-4 z-10">
    <button title="Regenerate" className="card-action-btn" onClick={onRegenerate}>
      <span role="img" aria-label="Regenerate">🔄</span>
    </button>
    {onEdit && (
      <button title="Edit" className="card-action-btn" onClick={onEdit}>
        <span role="img" aria-label="Edit">✏️</span>
      </button>
    )}
    <button title="Delete" className="card-action-btn" onClick={onDelete}>
      <span role="img" aria-label="Delete">🗑️</span>
    </button>
    <div {...draggableProps} title="Drag to reorder" className="card-action-btn cursor-move">
      <span role="img" aria-label="Drag">☰</span>
    </div>
  </div>
);

// Dark mode toggle
const useDarkMode = () => {
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') document.body.classList.add('dark');
  }, []);
  const toggle = () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('darkMode', document.body.classList.contains('dark') ? 'true' : 'false');
  };
  return toggle;
};

const App: React.FC = () => {
  const [view, setView] = useState('input');
  const [topic, setTopic] = useState('');
  const [infographics, setInfographics] = useState<InfographicCardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [streamedCount, setStreamedCount] = useState(0);
  const infographicRef = useRef<HTMLDivElement>(null);

  const observer = useRef<IntersectionObserver | null>(null);

  const fetchInfographic = useCallback(async (currentTopic: string, currentHistory: InfographicCardData[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const newCards = await streamInfographicContent(currentTopic, currentHistory);
      setInfographics((prev) => [...prev, ...newCards]);
    } catch (e: any) {
      setError(e.message || 'Failed to stream content from the API.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!topic.trim() || isLoading) return;
    fetchInfographic(topic, infographics);
  }, [topic, isLoading, infographics, fetchInfographic]);

  const loadMoreRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && infographics.length > 0 && !isLoading) {
          handleLoadMore();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoading, infographics, handleLoadMore],
  );

  const handleTopicSubmit = (selectedTopic: string) => {
    setTopic(selectedTopic);
    setInfographics([]);
    setError(null);
    fetchInfographic(selectedTopic, []);
    setView('feed');
  };

  const handleBackToInput = () => {
    setView('input');
    setTopic('');
    setInfographics([]);
    setError(null);
  };

  // Card actions
  const handleDeleteCard = (index: number) => {
    setInfographics(prev => prev.filter((_, i) => i !== index));
  };

  const handleRegenerateCard = async (index: number) => {
    setRegeneratingIndex(index);
    try {
      // Regenerate just this card using the same topic and card context
      const prevCards = infographics.slice(0, index);
      const newCards = await streamInfographicContent(topic, prevCards);
      // Replace the card at index with the first new card
      setInfographics(prev => [
        ...prev.slice(0, index),
        newCards[0],
        ...prev.slice(index + 1)
      ]);
    } catch (e: any) {
      setError(e.message || 'Failed to regenerate card.');
    } finally {
      setRegeneratingIndex(null);
    }
  };

  const renderCard = (card: InfographicCardData, index?: number) => {
    const actions = index !== undefined ? (
      <CardActions
        onDelete={() => handleDeleteCard(index)}
        onRegenerate={() => handleRegenerateCard(index)}
        // onEdit={...} // To be added for editable cards
      />
    ) : null;
    switch (card.type) {
      case 'title': return <div className="relative">{actions}<TitleCard title={card.title} /></div>;
      case 'text': return <div className="relative">{actions}<TextCard content={card.content} icon={card.icon} sources={card.sources} /></div>;
      case 'kpi': return <div className="relative">{actions}<KPICard items={card.items} sources={card.sources} /></div>;
      case 'chart': return <div className="relative">{actions}<ChartCard {...card} /></div>;
      case 'quote': return <div className="relative">{actions}<QuoteCard {...card} /></div>;
      case 'timeline': return <div className="relative">{actions}<TimelineCard {...card} /></div>;
      case 'simile': return <div className="relative">{actions}<SimileCard input={card.input} similes={card.similes} width={card.width} /></div>;
      case 'explode': return <div className="relative">{actions}<ExplodeCard input={card.input} explosions={card.explosions} width={card.width} /></div>;
      case 'unexpect': return <div className="relative">{actions}<UnexpectCard input={card.input} unexpecteds={card.unexpecteds} width={card.width} /></div>;
      case 'chain': return <div className="relative">{actions}<ChainCard input={card.input} chain={card.chain} width={card.width} /></div>;
      case 'pov': return <div className="relative">{actions}<POVCard input={card.input} perspectives={card.perspectives} width={card.width} /></div>;
      case 'alliteration': return <div className="relative">{actions}<AlliterationCard topic={card.topic} letter={card.letter} words={card.words} width={card.width} /></div>;
      case 'acronym': return <div className="relative">{actions}<AcronymCard input={card.input} acronyms={card.acronyms} width={card.width} /></div>;
      case 'fuse': return <div className="relative">{actions}<FuseCard concept1={card.concept1} concept2={card.concept2} fusions={card.fusions} width={card.width} /></div>;
      case 'scene': return <div className="relative">{actions}<SceneCard input={card.input} details={card.details} width={card.width} /></div>;
      case 'unfold': return <div className="relative">{actions}<UnfoldCard input={card.input} unfolds={card.unfolds} width={card.width} /></div>;
      default: return null;
    }
  };

  // Export as PNG
  const handleExportImage = async () => {
    if (!infographicRef.current) return;
    const canvas = await html2canvas(infographicRef.current, { backgroundColor: null });
    const link = document.createElement('a');
    link.download = `${topic || 'infographic'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Save/load
  const handleSave = () => saveInfographic(infographics);
  const handleLoad = () => {
    const loaded = loadInfographic();
    if (loaded) setInfographics(loaded);
  };
  const handleClear = () => {
    clearInfographic();
    setInfographics([]);
  };

  const toggleDarkMode = useDarkMode();

  if (view === 'input') {
    return <TopicInputScreen onSubmitTopic={handleTopicSubmit} isLoading={isLoading} />;
  }

  const groupedInfographics = groupCardsByWidth(infographics);

  // Streaming effect: reveal cards one by one
  useEffect(() => {
    if (!isLoading && streamedCount < infographics.length) {
      const timeout = setTimeout(() => setStreamedCount(streamedCount + 1), 400);
      return () => clearTimeout(timeout);
    }
    if (isLoading) setStreamedCount(0);
    if (!isLoading && infographics.length === 0) setStreamedCount(0);
  }, [infographics, isLoading, streamedCount]);

  // --- Streaming rendering logic ---
  // Flatten all cards for streaming
  const flatCards: InfographicCardData[] = [];
  groupedInfographics.forEach(group => {
    if (group.layout === 'full') flatCards.push(group.cards[0]);
    else flatCards.push(...group.cards);
  });

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 font-sans">
      <div className="flex justify-between items-center mb-6 gap-2 flex-wrap">
        <div className="flex gap-2">
          <button className="llm-button-secondary" onClick={toggleDarkMode} title="Toggle dark mode">
            <span role="img" aria-label="Dark mode">🌓</span>
          </button>
          <button className="llm-button-secondary" onClick={handleExportImage} title="Export as PNG">
            <span role="img" aria-label="Export">🖼️</span>
          </button>
          <button className="llm-button-secondary" onClick={handleSave} title="Save infographic">
            <span role="img" aria-label="Save">💾</span>
          </button>
          <button className="llm-button-secondary" onClick={handleLoad} title="Load infographic">
            <span role="img" aria-label="Load">📂</span>
          </button>
          <button className="llm-button-secondary" onClick={handleClear} title="Clear infographic">
            <span role="img" aria-label="Clear">🗑️</span>
          </button>
        </div>
        <div></div>
      </div>
      <div className="text-center my-10">
        <button onClick={handleBackToInput} className="llm-button-secondary mb-4">
          &larr; New Topic
        </button>
        <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight mb-2">{topic}</h1>
      </div>
      <div ref={infographicRef}>
      <div className="space-y-8">
        {groupedInfographics.map((group, groupIndex) => {
          // Only show cards if all in this group are within streamedCount
          const groupCardIndexes = group.cards.map(card => flatCards.indexOf(card));
          if (group.layout === 'full') {
            const idx = groupCardIndexes[0];
            return (
              <div key={groupIndex} className="animate-fade-in-up" style={{ animationDelay: `${groupIndex * 100}ms` }}>
                {idx > -1 && idx < streamedCount
                  ? renderCard(group.cards[0], infographics.indexOf(group.cards[0]))
                  : <div style={{ minHeight: 120 }} />}
              </div>
            );
          } else {
            return (
              <div key={groupIndex} className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up" style={{ animationDelay: `${groupIndex * 100}ms` }}>
                {group.cards.map((card, i) => {
                  const idx = flatCards.indexOf(card);
                  return (
                    <div key={i}>
                      {idx > -1 && idx < streamedCount
                        ? renderCard(card, infographics.indexOf(card))
                        : <div style={{ minHeight: 120 }} />}
                    </div>
                  );
                })}
              </div>
            );
          }
        })}
        {isLoading || streamedCount < flatCards.length ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-blue-500"></div>
            <span className="ml-4 text-blue-500 font-semibold">Generating...</span>
          </div>
        ) : null}
      </div>
      </div>

      <div ref={loadMoreRef} />

      {isLoading && <LoadingSpinner />}

      {error && (
        <div className="text-card bg-red-50 border-red-200 text-red-700">
          <span className="text-4xl mr-4">🚨</span>
          <div>
            <h2 className="font-bold text-lg">An Error Occurred</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Layout Logic ---
interface GroupedCard {
    layout: 'grid' | 'full';
    cards: InfographicCardData[];
}

function groupCardsByWidth(cards: InfographicCardData[]): GroupedCard[] {
    const grouped: GroupedCard[] = [];
    let i = 0;
    while (i < cards.length) {
        const card = cards[i];
        if (card.width === 'half' && i + 1 < cards.length && cards[i+1].width === 'half') {
            grouped.push({ layout: 'grid', cards: [card, cards[i+1]] });
            i += 2;
        } else {
            grouped.push({ layout: 'full', cards: [card] });
            i += 1;
        }
    }
    return grouped;
}

// Error Boundary
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return <div style={{color: 'red', padding: 32}}>
        <h2>Something went wrong.</h2>
        <pre>{String(this.state.error)}</pre>
      </div>;
    }
    return this.props.children;
  }
}

// In App export
export default function AppWithBoundary() {
  return <ErrorBoundary><App /></ErrorBoundary>;
}