/**
 * Company names carried in `Problem.tags`.
 *
 * The catalogue stores topics ("Array"), sources ("GFG", "LeetCode 453") and
 * hiring companies ("Amazon") in one Json array; this is the list that tells
 * the two apart. GET /api/problems/companies derives its chips from it, and
 * the catalogue page's Topics filter uses it to leave companies out. Add a
 * name here when a catalog wave introduces a new one — an unlisted company
 * still filters (it is just a tag) but never gets a chip.
 */
export const COMPANY_TAGS: readonly string[] = [
  "Amazon", "Google", "Adobe", "Microsoft", "Meta", "Facebook", "Apple", "Bloomberg", "Uber",
  "Airbnb", "LinkedIn", "Goldman Sachs", "Palantir", "Two Sigma", "Twitter", "Snapchat", "Dropbox",
  "Walmart", "Yahoo", "Hulu", "Indeed", "Yelp", "LiveRamp", "Capital One", "Epic Systems",
  "Riot Games", "Mathworks", "Flipkart",
  // Indian service-based hiring rounds
  "TCS", "Infosys", "Wipro", "Capgemini", "Cognizant", "Accenture", "Zoho", "HCL",
  "Tech Mahindra", "Mphasis", "Virtusa", "Mindtree",
];

const COMPANY_SET = new Set(COMPANY_TAGS);

export const isCompanyTag = (tag: string): boolean => COMPANY_SET.has(tag);
