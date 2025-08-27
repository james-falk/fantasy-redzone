export interface FantasySite {
  id: string
  name: string
  url: string
  description: string
  category: string
  features: string[]
  rank: number
}

export const fantasySitesData: FantasySite[] = [
  // Major Sports Networks
  {
    id: 'espn',
    name: 'ESPN Fantasy Football',
    url: 'https://www.espn.com/fantasy/football/',
    description: 'Comprehensive fantasy football platform with expert rankings, analysis, and tools',
    category: 'Major Sports Network',
    features: ['Expert Rankings', 'Player Analysis', 'Mock Drafts', 'Trade Analyzer', 'Injury Updates'],
    rank: 1
  },
  {
    id: 'cbs-sports',
    name: 'CBS Sports Fantasy',
    url: 'https://www.cbssports.com/fantasy/football/',
    description: 'Professional fantasy football coverage with detailed player projections and rankings',
    category: 'Major Sports Network',
    features: ['Expert Rankings', 'Player Projections', 'Trade Evaluator', 'Waiver Wire', 'Start/Sit Advice'],
    rank: 2
  },
  {
    id: 'nfl-com',
    name: 'NFL.com Fantasy',
    url: 'https://fantasy.nfl.com/',
    description: 'Official NFL fantasy platform with league management and expert insights',
    category: 'Major Sports Network',
    features: ['Official Rankings', 'League Management', 'Player News', 'Draft Tools', 'Mobile App'],
    rank: 3
  },
  {
    id: 'yahoo-sports',
    name: 'Yahoo Sports Fantasy',
    url: 'https://sports.yahoo.com/fantasy/football/',
    description: 'Popular fantasy platform with comprehensive rankings and analysis',
    category: 'Major Sports Network',
    features: ['Expert Rankings', 'Player Analysis', 'Mock Drafts', 'Trade Center', 'Mobile App'],
    rank: 4
  },
  {
    id: 'fox-sports',
    name: 'FOX Sports Fantasy',
    url: 'https://www.foxsports.com/fantasy/football',
    description: 'FOX Sports fantasy football coverage with expert analysis and rankings',
    category: 'Major Sports Network',
    features: ['Expert Rankings', 'Player Analysis', 'Draft Guide', 'Weekly Picks', 'News Updates'],
    rank: 5
  },

  // Fantasy-Specific Platforms
  {
    id: 'fantasypros',
    name: 'FantasyPros',
    url: 'https://www.fantasypros.com/nfl/',
    description: 'Leading fantasy sports platform with consensus rankings and expert advice',
    category: 'Fantasy Platform',
    features: ['Consensus Rankings', 'Expert Advice', 'Trade Analyzer', 'Draft Assistant', 'Start/Sit Tool'],
    rank: 6
  },
  {
    id: 'rotowire',
    name: 'Rotowire',
    url: 'https://www.rotowire.com/football/',
    description: 'Comprehensive fantasy sports platform with detailed player analysis and rankings',
    category: 'Fantasy Platform',
    features: ['Player Rankings', 'News Updates', 'Injury Reports', 'Draft Guide', 'Lineup Optimizer'],
    rank: 7
  },
  {
    id: 'rotoworld',
    name: 'Rotoworld',
    url: 'https://www.rotoworld.com/football',
    description: 'Fantasy sports news and analysis with player rankings and updates',
    category: 'Fantasy Platform',
    features: ['Player News', 'Rankings', 'Injury Updates', 'Depth Charts', 'Trade Rumors'],
    rank: 8
  },
  {
    id: 'numberfire',
    name: 'NumberFire',
    url: 'https://www.numberfire.com/nfl',
    description: 'Analytics-driven fantasy football platform with projections and rankings',
    category: 'Fantasy Platform',
    features: ['Analytics Rankings', 'Projections', 'Trade Analyzer', 'Draft Kit', 'Lineup Optimizer'],
    rank: 9
  },
  {
    id: 'fantasyfootballcalculator',
    name: 'Fantasy Football Calculator',
    url: 'https://fantasyfootballcalculator.com/',
    description: 'Fantasy football tools and rankings with ADP data and draft analysis',
    category: 'Fantasy Platform',
    features: ['ADP Rankings', 'Mock Drafts', 'Trade Calculator', 'Draft Board', 'Player Rankings'],
    rank: 10
  },

  // Analytics and Data Sites
  {
    id: 'pro-football-reference',
    name: 'Pro Football Reference',
    url: 'https://www.pro-football-reference.com/',
    description: 'Comprehensive football statistics and historical data for fantasy analysis',
    category: 'Analytics',
    features: ['Historical Stats', 'Player Data', 'Team Stats', 'Advanced Metrics', 'Game Logs'],
    rank: 11
  },
  {
    id: 'footballoutsiders',
    name: 'Football Outsiders',
    url: 'https://www.footballoutsiders.com/',
    description: 'Advanced football analytics and metrics for fantasy football analysis',
    category: 'Analytics',
    features: ['Advanced Metrics', 'DVOA Rankings', 'Player Analysis', 'Team Efficiency', 'Statistical Models'],
    rank: 12
  },
  {
    id: 'pff',
    name: 'Pro Football Focus',
    url: 'https://www.pff.com/fantasy-football',
    description: 'Premium football analytics and player grades for fantasy football',
    category: 'Analytics',
    features: ['Player Grades', 'Analytics Rankings', 'Position Analysis', 'Matchup Data', 'Premium Content'],
    rank: 13
  },
  {
    id: 'sportradar',
    name: 'Sportradar',
    url: 'https://www.sportradar.com/fantasy-sports/',
    description: 'Sports data and analytics provider for fantasy sports platforms',
    category: 'Analytics',
    features: ['Live Data', 'Player Stats', 'Historical Data', 'API Access', 'Real-time Updates'],
    rank: 14
  },
  {
    id: 'stats-perform',
    name: 'Stats Perform',
    url: 'https://www.statsperform.com/fantasy-sports/',
    description: 'Sports data and analytics company providing fantasy sports insights',
    category: 'Analytics',
    features: ['Player Analytics', 'Team Data', 'Historical Stats', 'Projections', 'Market Data'],
    rank: 15
  },

  // Expert and Analysis Sites
  {
    id: 'theathletic',
    name: 'The Athletic',
    url: 'https://theathletic.com/fantasy-football/',
    description: 'Premium sports journalism with fantasy football analysis and rankings',
    category: 'Expert Analysis',
    features: ['Expert Rankings', 'In-depth Analysis', 'Player Profiles', 'Draft Strategy', 'Weekly Picks'],
    rank: 16
  },
  {
    id: 'sportingnews',
    name: 'Sporting News',
    url: 'https://www.sportingnews.com/us/fantasy-football',
    description: 'Sports news and fantasy football coverage with expert rankings',
    category: 'Expert Analysis',
    features: ['Expert Rankings', 'Player Analysis', 'Draft Guide', 'Weekly Picks', 'News Updates'],
    rank: 17
  },
  {
    id: 'usatoday',
    name: 'USA Today Fantasy',
    url: 'https://ftw.usatoday.com/category/fantasy/',
    description: 'USA Today fantasy sports coverage with expert analysis and rankings',
    category: 'Expert Analysis',
    features: ['Expert Rankings', 'Player Analysis', 'Draft Strategy', 'Weekly Advice', 'News Coverage'],
    rank: 18
  },
  {
    id: 'bleacherreport',
    name: 'Bleacher Report Fantasy',
    url: 'https://bleacherreport.com/fantasy-football',
    description: 'Sports media platform with fantasy football analysis and rankings',
    category: 'Expert Analysis',
    features: ['Expert Rankings', 'Player Analysis', 'Draft Guide', 'Weekly Picks', 'Community Content'],
    rank: 19
  },
  {
    id: 'sbnation',
    name: 'SB Nation Fantasy',
    url: 'https://www.sbnation.com/fantasy-football',
    description: 'Sports blog network with fantasy football coverage and analysis',
    category: 'Expert Analysis',
    features: ['Expert Rankings', 'Player Analysis', 'Draft Strategy', 'Weekly Picks', 'Community Discussion'],
    rank: 20
  },

  // Specialized Fantasy Sites
  {
    id: 'dynastyleaguefootball',
    name: 'Dynasty League Football',
    url: 'https://dynastyleaguefootball.com/',
    description: 'Specialized dynasty fantasy football analysis and rankings',
    category: 'Specialized',
    features: ['Dynasty Rankings', 'Rookie Analysis', 'Trade Value', 'Draft Strategy', 'Long-term Outlook'],
    rank: 21
  },
  {
    id: 'dynastynerds',
    name: 'Dynasty Nerds',
    url: 'https://dynastynerds.com/',
    description: 'Dynasty fantasy football analysis and rankings with expert insights',
    category: 'Specialized',
    features: ['Dynasty Rankings', 'Rookie Profiles', 'Trade Calculator', 'Draft Guide', 'Podcast'],
    rank: 22
  },
  {
    id: 'draftsharks',
    name: 'Draft Sharks',
    url: 'https://www.draftsharks.com/',
    description: 'Fantasy football analysis and projections with advanced metrics',
    category: 'Specialized',
    features: ['Player Projections', 'Injury Analysis', 'Draft Strategy', 'Weekly Picks', 'Advanced Stats'],
    rank: 23
  },
  {
    id: '4for4',
    name: '4for4 Fantasy Football',
    url: 'https://4for4.com/fantasy-football',
    description: 'Premium fantasy football analysis and rankings with advanced metrics',
    category: 'Specialized',
    features: ['Expert Rankings', 'Projections', 'Trade Analyzer', 'Draft Kit', 'Lineup Optimizer'],
    rank: 24
  },
  {
    id: 'footballguys',
    name: 'Footballguys',
    url: 'https://www.footballguys.com/',
    description: 'Comprehensive fantasy football analysis and rankings platform',
    category: 'Specialized',
    features: ['Expert Rankings', 'Player Analysis', 'Draft Guide', 'Trade Analyzer', 'Start/Sit Tool'],
    rank: 25
  },

  // Additional Major Sites
  {
    id: 'sports-illustrated',
    name: 'Sports Illustrated Fantasy',
    url: 'https://www.si.com/fantasy',
    description: 'Sports Illustrated fantasy sports coverage with expert analysis',
    category: 'Major Sports Network',
    features: ['Expert Rankings', 'Player Analysis', 'Draft Strategy', 'Weekly Picks', 'News Coverage'],
    rank: 26
  },
  {
    id: 'nbc-sports',
    name: 'NBC Sports Fantasy',
    url: 'https://www.nbcsports.com/fantasy',
    description: 'NBC Sports fantasy football coverage with expert rankings and analysis',
    category: 'Major Sports Network',
    features: ['Expert Rankings', 'Player Analysis', 'Draft Guide', 'Weekly Picks', 'News Updates'],
    rank: 27
  },
  {
    id: 'espn-plus',
    name: 'ESPN+ Fantasy',
    url: 'https://www.espn.com/espnplus/',
    description: 'ESPN premium content with exclusive fantasy football analysis',
    category: 'Major Sports Network',
    features: ['Premium Rankings', 'Expert Analysis', 'Draft Strategy', 'Weekly Picks', 'Exclusive Content'],
    rank: 28
  },
  {
    id: 'the-ringer',
    name: 'The Ringer Fantasy',
    url: 'https://www.theringer.com/fantasy-football',
    description: 'The Ringer fantasy football coverage with expert analysis and rankings',
    category: 'Expert Analysis',
    features: ['Expert Rankings', 'Player Analysis', 'Draft Strategy', 'Weekly Picks', 'Podcast Content'],
    rank: 29
  },
  {
    id: 'fivethirtyeight',
    name: 'FiveThirtyEight Fantasy',
    url: 'https://fivethirtyeight.com/tag/fantasy-football/',
    description: 'Data-driven fantasy football analysis and projections',
    category: 'Analytics',
    features: ['Analytics Rankings', 'Statistical Models', 'Player Projections', 'Data Analysis', 'Research'],
    rank: 30
  },

  // More Specialized Sites
  {
    id: 'playerprofiler',
    name: 'PlayerProfiler',
    url: 'https://www.playerprofiler.com/',
    description: 'Advanced player analytics and metrics for fantasy football',
    category: 'Analytics',
    features: ['Player Analytics', 'Advanced Metrics', 'Draft Guide', 'Trade Analyzer', 'Lineup Optimizer'],
    rank: 31
  },
  {
    id: 'establish-the-run',
    name: 'Establish The Run',
    url: 'https://establishtherun.com/',
    description: 'Premium fantasy football analysis and rankings platform',
    category: 'Specialized',
    features: ['Expert Rankings', 'Player Analysis', 'Draft Strategy', 'Weekly Picks', 'Premium Content'],
    rank: 32
  },
  {
    id: 'thefantasyfootballers',
    name: 'The Fantasy Footballers',
    url: 'https://www.thefantasyfootballers.com/',
    description: 'Fantasy football podcast and analysis platform with expert rankings',
    category: 'Specialized',
    features: ['Expert Rankings', 'Podcast Content', 'Draft Guide', 'Weekly Picks', 'Community'],
    rank: 33
  },
  {
    id: 'fantasyalarm',
    name: 'Fantasy Alarm',
    url: 'https://www.fantasyalarm.com/football/',
    description: 'Fantasy sports platform with comprehensive football analysis',
    category: 'Fantasy Platform',
    features: ['Expert Rankings', 'Player Analysis', 'Draft Guide', 'Trade Analyzer', 'Start/Sit Tool'],
    rank: 34
  },
  {
    id: 'fantasyguru',
    name: 'Fantasy Guru',
    url: 'https://www.fantasyguru.com/',
    description: 'Fantasy football analysis and rankings with expert insights',
    category: 'Specialized',
    features: ['Expert Rankings', 'Player Analysis', 'Draft Strategy', 'Weekly Picks', 'Premium Content'],
    rank: 35
  },

  // Additional Analytics Sites
  {
    id: 'sharpfootball',
    name: 'Sharp Football Analysis',
    url: 'https://www.sharpfootballanalysis.com/',
    description: 'Advanced football analytics and fantasy football insights',
    category: 'Analytics',
    features: ['Advanced Analytics', 'Player Analysis', 'Matchup Data', 'Statistical Models', 'Research'],
    rank: 36
  },
  {
    id: 'nextgenstats',
    name: 'Next Gen Stats',
    url: 'https://nextgenstats.nfl.com/',
    description: 'NFL advanced analytics and player tracking data',
    category: 'Analytics',
    features: ['Player Tracking', 'Advanced Metrics', 'Speed Data', 'Route Analysis', 'Performance Stats'],
    rank: 37
  },
  {
    id: 'truemedianetwork',
    name: 'True Media Network',
    url: 'https://truemedianetwork.com/',
    description: 'Fantasy sports analysis and rankings platform',
    category: 'Fantasy Platform',
    features: ['Expert Rankings', 'Player Analysis', 'Draft Guide', 'Weekly Picks', 'Community Content'],
    rank: 38
  },
  {
    id: 'fantasyfootballtoday',
    name: 'Fantasy Football Today',
    url: 'https://www.cbssports.com/fantasy/football/news/fantasy-football-today/',
    description: 'CBS Sports fantasy football analysis and rankings',
    category: 'Expert Analysis',
    features: ['Expert Rankings', 'Player Analysis', 'Draft Strategy', 'Weekly Picks', 'News Updates'],
    rank: 39
  },
  {
    id: 'fantasyfootballindex',
    name: 'Fantasy Football Index',
    url: 'https://www.fantasyindex.com/',
    description: 'Fantasy football magazine and online analysis platform',
    category: 'Specialized',
    features: ['Expert Rankings', 'Player Analysis', 'Draft Guide', 'Weekly Picks', 'Magazine Content'],
    rank: 40
  },

  // More Expert Sites
  {
    id: 'fantasyfootballstarters',
    name: 'Fantasy Football Starters',
    url: 'https://www.fantasyfootballstarters.com/',
    description: 'Fantasy football analysis and rankings with expert advice',
    category: 'Expert Analysis',
    features: ['Expert Rankings', 'Player Analysis', 'Draft Strategy', 'Weekly Picks', 'Start/Sit Advice'],
    rank: 41
  },
  {
    id: 'fantasyfootballmetrics',
    name: 'Fantasy Football Metrics',
    url: 'https://www.fantasyfootballmetrics.com/',
    description: 'Analytics-driven fantasy football analysis and rankings',
    category: 'Analytics',
    features: ['Analytics Rankings', 'Player Metrics', 'Statistical Models', 'Draft Analysis', 'Research'],
    rank: 42
  },
  {
    id: 'fantasyfootballnerd',
    name: 'Fantasy Football Nerd',
    url: 'https://www.fantasyfootballnerd.com/',
    description: 'Fantasy football analysis and rankings platform',
    category: 'Fantasy Platform',
    features: ['Expert Rankings', 'Player Analysis', 'Draft Guide', 'Trade Analyzer', 'Lineup Optimizer'],
    rank: 43
  },
  {
    id: 'fantasyfootballscout',
    name: 'Fantasy Football Scout',
    url: 'https://www.fantasyfootballscout.co.uk/',
    description: 'Fantasy football analysis and rankings with expert insights',
    category: 'Expert Analysis',
    features: ['Expert Rankings', 'Player Analysis', 'Draft Strategy', 'Weekly Picks', 'Community'],
    rank: 44
  },
  {
    id: 'fantasyfootballinsider',
    name: 'Fantasy Football Insider',
    url: 'https://www.fantasyfootballinsider.com/',
    description: 'Fantasy football analysis and rankings platform',
    category: 'Expert Analysis',
    features: ['Expert Rankings', 'Player Analysis', 'Draft Guide', 'Weekly Picks', 'Premium Content'],
    rank: 45
  },

  // Additional Platforms (replacing duplicates with new unique sites)
  {
    id: 'fantasyfootballcalculator-pro',
    name: 'Fantasy Football Calculator Pro',
    url: 'https://fantasyfootballcalculator.com/pro',
    description: 'Premium fantasy football tools and advanced ADP analysis',
    category: 'Fantasy Platform',
    features: ['Advanced ADP', 'Premium Tools', 'Trade Calculator', 'Draft Board', 'Player Rankings'],
    rank: 46
  },
  {
    id: 'fantasyfootballtoday-cbs',
    name: 'CBS Fantasy Football Today',
    url: 'https://www.cbssports.com/fantasy/football/',
    description: 'CBS Sports dedicated fantasy football analysis and rankings',
    category: 'Expert Analysis',
    features: ['Expert Rankings', 'Player Analysis', 'Draft Strategy', 'Weekly Picks', 'News Updates'],
    rank: 47
  },
  {
    id: 'fantasyfootballindex-magazine',
    name: 'Fantasy Football Index Magazine',
    url: 'https://www.fantasyindex.com/magazine',
    description: 'Print and digital fantasy football magazine with expert analysis',
    category: 'Specialized',
    features: ['Expert Rankings', 'Player Analysis', 'Draft Guide', 'Weekly Picks', 'Magazine Content'],
    rank: 48
  },
  {
    id: 'fantasyfootballstarters-pro',
    name: 'Fantasy Football Starters Pro',
    url: 'https://www.fantasyfootballstarters.com/pro',
    description: 'Premium fantasy football analysis and expert advice platform',
    category: 'Expert Analysis',
    features: ['Expert Rankings', 'Player Analysis', 'Draft Strategy', 'Weekly Picks', 'Start/Sit Advice'],
    rank: 49
  },
  {
    id: 'fantasyfootballmetrics-pro',
    name: 'Fantasy Football Metrics Pro',
    url: 'https://www.fantasyfootballmetrics.com/pro',
    description: 'Advanced analytics-driven fantasy football analysis and rankings',
    category: 'Analytics',
    features: ['Advanced Analytics', 'Player Metrics', 'Statistical Models', 'Draft Analysis', 'Research'],
    rank: 50
  }
]
