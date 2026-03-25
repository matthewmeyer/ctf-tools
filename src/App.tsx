import { useState } from 'react';
import {
  FluentProvider,
  webLightTheme,
  makeStyles,
  tokens,
  Text,
  Button,
  Tooltip,
} from '@fluentui/react-components';
import {
  ArrowSwap24Regular,
  LockClosed24Regular,
  DataBarVertical24Regular,
  NumberSymbol24Regular,
  Key24Regular,
  ShieldKeyhole24Regular,
  TextSortAscending24Regular,
  Grid24Regular,
  Braces24Regular,
  ArrowSync24Regular,
  LinkMultiple24Regular,
  DocumentText24Regular,
  MathSymbols24Regular,
  CalendarLtr24Regular,
} from '@fluentui/react-icons';
import { BaseConverter } from './components/BaseConverter';
import { UrlHtmlEncoder } from './components/UrlHtmlEncoder';
import { HexAsciiUnicode } from './components/HexAsciiUnicode';
import { CaesarCipher } from './components/CaesarCipher';
import { VigenereCipher } from './components/VigenereCipher';
import { SubstitutionCipher } from './components/SubstitutionCipher';
import { RailFenceCipher } from './components/RailFenceCipher';
import { XorCipher } from './components/XorCipher';
import { ClassicalCiphers } from './components/ClassicalCiphers';
import { FrequencyAnalysis } from './components/FrequencyAnalysis';
import { IocCalculator } from './components/IocCalculator';
import { EntropyCalculator } from './components/EntropyCalculator';
import { ChiSquaredScorer } from './components/ChiSquaredScorer';
import { NumberSeries } from './components/NumberSeries';
import './App.css';

const useStyles = makeStyles({
  layout: {
    display: 'flex',
    minHeight: '100vh',
  },
  sidebar: {
    width: '56px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    flexShrink: 0,
  },
  sidebarExpanded: {
    width: '220px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    flexShrink: 0,
  },
  sidebarHeader: {
    padding: tokens.spacingVerticalM,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  categoryLabel: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    fontWeight: 600 as unknown as string,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
    cursor: 'pointer',
    borderRadius: tokens.borderRadiusMedium,
    marginLeft: tokens.spacingHorizontalXS,
    marginRight: tokens.spacingHorizontalXS,
    marginBottom: '2px',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  navItemActive: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
    cursor: 'pointer',
    borderRadius: tokens.borderRadiusMedium,
    marginLeft: tokens.spacingHorizontalXS,
    marginRight: tokens.spacingHorizontalXS,
    marginBottom: '2px',
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
  },
  navItemCollapsed: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXS,
    cursor: 'pointer',
    borderRadius: tokens.borderRadiusMedium,
    margin: '2px 4px',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  navItemCollapsedActive: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXS,
    cursor: 'pointer',
    borderRadius: tokens.borderRadiusMedium,
    margin: '2px 4px',
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
  },
  content: {
    flex: 1,
    overflow: 'auto',
    backgroundColor: tokens.colorNeutralBackground3,
  },
  contentInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: tokens.spacingVerticalL,
  },
});

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  category: string;
}

