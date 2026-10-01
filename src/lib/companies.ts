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
  // Tagged by later catalog waves and missed here until 2026-10-01, when the
  // catalogue's Topics strip was found listing Oracle, Paytm, Swiggy and
  // twenty more as if they were techniques.
  "Oracle", "Salesforce", "Samsung", "Atlassian", "Rubrik", "Intuit", "Arcesium", "Databricks",
  "Morgan Stanley", "Nutanix", "Sprinklr", "Spotify",
  "Paytm", "Swiggy", "Cred", "Zomato", "Directi", "Ola", "Razorpay", "Freshworks", "Myntra",
  "Dream11", "Hotstar", "PhonePe",
];

/**
 * A company the catalogue once tagged under an old name, and the name it
 * goes by. "Facebook" and "Meta" were two hubs listing the same company's
 * problems (found by the 2026-09-30 SEO audit); the tags were renamed in
 * scripts/catalog and in each database by scripts/merge-company-tag.ts, and
 * the old hub address answers a 301 to the new one (services/seo.ts). The
 * old name stays in COMPANY_TAGS so a database not yet migrated still reads
 * it as a company rather than a topic.
 */
export const COMPANY_RENAMED: Readonly<Record<string, string>> = {
  Facebook: "Meta",
};

const COMPANY_SET = new Set(COMPANY_TAGS);

export const isCompanyTag = (tag: string): boolean => COMPANY_SET.has(tag);
