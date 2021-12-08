let admin = '0xA1982835170d0C2ba789370918F19122D63943A2'

let wmatic = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'
let govAddress = '0xA1982835170d0C2ba789370918F19122D63943A2'
let rewardsAddress = '0x2CAA7b86767969048029c27C1A62612c980eB4b8' //treasury
let deadAddress = '0x000000000000000000000000000000000000dEaD'

async function main() {
  const Token = await ethers.getContractFactory("POLYCUB");
  token = await Token.deploy();
  await token.deployed()

  const MasterChef = await ethers.getContractFactory("MasterChef");
  masterChef = await MasterChef.deploy('0x000000000000000000000000000000000000dEaD', 0, token.address)
  await masterChef.deployed()

  const Staker = await ethers.getContractFactory("xStaker");
  staker = await Staker.deploy(token.address, admin, masterChef.address)
  await staker.deployed()

  await token.mint(admin, '1300000000000000000000000')
  await token.transferOwnership(masterChef.address)

  //change pealty address
  await masterChef.setPenaltyAddress(staker.address);

  await deploySushiVaults(token.address, masterChef.address)
  await deployCurveVaults(masterChef.address)
}

async function deployCurveVaults(masterChef){
  let vaults = [{
    name: "CURVE-USD-BTC-ETH-atricrypto3",
    rewarders: ['0x703F98CB0DA4b8bf64e1C7549e49d140C0acbF94', '0x36477AF584988cb79e2991bfa5CfF2CE275435BE'],
    farmContractAddress: '0x3B6B158A76fd8ccc297538F454ce7B4787778c7C',
    CRVToUSDCPath: ['0x172370d5Cd63279eFa6d502DAB29171933a610AF', '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'],
    masterChefAddress: masterChef,
    wantAddress: '0xdAD97F7713Ae9437fa9249920eC8507e5FbB23d3',
    uniRouterAddress: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
    token0Address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    earnedToToken0Path: ['0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'],
    earnedAddress: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    entranceFeeFactor: 9990,
    withdrawFeeFactor: 10000,
    reward_contract: '0xBcA219099eA214f725C746247639D4770b286Bd3',
    curvePoolAddress: '0x1d8b86e3D88cDb2d34688e87E72F388Cb541B7C8'
  }]

  for (i in vaults){
    const CurveVault = await ethers.getContractFactory("Curve_PolyCub_Vault");
    curveVault = await CurveVault.deploy(
      vaults[i].farmContractAddress, vaults[i].rewarders, vaults[i].CRVToUSDCPath, vaults[i].masterChefAddress,
      vaults[i].wantAddress, govAddress, rewardsAddress, vaults[i].uniRouterAddress,
      vaults[i].token0Address, vaults[i].earnedToToken0Path, vaults[i].earnedAddress, vaults[i].entranceFeeFactor,
      vaults[i].withdrawFeeFactor, vaults[i].reward_contract, vaults[i].curvePoolAddress
    )
    await verify(curveVault.address, [
      vaults[i].farmContractAddress, vaults[i].rewarders, vaults[i].CRVToUSDCPath, vaults[i].masterChefAddress,
      vaults[i].wantAddress, govAddress, rewardsAddress, vaults[i].uniRouterAddress,
      vaults[i].token0Address, vaults[i].earnedToToken0Path, vaults[i].earnedAddress, vaults[i].entranceFeeFactor,
      vaults[i].withdrawFeeFactor, vaults[i].reward_contract, vaults[i].curvePoolAddress
    ])
    console.log(`Deployed: ${vaults[i].name}: ${curveVault.address}`)
  }
}

