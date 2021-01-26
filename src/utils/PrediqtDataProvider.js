import { prediqtApi } from "../config";

const getUserShares = async (user) => {
  const response = await fetch(prediqtApi, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      // TODO: add title
      query: `{ user_profile(name: "${user}") { shares_owned { market { id state end_time resolution } asset { precision symbol} symbol quantity_available status } } }`,
    }),
  });
  const json = await response.json();
  return json.data.user_profile.shares_owned;
};

const getMarketInfo = async (marketId) => {
  const response = await fetch(prediqtApi, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `{
                market_by_id(id: ${marketId}) {
                  id
                  state
                  resolution
                  shares_outstanding
                  title
                  image
                  description
                  resolver {
                    name
                  }
                  resolution_description
                  end_time
                  category
                  tags
                }
              }
              `,
    }),
  });
  const json = await response.json();
  return json.data.market_by_id;
};

export { getUserShares, getMarketInfo };
