import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, HelpCircle, ExternalLink } from 'lucide-react';
import { GoogleSearchResult } from '../../services/googleSearch';
import styles from './StatusCard.module.css';

interface StatusCardProps {
  result: GoogleSearchResult | null;
  query: string;
}

export const StatusCard: React.FC<StatusCardProps> = ({ result, query }) => {
  if (!result) {
    return (
      <div className={`${styles.card} ${styles.unknownCard}`}>
        <div className={styles.content}>
          <HelpCircle className={styles.unknownIcon} size={32} />
          <div>
            <h2 className={styles.title}>No Analysis Available for "{query}"</h2>
            <p className={styles.description}>
              We couldn't determine the safety status automatically. Please check the detailed results below.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const config = {
    safe: {
      icon: CheckCircle,
      styleClass: styles.safe,
      textClass: styles.safeText,
      title: 'Likely Safe',
    },
    unsafe: {
      icon: XCircle,
      styleClass: styles.unsafe,
      textClass: styles.unsafeText,
      title: 'Not Safe',
    },
    caution: {
      icon: AlertTriangle,
      styleClass: styles.caution,
      textClass: styles.cautionText,
      title: 'Proceed with Caution',
    },
    unknown: {
      icon: HelpCircle,
      styleClass: styles.unknown,
      textClass: styles.unknownText,
      title: 'Unknown Status',
    },
  }[result.status];

  const Icon = config.icon;

  return (
    <div className={`${styles.card} ${config.styleClass}`}>
      <div className={styles.content}>
        <Icon className={`${config.textClass} ${styles.iconWrapper}`} size={40} />
        <div className="w-full">
          <h2 className={`${styles.resultTitle} ${config.textClass}`}>{config.title}</h2>
          <p className={styles.resultSummary}>{result.summary}</p>
          
          <div className={styles.snippetBox}>
            <p className={styles.snippetText}>"{result.snippet}"</p>
            <a 
              href={result.link}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.sourceLink}
            >
              Source: {result.source} <ExternalLink size={10} className={styles.linkIcon} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
