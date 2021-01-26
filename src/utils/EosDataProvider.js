import { JsonRpc } from "eosjs";
import * as eosCommon from "eos-common";
import { mindswapContract, rpcProtocol, rpcHost, rpcPort } from "../config";

const { asset, number_to_asset: numberToAsset } = eosCommon;

const customizedFetch = (input, init) => {
  return fetch(input, init);
};

const rpc = new JsonRpc(`${rpcProtocol}://${rpcHost}:${rpcPort}`,
  { fetch: customizedFetch }
);

const getPoolInfo = async (pool) => {
  return rpc.get_table_rows({
    json: true,
    code: mindswapContract,
    scope: pool,
    table: "stat",
    limit: 1,
    reverse: false,
    show_payer: false,
  });
};

const formatTokenBalance = (item) => {
  return item.balance / 10 ** item.precision;
};

const mergePoolObjects = (source, target) => {
  const newSource = source;
  newSource.formatBalance = formatTokenBalance(newSource);
  const ratio = newSource.formatBalance / parseInt(target.json.supply, 10);
  newSource.ratio = (parseFloat(ratio) * 100).toFixed(4);

  const liq1 = asset(target.json.pool1.quantity);
  newSource.marketLiq1 = liq1.toString();
  liq1.set_amount(Math.round(liq1.amount * ratio));
  newSource.liquidity1 = liq1.toString();

  const liq2 = asset(target.json.pool2.quantity);
  newSource.marketLiq2 = liq2.toString();
  liq2.set_amount(Math.round(liq2.amount * ratio));
  newSource.liquidity2 = liq2.toString();

  return newSource;
};

const getUserTokens = async (tokenContract, accountName) => {
  return rpc.get_table_rows({
    json: true,
    code: tokenContract,
    scope: accountName,
    table: "accounts",
    limit: 200,
    reverse: false,
    show_payer: false,
  });
};

const amountToAsset = (amount = "0", currentAsset) => {
  if (isNaN(amount)) {
    return asset(`0 ${currentAsset.symbol.code().toString()}`);
  }

  const chunks = amount.split(".");
  const integer = chunks[0].substring(0, 10);
  const decimal = chunks[1] || "0";
  const validAmount = parseFloat(`${integer}.${decimal}`).toFixed(
    currentAsset.symbol.precision()
  );

  return asset(`${validAmount} ${currentAsset.symbol.code().toString()}`);
};

const computeForward = (x, y, z, fee) => {
  const prod = x.multiply(y);
  let tmp;
  let tmpFee;

  if (x > 0) {
    tmp = prod.minus(1).divide(z).plus(1);
    tmpFee = tmp.multiply(fee).plus(9999).divide(10000);
  } else {
    tmp = prod.divide(z);
    tmpFee = tmp.multiply(-1).multiply(fee).plus(9999).divide(10000);
  }

  return tmp.plus(tmpFee);
};

const computeMinAssetToReceive = (x, y, z, fee, slippage) => {
  const prod = x.multiply(y);
  let tmp;
  let tmpFee;

  if (x > 0) {
    tmp = prod.minus(1).divide(z).plus(1);
    tmpFee = tmp.multiply(fee).plus(9999).divide(10000);
  } else {
    tmp = prod.divide(z);
    tmpFee = tmp.multiply(-1).multiply(fee).plus(9999).divide(10000);
  }

  return tmp
    .plus(tmpFee)
    .multiply(100 - slippage)
    .divide(100);
};

