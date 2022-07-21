/* eslint-disable node/no-missing-import */
/* eslint-disable camelcase */
/* eslint-disable import/no-duplicates */

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { ERC20Changer__factory } from "./../typechain-types/factories/contracts/ERC20Changer__factory";

async function main() {
  const accounts: SignerWithAddress[] = await ethers.getSigners();

  console.log(`Deploying contracts with the account: ${accounts[0].address}`);
  console.log(
    `Account balance: ${(await accounts[0].getBalance()).toString()}`
  );

  const ERC20Changer = await new ERC20Changer__factory(accounts[0]);
  const erc20changer = await ERC20Changer.deploy();
  await erc20changer.deployed();
  console.log(`ERC20Changer deployed to: ${erc20changer.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
