/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */

// --- Data Structures for Chart.js ---
export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  tension?: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

// --- Citation Data Structure ---
export interface Source {
  title: string;
  uri: string;
}

// --- Infographic Card Data Structures ---
// Shared property for layout control
type CardWidth = 'full' | 'half';

export interface TitleCardData {
  type: 'title';
  title: string;
  width?: CardWidth;
}

export interface TextCardData {
  type: 'text';
  icon?: string;
  content: string;
  sources?: Source[];
  width?: CardWidth;
}

export interface KPIData {
  icon?: string;
  value: string;
  label: string;
}

export interface KPICardData {
  type: 'kpi';
  items: KPIData[];
  sources?: Source[];
  width?: CardWidth;
}

export interface ChartCardData {
  type: 'chart';
  chartType: 'bar' | 'line' | 'pie' | 'doughnut';
  title: string;
  data: ChartData;
  sources?: Source[];
  width?: CardWidth;
}

export interface QuoteCardData {
    type: 'quote';
    content: string;
    author: string;
    icon?: string;
    sources?: Source[];
    width?: CardWidth;
}

export interface TimelineEvent {
    date: string;
    title: string;
    description: string;
}

export interface TimelineCardData {
    type: 'timeline';
    title: string;
    events: TimelineEvent[];
    sources?: Source[];
    width?: CardWidth;
}

export interface SimileCardData {
  type: 'simile';
  input: string;
  similes: string[];
  width?: CardWidth;
}

export interface ExplodeCardData {
  type: 'explode';
  input: string;
  explosions: string[];
  width?: CardWidth;
}

export interface UnexpectCardData {
  type: 'unexpect';
  input: string;
  unexpecteds: string[];
  width?: CardWidth;
}

export interface ChainCardData {
  type: 'chain';
  input: string;
  chain: string[];
  width?: CardWidth;
}

export interface POVCardData {
  type: 'pov';
  input: string;
  perspectives: string[];
  width?: CardWidth;
}

export interface AlliterationCardData {
  type: 'alliteration';
  topic: string;
  letter: string;
  words: string[];
  width?: CardWidth;
}

export interface AcronymCardData {
  type: 'acronym';
  input: string;
  acronyms: string[];
  width?: CardWidth;
}

export interface FuseCardData {
  type: 'fuse';
  concept1: string;
  concept2: string;
  fusions: string[];
  width?: CardWidth;
}

export interface SceneCardData {
  type: 'scene';
  input: string;
  details: string[];
  width?: CardWidth;
}

export interface UnfoldCardData {
  type: 'unfold';
  input: string;
  unfolds: string[];
  width?: CardWidth;
}

export type InfographicCardData =
  | TitleCardData
  | TextCardData
  | KPICardData
  | ChartCardData
  | QuoteCardData
  | TimelineCardData
  | SimileCardData
  | ExplodeCardData
  | UnexpectCardData
  | ChainCardData
  | POVCardData
  | AlliterationCardData
  | AcronymCardData
  | FuseCardData
  | SceneCardData
  | UnfoldCardData;


// --- Component Prop Types ---
export interface ChartCardProps {
    title: string;
    chartType: 'bar' | 'line' | 'pie' | 'doughnut';
    data: ChartData;
}