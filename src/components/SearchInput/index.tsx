import React, { useState } from 'react';
import { Search } from 'lucide-react';
import styles from './SearchInput.module.css';

interface SearchInputProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.wrapper}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Can I eat..."
          className={styles.input}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className={styles.button}
        >
          <Search size={24} />
        </button>
      </div>
    </form>
  );
};
