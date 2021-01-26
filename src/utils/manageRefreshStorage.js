export default class ManageRefreshStorage {
  constructor(queryString, setRefreshQuery, setRefreshArray) {
    this.queryString = queryString;
    this.setRefreshQuery = setRefreshQuery;
    this.setRefreshArray = setRefreshArray;
  }

  setRefreshStorage() {
    this.setRefreshQuery(this.queryString);
    localStorage.setItem("RefreshTokens", this.queryString);
    const refreshTimeout = new Date().getTime() + 180000;
    localStorage.setItem("RefreshTimeout", refreshTimeout);
  }

  checkRefreshStorage() {
    const timeNow = new Date().getTime();
    const timeExpire = parseInt(localStorage.getItem("RefreshTimeout"), 10);
    if (timeNow > timeExpire) {
      this.setRefreshArray([]);
    }
  }

  static clearRefreshItems() {
    localStorage.removeItem("RefreshTimeout");
    localStorage.removeItem("RefreshTokens");
  }

  static getRefreshQuery() {
    return localStorage.getItem("RefreshTokens");
  }

  static timeExpireInt() {
    return parseInt(localStorage.getItem("RefreshTimeout"), 10);
  }
}

export const buildRefreshQuery = (refreshArray) => {
  let queryString = "";
  const uniqueRefreshArray = [
    ...new Map(refreshArray.map((item) => [item.name, item])).values(),
  ];
  uniqueRefreshArray.forEach(
    (token) => (queryString = `${queryString}${token.contract}-${token.name},`)
  );
  return queryString;
};
