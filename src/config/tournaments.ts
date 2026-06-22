// src/config/tournaments.ts

export interface TournamentConfig {
  slug: string; // Used for the URL path (e.g., /standings/monday-night)
  name: string; // Displays as the title header banner
  description: string; // Displays on the dashboard hub page
  csvUrl: string; // The remote website URL to fetch data from
  dates: string | string[]; // New: Supports a single string range or an array of specific dates
  location: string; // New: Tracks alley/center name and city venue
}

// Global Site Configurations Interface
export interface SiteConfig {
  tabName: string; // Browser Tab / Document Title metadata
  pageTitle: string; // Main visible H1 heading on the index page
}

export const siteConfig: SiteConfig = {
  tabName: "CA USBC Leaderboard",
  pageTitle: "Champaign Area USBC Tournament Standings",
};

export const tournaments: TournamentConfig[] = [
  {
    slug: "Association-Championships",
    name: "2025 Association Championships Team",
    description:
      "Our annual team tournament with a mix of scratch and handicap scoring, featuring both singles and doubles events.",
    csvUrl:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQpNlgEre6fJCkz-cGIF5sh4tRPX9S58RwazK-kVe0shUnHpDCyrH0M88AiB83bix9skBLw3hhXR428/pub?gid=1111824680&single=true&output=csv",
    dates: ["Sept 14, 2025", "Oct 12, 2025", "Nov 09, 2025"], // Array of individual event dates format
    location: "Arrowhead Lanes, Champaign, IL",
  },
  {
    slug: "baker-scotch-doubles",
    name: "Baker Scotch Doubles",
    description:
      "A fun doubles tournament where partners alternate frames, combining their scores for a unique team dynamic.",
    csvUrl: "https://c-ubowl.com/wp-content/uploads/2026/06/bowling.csv",
    dates: "Dec 7, 2025 at 1:00 PM", // General schedule string format
    location: "Arrowhead Lanes, Champaign, IL",
  },
  {
    slug: "twin-city-cup",
    name: "Twin City Cup",
    description:
      "End of season invitational tournament featuring the bowlers with the most individual points from the regular season, competing for the prestigious Twin City Cup.",
    csvUrl: "https://c-ubowl.com/wp-content/uploads/2026/06/bowling.csv",
    dates: "June 15, 2025 - June 22, 2025", // String continuous range format
    location: "Old Orchard Lanes and Links, Savoy, IL",
  },
];