const getExchangeAssets = (amount, pair, slippage) => {
  const assetToGive = amountToAsset(amount, pair.from.asset);
  const assetToReceive = numberToAsset(0, pair.to.asset.symbol);
  const minAssetToReceive = numberToAsset(0, pair.to.asset.symbol);
  const computeForwardAmount = computeForward(
    assetToGive.amount.multiply(-1),
    pair.to.asset.amount,
    pair.from.asset.amount.plus(assetToGive.amount),
    pair.fee
  ).abs();
  const computeAfterSlippage = computeMinAssetToReceive(
    assetToGive.amount.multiply(-1),
    pair.to.asset.amount,
    pair.from.asset.amount.plus(assetToGive.amount),
    pair.fee,
    slippage
  ).abs();
  assetToReceive.set_amount(computeForwardAmount);
  minAssetToReceive.set_amount(computeAfterSlippage);

  return {
    assetToGive,
    assetToReceive,
    minAssetToReceive,
    price: amountToAsset(
      (
        parseFloat(assetToReceive.toString().split(" ")[0]) /
        parseFloat(assetToGive.toString().split(" ")[0])
      ).toFixed(assetToReceive.symbol.precision()),
      assetToReceive
    ).toString(),
  };
};

const getExchangeAssetsFromToken2 = (amount, pair, slippage) => {
  const assetToGive = numberToAsset(0, pair.from.asset.symbol);
  const assetToReceive = amountToAsset(amount, pair.to.asset);
  const amountToReceive = assetToReceive.amount.plus(
    assetToReceive.amount.multiply(pair.fee).plus(9999).divide(10000)
  );
  const minAssetToReceive = amountToAsset(amount, pair.to.asset);
  const minAmountToReceive = minAssetToReceive.amount
    .multiply(100 - slippage)
    .divide(100);

  const computeForwardAmount = computeForward(
    amountToReceive,
    pair.from.asset.amount,
    pair.to.asset.amount.minus(amountToReceive),
    0
  ).abs();

  assetToGive.set_amount(computeForwardAmount);
  minAssetToReceive.set_amount(minAmountToReceive);

  return {
    assetToGive,
    assetToReceive,
    minAssetToReceive,
    price: amountToAsset(
      (
        parseFloat(assetToReceive.toString().split(" ")[0]) /
        parseFloat(assetToGive.toString().split(" ")[0])
      ).toFixed(assetToReceive.symbol.precision()),
      assetToReceive
    ).toString(),
  };
};

const getUserTokenBalance = async (ual, pool) => {
  if (!ual.activeUser) {
    return null;
  }

  const response = await ual.activeUser.rpc.get_currency_balance(
    pool.contract,
    ual.activeUser.accountName,
    pool.asset.symbol.code().toString()
  );

  return response.length > 0 ? response[0] : null;
};

export const getScatterError = (exception) => {
  if (!exception?.cause?.json?.error?.details?.length) {
    return exception?.cause?.message || exception?.message || "Unknown error";
  }

  return exception.cause.json.error.details[0].message.replace(
    "assertion failure with message: ",
    ""
  );
};

const convertSharesTx = (shareType, marketId, amount, userName) => ({
  actions: [
    {
      account: "prediqtpedia",
      name: "trnsfrshares",
      authorization: [
        {
          actor: userName,
          permission: "active",
        },
      ],
      data: {
        from: userName,
        to: "shares2token",
        shares: parseInt(amount, 10),
        sharetype: shareType,
        market_id: marketId,
      },
    },
  ],
});

const convertTokensTx = (quantity, userName) => ({
  actions: [
    {
      account: "prediqtokens",
      name: "transfer",
      authorization: [
        {
          actor: userName,
          permission: "active",
        },
      ],
      data: {
        from: userName,
        to: "shares2token",
        quantity,
        memo: "unwrap tokens",
      },
    },
  ],
});