const navItems: NavItem[] = [
  // Encoding
  {
    id: 'base-converter',
    label: 'Base Converter',
    icon: <ArrowSwap24Regular />,
    category: 'Encoding',
  },
  { id: 'url-html', label: 'URL / HTML', icon: <LinkMultiple24Regular />, category: 'Encoding' },
  { id: 'hex-ascii', label: 'Hex / ASCII', icon: <Braces24Regular />, category: 'Encoding' },
  // Ciphers
  { id: 'caesar', label: 'Caesar / ROT-N', icon: <ArrowSync24Regular />, category: 'Ciphers' },
  { id: 'vigenere', label: 'Vigenère', icon: <Key24Regular />, category: 'Ciphers' },
  {
    id: 'substitution',
    label: 'Substitution',
    icon: <TextSortAscending24Regular />,
    category: 'Ciphers',
  },
  { id: 'rail-fence', label: 'Rail Fence', icon: <Grid24Regular />, category: 'Ciphers' },
  { id: 'xor', label: 'XOR', icon: <LockClosed24Regular />, category: 'Ciphers' },
  {
    id: 'classical',
    label: 'Atbash/Affine/Playfair',
    icon: <ShieldKeyhole24Regular />,
    category: 'Ciphers',
  },
  // Analysis
  {
    id: 'frequency',
    label: 'Frequency Analysis',
    icon: <DataBarVertical24Regular />,
    category: 'Analysis',
  },
  {
    id: 'ioc',
    label: 'Index of Coincidence',
    icon: <NumberSymbol24Regular />,
    category: 'Analysis',
  },
  { id: 'entropy', label: 'Entropy', icon: <MathSymbols24Regular />, category: 'Analysis' },
  {
    id: 'chi-squared',
    label: 'Chi-Squared Scorer',
    icon: <DocumentText24Regular />,
    category: 'Analysis',
  },
  {
    id: 'number-series',
    label: 'Number Series',
    icon: <CalendarLtr24Regular />,
    category: 'Analysis',
  },
];

function renderTool(toolId: string) {
  switch (toolId) {
    case 'base-converter':
      return <BaseConverter />;
    case 'url-html':
      return <UrlHtmlEncoder />;
    case 'hex-ascii':
      return <HexAsciiUnicode />;
    case 'caesar':
      return <CaesarCipher />;
    case 'vigenere':
      return <VigenereCipher />;
    case 'substitution':
      return <SubstitutionCipher />;
    case 'rail-fence':
      return <RailFenceCipher />;
    case 'xor':
      return <XorCipher />;
    case 'classical':
      return <ClassicalCiphers />;
    case 'frequency':
      return <FrequencyAnalysis />;
    case 'ioc':
      return <IocCalculator />;
    case 'entropy':
      return <EntropyCalculator />;
    case 'chi-squared':
      return <ChiSquaredScorer />;
    case 'number-series':
      return <NumberSeries />;
    default:
      return <Text>Select a tool from the sidebar</Text>;
  }
}

function App() {
  const styles = useStyles();
  const [activeTool, setActiveTool] = useState('base-converter');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const categories = Array.from(new Set(navItems.map((n) => n.category)));

  return (
    <FluentProvider theme={webLightTheme}>
      <div className={styles.layout}>
        <div className={sidebarExpanded ? styles.sidebarExpanded : styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <Button
              appearance="subtle"
              size="small"
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              title={sidebarExpanded ? 'Collapse' : 'Expand'}
            >
              {sidebarExpanded ? '◀' : '▶'}
            </Button>
            {sidebarExpanded && (
              <Text weight="bold" size={400} style={{ marginLeft: tokens.spacingHorizontalS }}>
                CTF Tools
              </Text>
            )}
          </div>

          {categories.map((cat) => (
            <div key={cat}>
              {sidebarExpanded && <div className={styles.categoryLabel}>{cat}</div>}
              {navItems
                .filter((n) => n.category === cat)
                .map((item) =>
                  sidebarExpanded ? (
                    <div
                      key={item.id}
                      className={activeTool === item.id ? styles.navItemActive : styles.navItem}
                      onClick={() => setActiveTool(item.id)}
                    >
                      {item.icon}
                      <Text size={200}>{item.label}</Text>
                    </div>
                  ) : (
                    <Tooltip
                      key={item.id}
                      content={item.label}
                      relationship="label"
                      positioning="after"
                    >
                      <div
                        className={
                          activeTool === item.id
                            ? styles.navItemCollapsedActive
                            : styles.navItemCollapsed
                        }
                        onClick={() => setActiveTool(item.id)}
                      >
                        {item.icon}
                      </div>
                    </Tooltip>
                  ),
                )}
            </div>
          ))}
        </div>

        <div className={styles.content}>
          <div className={styles.contentInner}>{renderTool(activeTool)}</div>
        </div>
      </div>
    </FluentProvider>
  );
}

export default App;
