import { useState } from 'react';
import axios from 'axios';
import { SearchInput } from './components/SearchInput';
import { StatusCard } from './components/StatusCard';
import { WikiCard } from './components/WikiCard';
import { searchWikipedia, WikiResult } from './services/wikipedia';
import { GoogleSearchResult } from './services/googleSearch';
import { Baby } from 'lucide-react';
import styles from './App.module.css';

function App() {
  const [loading, setLoading] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState('');
  const [googleResult, setGoogleResult] = useState<GoogleSearchResult | null>(null);
  const [wikiResult, setWikiResult] = useState<WikiResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (query: string) => {
    setLoading(true);
    setSearchedQuery(query);
    setHasSearched(true);
    
    // Fetch Google Search Results via Netlify Function
    const fetchGoogleSearch = async (): Promise<GoogleSearchResult | null> => {
        try {
            const response = await axios.get(`/.netlify/functions/search?q=${encodeURIComponent(query)}`);
            return response.data;
        } catch (error) {
            console.error("Proxy Search Error", error);
            return null;
        }
    };

    const [wikiData, googleData] = await Promise.all([
      searchWikipedia(query),
      fetchGoogleSearch()
    ]);

    setWikiResult(wikiData);
    setGoogleResult(googleData);

    setLoading(false);
  };

  return (
    <div className={styles.minScreen}>
      <div className={styles.container}>
        
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <Baby className={styles.babyIcon} size={32} />
          </div>
          <h1 className={styles.title}>Can I Eat This?</h1>
          <p className={styles.subtitle}>Quick pregnancy food safety checker</p>
        </div>

        <div className={styles.searchWrapper}>
          <SearchInput onSearch={handleSearch} isLoading={loading} />
        </div>

        {loading ? (
          <div className={styles.loadingWrapper}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Analyzing search results...</p>
          </div>
        ) : hasSearched ? (
          <div className={styles.resultsWrapper}>
            <StatusCard 
              result={googleResult} 
              query={searchedQuery} 
            />
            
            <WikiCard data={wikiResult} query={searchedQuery} />

            {!googleResult && !wikiResult && (
              <div className={styles.fallbackCard}>
                <p className={styles.fallbackText}>We couldn't find any information about "{searchedQuery}".</p>
                <a 
                  href={`https://www.google.com/search?q=can+pregnant+women+eat+${encodeURIComponent(searchedQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.googleButton}
                >
                  Search Google Directly
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.suggestionsWrapper}>
            <p className={styles.suggestionsTitle}>Common Searches</p>
            <div className={styles.suggestionsGrid}>
              {['Sushi', 'Coffee', 'Soft Cheese', 'Salmon', 'Honey'].map((item) => (
                <button
                  key={item}
                  onClick={() => handleSearch(item)}
                  className={styles.suggestionButton}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.footer}>
          <p className={styles.disclaimer}>
            Disclaimer: This tool uses automated search results and may be inaccurate. 
            It does not constitute medical advice. Always consult with your healthcare provider.
          </p>
        </div>

      </div>
    </div>
  );
}

export default App;