const exchange = async (amount, pair, ual, swapToShares = false, slippage) => {
  try {
    const {
      assetToGive,
      assetToReceive,
      minAssetToReceive,
    } = getExchangeAssets(amount, pair, slippage);
    const authorization = [
      {
        actor: ual.activeUser.accountName,
        permission: "active",
      },
    ];
    let aditionalActions = [];
    const balance = await getUserTokenBalance(ual, pair.pool2);

    if (!balance) {
      aditionalActions = [
        ...aditionalActions,
        {
          authorization,
          account: pair.pool2.contract,
          name: "open",
          data: {
            owner: ual.activeUser.accountName,
            symbol: pair.pool2.asset.symbol.toString(),
            ram_payer: ual.activeUser.accountName,
          },
        },
      ];
    }

    let exchangeActions = [
      ...aditionalActions,
      {
        authorization,
        account: pair.from.contract,
        name: "transfer",
        data: {
          from: ual.activeUser.accountName,
          to: mindswapContract,
          quantity: assetToGive.toString(),
          memo: `exchange: ${
            pair.token
          },${minAssetToReceive.toString()},sent using mindswap`,
        },
      },
    ];

    if (swapToShares) {
      const convertToSharesTx = convertTokensTx(
        assetToReceive.toString(),
        ual.activeUser.accountName
      );
      exchangeActions = [...exchangeActions, ...convertToSharesTx.actions];
    }

    return await ual.activeUser.signTransaction(
      {
        actions: exchangeActions,
      },
      {
        broadcast: true,
      }
    );
  } catch (error) {
    throw new Error(getScatterError(error));
  }
};

const getUserPools = async (ual) => {
  const { rows } = await ual.activeUser.rpc.get_table_rows({
    json: true,
    code: mindswapContract,
    scope: ual.activeUser.accountName,
    table: "accounts",
  });

  return rows.map((row) => asset(row.balance));
};

const convertToPairFormat = async (ual, data) => {
  const { supply, pool1: pool1All, pool2: pool2All, fee } = data;
  const { quantity: pool1, contract: pool1Contract } = pool1All;
  const { quantity: pool2, contract: pool2Contract } = pool2All;

  const tokenPair = asset(supply).symbol.code().toString();

  let userPools = [];
  if (ual?.activeUser) {
    // userPools = await getUserPools(ual); // TODO: re-enable if we need to, we currently do not use this
  }

  const price =
    Number(pool1.toString().split(" ")[0]) /
    Number(pool2.toString().split(" ")[0]);

  const balance = userPools.find(
    (item) => item.symbol.code().toString() === tokenPair
  );

  const assetPool1 = asset(pool1);
  const [amountPool1] = assetPool1.toString().split(" ");
  const assetPool2 = asset(pool2);
  const [amountPool2] = assetPool2.toString().split(" ");

  return {
    price,
    fee: isNaN(fee) ? 0 : fee,
    balance,
    token: tokenPair,
    supply: asset(supply),
    pool1: {
      asset: asset(pool1),
      contract: pool1Contract,
      amount: parseFloat(amountPool1),
    },
    pool2: {
      asset: asset(pool2),
      contract: pool2Contract,
      amount: parseFloat(amountPool2),
    },
  };
};

const getPair = (token1, token2, pairsData) => {
  const pair = pairsData.find(
    (p) =>
      (p.pool1.asset.symbol.code().toString() === token1 &&
        p.pool2.asset.symbol.code().toString() === token2) ||
      (p.pool2.asset.symbol.code().toString() === token1 &&
        p.pool1.asset.symbol.code().toString() === token2)
  );

  if (!pair) {
    return null;
  }

  const isPool1 = pair.pool1.asset.symbol.code().toString() === token1;

  return {
    ...pair,
    from: isPool1 ? pair.pool1 : pair.pool2,
    to: isPool1 ? pair.pool2 : pair.pool1,
  };
};

const getPriceInfo = (assetToGive, assetToReceive, pair) => {
  const price =
    parseFloat(assetToReceive.toString().split(" ")[0]) /
    parseFloat(assetToGive.toString().split(" ")[0]);
  const spotPrice = pair.to.amount / pair.from.amount;
  const priceImpact = Math.abs(
    parseFloat(
      ((1 - (price * (1 + pair.fee / 10000)) / spotPrice) * 100).toFixed(2)
    )
  );
  const token1 = `1 ${assetToGive.symbol.code().toString()}`;
  const token2 = `${price.toFixed(
    4
  )} ${assetToReceive.symbol.code().toString()}`;

  return {
    price,
    spotPrice,
    priceImpact,
    rate: `${token1} Per ${token2}`,
  };
};

