import axios from 'axios';

export interface WikiResult {
  title: string;
  extract: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  pageid: number;
}

export const searchWikipedia = async (query: string): Promise<WikiResult | null> => {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const searchResponse = await axios.get(searchUrl);
    
    if (!searchResponse.data.query.search || searchResponse.data.query.search.length === 0) {
      return null;
    }

    const bestMatch = searchResponse.data.query.search[0];
    const pageId = bestMatch.pageid;

    const detailsUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&exintro&explaintext&pithumbsize=300&pageids=${pageId}&format=json&origin=*`;
    const detailsResponse = await axios.get(detailsUrl);
    
    const page = detailsResponse.data.query.pages[pageId];
    
    return {
      title: page.title,
      extract: page.extract,
      thumbnail: page.thumbnail,
      pageid: pageId
    };
  } catch (error) {
    console.error("Wiki API Error:", error);
    return null;
  }
};
