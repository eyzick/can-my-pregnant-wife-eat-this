import { Handler } from '@netlify/functions';
import axios from 'axios';

// Duplicate types here since we can't easily import from src outside of build
export type SafetyStatus = 'safe' | 'unsafe' | 'caution' | 'unknown';

export interface GoogleSearchResult {
  status: SafetyStatus;
  summary: string;
  snippet: string;
  source: string;
  link: string;
}

interface GoogleAPIItem {
  title: string;
  snippet: string;
  link: string;
}

const analyzeText = (text: string, originalQuery: string): SafetyStatus => {
  const lower = text.toLowerCase();
  const queryLower = originalQuery.toLowerCase();
  
  if (
    lower.includes('safe to eat') ||
    lower.includes('generally safe') ||
    lower.includes('fine to eat') ||
    lower.includes('can eat') ||
    lower.includes('good source') ||
    lower.includes('healthy') ||
    lower.includes('yes,') ||
    lower.includes('yes you can') ||
    lower.includes('perfectly safe')
  ) {
    if (
      !lower.includes('except') && 
      !lower.includes('unless') && 
      !lower.includes('only if')
    ) {
       return 'safe';
    }
  }
  
  if (lower.includes('cooked') || lower.includes('heating') || lower.includes('pasteurized')) {
      if (!lower.includes('avoid') && !lower.includes('unsafe')) {
          return 'safe';
      }
      return 'caution';
  }

  if (
      lower.includes('amniotic') || 
      lower.includes('labor') || 
      lower.includes('contraction') || 
      lower.includes('delivery') ||
      lower.includes('breastfeeding')
  ) {
      return 'unknown';
  }

  if (
    lower.includes('avoid') ||
    lower.includes('unsafe') ||
    lower.includes('do not eat') ||
    lower.includes('listeria') ||
    lower.includes('salmonella') ||
    lower.includes('toxoplasmosis') ||
    lower.includes('mercury') ||
    (lower.includes('raw') && !lower.includes('vegetable') && !lower.includes('fruit')) 
  ) {
    if (lower.includes('avoid')) {
         if (
             lower.includes('avoid anemia') ||
             lower.includes('avoid becoming') || 
             lower.includes('avoid infection') ||
             lower.includes('avoid sickness') ||
             lower.includes('avoid illness') ||
             lower.includes('avoid constipation')
         ) {
             return 'safe'; 
         }
    }

    if (
       (lower.includes('what not to eat') || lower.includes('foods to avoid')) &&
       !lower.includes('is unsafe') && 
       !lower.includes('is dangerous')
    ) {
        return 'unknown';
    }

    if (lower.includes('raw') && !queryLower.includes('raw')) {
        return 'caution';
    }

    return 'unsafe';
  }

  if (
    lower.includes('limit') ||
    lower.includes('moderation') ||
    lower.includes('small amount') ||
    lower.includes('consult') ||
    lower.includes('ask your doctor') ||
    lower.includes('caffeine') ||
    lower.includes('watch out') ||
    lower.includes('risk of') ||
    lower.includes('bacteria') ||
    lower.includes('parasite') ||
    lower.includes('harmful') ||
    lower.includes('danger') ||
    lower.includes('cooked thoroughly') || 
    lower.includes('pasteurized')
  ) {
    return 'caution';
  }
  
  if (lower.includes('safe')) {
      return 'caution';
  }

  return 'unknown';
};

const handler: Handler = async (event) => {
  const query = event.queryStringParameters?.q;
  
  if (!query) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing query parameter' }),
    };
  }

  const API_KEY = process.env.VITE_GOOGLE_API_KEY;
  const CX = process.env.VITE_GOOGLE_SEARCH_ENGINE_ID;

  if (!API_KEY || !CX) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error: Missing API keys' }),
    };
  }

  try {
    const searchQ = `can I eat ${query} while pregnant`;
    const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX}&q=${encodeURIComponent(searchQ)}`;
    
    const response = await axios.get(url);
    
    if (!response.data.items || response.data.items.length === 0) {
      return {
          statusCode: 200,
          body: JSON.stringify(null)
      };
    }

    const items: GoogleAPIItem[] = response.data.items;
    
    let bestStatus: SafetyStatus = 'unknown';
    let bestSnippet = '';
    let bestSource = '';
    let bestLink = '';

    const signals = {
        unsafe: 0,
        caution: 0,
        safe: 0,
        unknown: 0
    };
    
    let firstSafeItem = null;
    let firstUnsafeItem = null;
    let firstCautionItem = null;

    for (const item of items.slice(0, 5)) {
      const combinedText = item.snippet + ' ' + item.title;
      const status = analyzeText(combinedText, query);
      
      signals[status]++;

      if (status === 'safe' && !firstSafeItem) firstSafeItem = item;
      if (status === 'unsafe' && !firstUnsafeItem) firstUnsafeItem = item;
      if (status === 'caution' && !firstCautionItem) firstCautionItem = item;
    }

    if (signals.safe > 0 && signals.unsafe > 0) {
        if (signals.safe >= signals.unsafe) {
             bestStatus = 'safe';
             bestSnippet = firstSafeItem!.snippet;
             bestSource = firstSafeItem!.title;
             bestLink = firstSafeItem!.link;
        } else {
             bestStatus = 'caution';
             bestSnippet = firstUnsafeItem!.snippet;
             bestSource = firstUnsafeItem!.title;
             bestLink = firstUnsafeItem!.link;
        }
    } else if (signals.unsafe > 0) {
        bestStatus = 'unsafe';
        bestSnippet = firstUnsafeItem!.snippet;
        bestSource = firstUnsafeItem!.title;
        bestLink = firstUnsafeItem!.link;
    } else if (signals.caution > 0) {
        bestStatus = 'caution';
        bestSnippet = firstCautionItem!.snippet;
        bestSource = firstCautionItem!.title;
        bestLink = firstCautionItem!.link;
    } else if (signals.safe > 0) {
        bestStatus = 'safe';
        bestSnippet = firstSafeItem!.snippet;
        bestSource = firstSafeItem!.title;
        bestLink = firstSafeItem!.link;
    } else {
        bestStatus = 'unknown';
        bestSnippet = items[0].snippet;
        bestSource = items[0].title;
        bestLink = items[0].link;
    }

    if (bestStatus === 'unknown') {
      bestSnippet = items[0].snippet;
      bestSource = items[0].title;
      bestLink = items[0].link;
    }

    const result: GoogleSearchResult = {
      status: bestStatus,
      summary: bestStatus === 'unknown' 
        ? 'We could not automatically determine the safety. Please read the snippet below.' 
        : `Based on search results, this appears to be ${bestStatus}.`,
      snippet: bestSnippet,
      source: bestSource,
      link: bestLink
    };

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Google Search API Error:', error);
    
    if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500;
        
        if (status === 429) {
             return {
                statusCode: 200, // Return 200 so frontend can handle the quota object
                body: JSON.stringify({
                    status: 'unknown',
                    summary: 'Daily search quota exceeded.',
                    snippet: 'The free search limit for this app has been reached for today.',
                    source: 'System',
                    link: `https://www.google.com/search?q=can+pregnant+women+eat+${encodeURIComponent(query)}`
                })
             }
        }

        return {
            statusCode: status,
            body: JSON.stringify(error.response?.data || { error: 'Unknown API Error' }),
        };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};

export { handler };
