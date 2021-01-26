import { mindswapApi } from "../config";

const getUserTokens = async (accountName) => {
  const response = await fetch(
    `${mindswapApi}/api/balances?account=${accountName}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );
  return await response.json();
};

const getRefreshTokens = async (accountName, query) => {
  const response = await fetch(
    `${mindswapApi}/api/balances?account=${accountName}&refresh=${query}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );
  return await response.json();
};

const getTokens = async () => {
  const response = await fetch(`${mindswapApi}/api/tokens`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return await response.json();
};

const getUserPools = async (accountName) => {
  const response = await fetch(
    `${mindswapApi}/api/userPools?account=${accountName}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );
  return await response.json();
};

export { getUserTokens, getRefreshTokens, getTokens, getUserPools };