async function deploySushiVaults(token, masterChef){
  let sushiEarned = '0x0b3F868E0BE5597D5DB7fEB59E1CADBb0fdDa50a' //Sushi token
  let sushiFarm = '0x0769fd68dFb93167989C6f7254cd0D766Fb2841F' //Sushi minichef
  let sushiRouter = '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506' //Sushi router

  let sushiEarnedToToken = [sushiEarned, wmatic, token]

  let weth_wbtc_addresses = [
    wmatic, govAddress, masterChef, token,
    '0xE62Ec2e799305E0D367b0Cc3ee2CdA135bF89816', '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', sushiEarned,
    sushiFarm, sushiRouter, rewardsAddress, deadAddress
  ]
  let weth_dai_addresses = [
    wmatic, govAddress, masterChef, token,
    '0x6FF62bfb8c12109E8000935A6De54daD83a4f39f', '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619', '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063', sushiEarned,
    sushiFarm, sushiRouter, rewardsAddress, deadAddress
  ]

  let vaults = [{
    name: "SUSHI-WETH-WBTC",
    addresses: weth_wbtc_addresses,
    pid: 3,
    isSameAssetDeposit: false,
    isCubComp: true,
    earnedToCUBPath: sushiEarnedToToken,
    earnedToToken0Path: [sushiEarned, wmatic, weth_wbtc_addresses[5]],
    earnedToToken1Path: [sushiEarned, wmatic, weth_wbtc_addresses[6]],
    token0ToEarnedPath: [weth_wbtc_addresses[5], wmatic, sushiEarned],
    token1ToEarnedPath: [weth_wbtc_addresses[6], wmatic, sushiEarned],
    controllerFee: 1000,
    buyBackRate: 0,
    entranceFeeFactor: 9990,
    withdrawFeeFactor: 10000,
    compoundingAddress: govAddress
  }, {
    name: "SUSHI-WETH-DAI",
    addresses: weth_dai_addresses,
    pid: 5,
    isSameAssetDeposit: false,
    isCubComp: true,
    earnedToCUBPath: sushiEarnedToToken,
    earnedToToken0Path: [sushiEarned, wmatic, weth_dai_addresses[5]],
    earnedToToken1Path: [sushiEarned, wmatic, weth_dai_addresses[6]],
    token0ToEarnedPath: [weth_dai_addresses[5], wmatic, sushiEarned],
    token1ToEarnedPath: [weth_dai_addresses[6], wmatic, sushiEarned],
    controllerFee: 1000,
    buyBackRate: 0,
    entranceFeeFactor: 9990,
    withdrawFeeFactor: 10000,
    compoundingAddress: govAddress
  }]

  for (i in vaults){
    const SushiVault = await ethers.getContractFactory("CubPolygon_SushiVault");
    sushiVault = await SushiVault.deploy(
      vaults[i].addresses, vaults[i].pid, vaults[i].isSameAssetDeposit, vaults[i].isCubComp,
      vaults[i].earnedToCUBPath, vaults[i].earnedToToken0Path, vaults[i].earnedToToken1Path,
      vaults[i].token0ToEarnedPath, vaults[i].token1ToEarnedPath, vaults[i].controllerFee,
      vaults[i].buyBackRate, vaults[i].entranceFeeFactor, vaults[i].withdrawFeeFactor, vaults[i].compoundingAddress
    )
    await verify(sushiVault.address, [
      vaults[i].addresses, vaults[i].pid, vaults[i].isSameAssetDeposit, vaults[i].isCubComp,
      vaults[i].earnedToCUBPath, vaults[i].earnedToToken0Path, vaults[i].earnedToToken1Path,
      vaults[i].token0ToEarnedPath, vaults[i].token1ToEarnedPath, vaults[i].controllerFee,
      vaults[i].buyBackRate, vaults[i].entranceFeeFactor, vaults[i].withdrawFeeFactor, vaults[i].compoundingAddress
    ])
    console.log(`Deployed: ${vaults[i].name}: ${sushiVault.address}`)
  }
}

async function verify(address, arguments){
  setTimeout(() => {
    //wait...
  }, 1000 * 10)
  await hre.run("verify:verify", {
    address: address,
    constructorArguments: arguments,
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
