import React from 'react';
import { WikiResult } from '../../services/wikipedia';
import { ExternalLink } from 'lucide-react';
import styles from './WikiCard.module.css';

interface WikiCardProps {
  data: WikiResult | null;
  query: string;
}

export const WikiCard: React.FC<WikiCardProps> = ({ data, query }) => {
  if (!data) return null;

  return (
    <div className={styles.card}>
      <div className={styles.inner}>
        <h3 className={styles.label}>General Information</h3>
        
        <div className={styles.contentWrapper}>
          {data.thumbnail && (
            <img 
              src={data.thumbnail.source} 
              alt={data.title} 
              className={styles.thumbnail}
            />
          )}
          <div className={styles.textColumn}>
            <h4 className={styles.title}>{data.title}</h4>
            <p className={styles.extract}>
              {data.extract}
            </p>
            <div className={styles.actions}>
              <a 
                href={`https://en.wikipedia.org/?curid=${data.pageid}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.linkBase} ${styles.wikiLink}`}
              >
                Read on Wikipedia <ExternalLink size={14} className={styles.icon} />
              </a>
              <a 
                href={`https://www.google.com/search?q=can+pregnant+women+eat+${encodeURIComponent(query)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.linkBase} ${styles.googleLink}`}
              >
                Search on Google <ExternalLink size={14} className={styles.icon} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
