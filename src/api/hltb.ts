import { requestUrl } from 'obsidian';

const HLTB_BASE_URL = 'https://howlongtobeat.com';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

// Declare global console for ESLint
declare const console: Console;

export interface HltbResult {
  id: number;
  name: string;
  imageUrl: string;
  mainStoryHours: number;
  mainPlusExtrasHours: number;
  completionistHours: number;
}

interface HltbSearchResponse {
  data: HltbGameData[];
}

interface HltbGameData {
  game_id: number;
  game_name: string;
  game_image: string;
  comp_main: number;
  comp_plus: number;
  comp_100: number;
  comp_all: number;
  comp_all_count: number;
}

export class HltbClient {
  private authToken: string | null = null;
  private searchUrl: string = '/api/search';

  private async fetchAuthToken(): Promise<string | null> {
    try {
      const timestamp = Date.now();
      const response = await requestUrl({
        url: `${HLTB_BASE_URL  }/api/search/init?t=${  timestamp}`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Origin: HLTB_BASE_URL,
          Referer: `${HLTB_BASE_URL  }/`,
          'User-Agent': USER_AGENT,
        },
      });

      const data = response.json;
      if (data?.token) {
        return data.token;
      }
    } catch (error) {
      console.error('HLTB: Error fetching auth token', error);
    }
    return null;
  }

  private async discoverSearchUrl(): Promise<string> {
    try {
      const homeResponse = await requestUrl({
        url: HLTB_BASE_URL,
        method: 'GET',
        headers: { 'User-Agent': USER_AGENT },
      });

      const html = homeResponse.text;
      const scriptMatch = html.match(/src="(\/_next\/static\/chunks\/pages\/_app-[^"]+\.js)"/);
      if (!scriptMatch) {
        return '/api/search';
      }

      const scriptUrl = HLTB_BASE_URL + scriptMatch[1];
      const scriptResponse = await requestUrl({
        url: scriptUrl,
        method: 'GET',
        headers: { 'User-Agent': USER_AGENT },
      });

      const scriptText = scriptResponse.text;
      const pattern = /fetch\s*\(\s*["']\/api\/([a-zA-Z0-9_/]+)[^"']*["']\s*,\s*\{[^}]*method:\s*["']POST["']/gi;
      const matches = pattern.exec(scriptText);

      if (matches && matches[1]) {
        const pathSuffix = matches[1];
        const basePath = pathSuffix.includes('/') ? pathSuffix.split('/')[0] : pathSuffix;
        if (basePath !== 'find') {
          return `/api/${  basePath}`;
        }
      }
    } catch (error) {
      console.error('HLTB: Error discovering search URL', error);
    }
    return '/api/search';
  }

  private async ensureInitialized(): Promise<boolean> {
    if (!this.authToken) {
      this.authToken = await this.fetchAuthToken();
      if (!this.authToken) return false;
    }
    if (this.searchUrl === '/api/search') {
      this.searchUrl = await this.discoverSearchUrl();
    }
    return true;
  }

  async searchGame(gameName: string): Promise<HltbResult | null> {
    try {
      if (!(await this.ensureInitialized())) {
        return null;
      }

      const payload = {
        searchType: 'games',
        searchTerms: gameName.split(' '),
        searchPage: 1,
        size: 20,
        searchOptions: {
          games: {
            userId: 0,
            platform: '',
            sortCategory: 'name',
            rangeCategory: 'main',
            rangeTime: { min: 0, max: 0 },
            gameplay: { perspective: '', flow: '', genre: '', difficulty: '' },
            modifier: 'hide_dlc',
          },
          users: {},
          filter: '',
          sort: 0,
          randomizer: 0,
        },
      };

      const response = await requestUrl({
        url: HLTB_BASE_URL + this.searchUrl,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': USER_AGENT,
          Origin: HLTB_BASE_URL,
          Referer: `${HLTB_BASE_URL  }/`,
          'x-auth-token': this.authToken!,
        },
        body: JSON.stringify(payload),
      });

      const data = response.json as HltbSearchResponse;
      if (!data.data || data.data.length === 0) {
        return null;
      }

      const normalizedSearchName = this.normalize(gameName);
      let bestMatch = data.data.find(
        (g) => this.normalize(g.game_name) === normalizedSearchName
      );

      if (!bestMatch) {
        bestMatch = data.data.reduce((best, current) => {
          const bestDist = this.levenshtein(this.normalize(best.game_name), normalizedSearchName);
          const currentDist = this.levenshtein(this.normalize(current.game_name), normalizedSearchName);
          if (currentDist === bestDist) {
            return current.comp_all_count > best.comp_all_count ? current : best;
          }
          return currentDist < bestDist ? current : best;
        }, data.data[0]);
      }

      return this.mapToResult(bestMatch);
    } catch (error) {
      console.error('HLTB search error:', error);
      this.authToken = null;
      return null;
    }
  }

  private normalize(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private mapToResult(game: HltbGameData): HltbResult {
    return {
      id: game.game_id,
      name: game.game_name,
      imageUrl: game.game_image ? `${HLTB_BASE_URL  }/games/${  game.game_image}` : '',
      mainStoryHours: this.secondsToHours(game.comp_main),
      mainPlusExtrasHours: this.secondsToHours(game.comp_plus),
      completionistHours: this.secondsToHours(game.comp_100),
    };
  }

  private secondsToHours(seconds: number): number {
    if (!seconds || seconds === 0) return 0;
    return Math.round((seconds / 3600) * 10) / 10;
  }

  private levenshtein(s1: string, s2: string): number {
    const m = s1.length;
    const n = s2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }
    return dp[m][n];
  }
}