const getPairForSwap = async (fromToken, toToken, authContext, pools) => {
  const pairsData = await convertToPairFormat(
    authContext,
    pools.length && pools[0]
  );
  return getPair(fromToken, toToken, [pairsData]);
};

const getAddLiquidityAssets = (amount, pair) => {
  const baseAsset = amountToAsset(amount, pair.supply);
  const asset1 = numberToAsset(0, pair.pool1.asset.symbol);
  const asset2 = numberToAsset(0, pair.pool2.asset.symbol);

  asset1.set_amount(
    computeForward(
      baseAsset.amount,
      pair.pool1.asset.amount,
      pair.supply.amount,
      0 //pair.fee
    )
  );
  asset2.set_amount(
    computeForward(
      baseAsset.amount,
      pair.pool2.asset.amount,
      pair.supply.amount,
      0 //pair.fee
    )
  );

  return {
    baseAsset,
    asset1,
    asset2,
  };
};

const getAddLiquidityAssetsToken = (amount, pair, isFrom) => {
  const poolToUse = isFrom ? pair.from : pair.to;
  const assetToGive = amountToAsset(amount, poolToUse.asset);

  const baseAssetAmtBigInt = computeForward(
    assetToGive.amount.multiply(-1),
    pair.supply.amount,
    poolToUse.asset.amount,
    0
  ).abs();

  const baseAssetAmt = (
    Number(baseAssetAmtBigInt) /
    10 ** pair.supply.symbol.precision()
  ).toFixed(pair.supply.symbol.precision());

  const result = getAddLiquidityAssets(baseAssetAmt, pair);

  const isPool1 =
    pair.pool1.asset.symbol.code().toString() ===
    poolToUse.asset.symbol.code().toString();

  let fromPool;
  let toPool;

  if (isFrom) {
    if (isPool1) {
      fromPool = result.asset1;
      toPool = result.asset2;
    } else {
      fromPool = result.asset2;
      toPool = result.asset1;
    }
  } else if (isPool1) {
    fromPool = result.asset2;
    toPool = result.asset1;
  } else {
    fromPool = result.asset1;
    toPool = result.asset2;
  }

  return {
    ...result,
    from: fromPool,
    to: toPool,
    baseAssetAmt: baseAssetAmt,
  };
};

const addLiquidity = async (amount, pair, ual) => {
  try {
    const { baseAsset, asset1, asset2 } = getAddLiquidityAssets(amount, pair);

    const authorization = [
      {
        actor: ual.activeUser.accountName,
        permission: "active",
      },
    ];
    const poolObject = {
      account: mindswapContract,
      name: "closeext",
      authorization,
      data: {
        user: ual.activeUser.accountName,
        to: ual.activeUser.accountName,
        memo: "",
      },
    };
    const result = await ual.activeUser.signTransaction(
      {
        actions: [
          {
            account: mindswapContract,
            name: "openext",
            authorization,
            data: {
              user: ual.activeUser.accountName,
              payer: ual.activeUser.accountName,
              ext_symbol: {
                contract: pair.pool1.contract,
                sym: pair.pool1.asset.symbol.toString(),
              },
            },
          },
          {
            account: mindswapContract,
            name: "openext",
            authorization,
            data: {
              user: ual.activeUser.accountName,
              payer: ual.activeUser.accountName,
              ext_symbol: {
                contract: pair.pool2.contract,
                sym: pair.pool2.asset.symbol.toString(),
              },
            },
          },
          {
            account: pair.pool1.contract,
            name: "transfer",
            authorization,
            data: {
              from: ual.activeUser.accountName,
              to: mindswapContract,
              quantity: asset1.toString(),
              memo: "",
            },
          },
          {
            account: pair.pool2.contract,
            name: "transfer",
            authorization,
            data: {
              from: ual.activeUser.accountName,
              to: mindswapContract,
              quantity: asset2.toString(),
              memo: "",
            },
          },
          {
            account: mindswapContract,
            name: "addliquidity",
            authorization,
            data: {
              user: ual.activeUser.accountName,
              to_buy: baseAsset.toString(),
              max_asset1: asset1.toString(),
              max_asset2: asset2.toString(),
            },
          },
          {
            ...poolObject,
            data: {
              ...poolObject.data,
              ext_symbol: {
                contract: pair.pool1.contract,
                sym: pair.pool1.asset.symbol.toString(),
              },
            },
          },
          {
            ...poolObject,
            data: {
              ...poolObject.data,
              ext_symbol: {
                contract: pair.pool2.contract,
                sym: pair.pool2.asset.symbol.toString(),
              },
            },
          },
        ],
      },
      {
        broadcast: true,
      }
    );

    return result;
  } catch (error) {
    throw new Error(getScatterError(error));
  }
};

