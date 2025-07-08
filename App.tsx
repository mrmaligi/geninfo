/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Chart, registerables} from 'chart.js';
import {streamInfographicContent} from './services/geminiService';
import {InfographicCardData, ChartCardData, ChartData, KPIData, ChartCardProps, Source, QuoteCardData, TimelineCardData, TimelineEvent} from './types';

// Register Chart.js components
Chart.register(...registerables);

// --- Chart Rendering Component (Internal to ChartCard) ---
const ChartComponent: React.FC<{chartType: ChartCardProps['chartType'], data: ChartData}> = ({chartType, data}) => {
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

        const coloredDatasets = data.datasets.map((dataset, index) => ({
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
const SourceList: React.FC<{ sources?: Source[] }> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;
  return (
    <div className="source-container">
      <h4 className="source-list-title">Sources</h4>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, index) => (
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

const TextCard: React.FC<{content: string; icon?: string; sources?: Source[]}> = ({ content, icon, sources }) => (
    <div className="text-card h-full">
        <div className="flex items-start flex-grow">
            {icon && <span className="text-4xl mr-4 mt-1">{icon}</span>}
            <p className="text-lg text-gray-600 flex-1">{content}</p>
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

const App: React.FC = () => {
  const [view, setView] = useState('input');
  const [topic, setTopic] =useState('');
  const [infographics, setInfographics] = useState<InfographicCardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const renderCard = (card: InfographicCardData) => {
    switch (card.type) {
      case 'title': return <TitleCard title={card.title} />;
      case 'text': return <TextCard content={card.content} icon={card.icon} sources={card.sources} />;
      case 'kpi': return <KPICard items={card.items} sources={card.sources} />;
      case 'chart': return <ChartCard title={card.title} chartType={card.chartType} data={card.data} sources={card.sources}/>;
      case 'quote': return <QuoteCard {...card} />;
      case 'timeline': return <TimelineCard {...card} />;
      default: return null;
    }
  };

  if (view === 'input') {
    return <TopicInputScreen onSubmitTopic={handleTopicSubmit} isLoading={isLoading} />;
  }

  const groupedInfographics = groupCardsByWidth(infographics);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 font-sans">
      <div className="text-center my-6">
        <button onClick={handleBackToInput} className="llm-button-secondary mb-4">
          &larr; New Topic
        </button>
        <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">{topic}</h1>
      </div>

      <div className="space-y-6">
        {groupedInfographics.map((group, groupIndex) => (
          <div key={groupIndex} className="animate-fade-in-up" style={{ animationDelay: `${groupIndex * 100}ms`}}>
            {group.layout === 'full' ? (
              renderCard(group.cards[0])
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {group.cards.map(card => renderCard(card))}
              </div>
            )}
          </div>
        ))}
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

export default App;