const getRemoveLiquidityAssets = (amount, pair) => {
  const baseAsset = amountToAsset(amount, pair.supply);
  const asset1 = numberToAsset(0, pair.pool1.asset.symbol);
  const asset2 = numberToAsset(0, pair.pool2.asset.symbol);

  asset1.set_amount(
    computeForward(
      baseAsset.amount.multiply(-1),
      pair.pool1.asset.amount,
      pair.supply.amount,
      0
    ).abs()
  );
  asset2.set_amount(
    computeForward(
      baseAsset.amount.multiply(-1),
      pair.pool2.asset.amount,
      pair.supply.amount,
      0
    ).abs()
  );

  return {
    baseAsset,
    asset1,
    asset2,
  };
};

const removeLiquidity = async (amount, pair, ual) => {
  try {
    const { baseAsset, asset1, asset2 } = getRemoveLiquidityAssets(
      amount,
      pair
    );
    const authorization = [
      {
        actor: ual.activeUser.accountName,
        permission: "active",
      },
    ];
    const result = await ual.activeUser.signTransaction(
      {
        actions: [
          {
            account: mindswapContract,
            name: "openext",
            authorization,
            data: {
              user: ual.activeUser.accountName,
              payer: ual.activeUser.accountName,
              ext_symbol: {
                contract: pair.pool1.contract,
                sym: pair.pool1.asset.symbol.toString(),
              },
            },
          },
          {
            account: mindswapContract,
            name: "openext",
            authorization,
            data: {
              user: ual.activeUser.accountName,
              payer: ual.activeUser.accountName,
              ext_symbol: {
                contract: pair.pool2.contract,
                sym: pair.pool2.asset.symbol.toString(),
              },
            },
          },
          {
            account: mindswapContract,
            name: "remliquidity",
            authorization,
            data: {
              user: ual.activeUser.accountName,
              to_sell: baseAsset.toString(),
              min_asset1: asset1.toString(),
              min_asset2: asset2.toString(),
            },
          },
          {
            account: mindswapContract,
            name: "closeext",
            authorization,
            data: {
              user: ual.activeUser.accountName,
              to: ual.activeUser.accountName,
              ext_symbol: {
                contract: pair.pool1.contract,
                sym: pair.pool1.asset.symbol.toString(),
              },
              memo: "",
            },
          },
          {
            account: mindswapContract,
            name: "closeext",
            authorization,
            data: {
              user: ual.activeUser.accountName,
              to: ual.activeUser.accountName,
              ext_symbol: {
                contract: pair.pool2.contract,
                sym: pair.pool2.asset.symbol.toString(),
              },
              memo: "",
            },
          },
        ],
      },
      {
        broadcast: true,
      }
    );

    return result;
  } catch (error) {
    throw new Error(getScatterError(error));
  }
};

export {
  convertSharesTx,
  convertTokensTx,
  getPriceInfo,
  getPoolInfo,
  formatTokenBalance,
  mergePoolObjects,
  getUserTokens,
  getExchangeAssets,
  getExchangeAssetsFromToken2,
  exchange,
  getUserPools,
  getPair,
  getPairForSwap,
  getAddLiquidityAssets,
  getAddLiquidityAssetsToken,
  addLiquidity,
  getRemoveLiquidityAssets,
  removeLiquidity,
  amountToAsset,
  convertToPairFormat,
};
