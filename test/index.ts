/* eslint-disable no-unused-expressions */
import { Token__factory } from "./../typechain-types/factories/contracts/Token__factory";
import { ERC20Changer__factory } from "./../typechain-types/factories/contracts/ERC20Changer__factory";
import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Token } from "../typechain-types/contracts/Token";
import { ERC20Changer } from "../typechain-types/contracts/ERC20Changer";

describe("ERC20Changer", () => {
  async function deployERC20ChangerFixture() {
    let owner: SignerWithAddress,
      acc: SignerWithAddress,
      rateChanger: SignerWithAddress,
      stuff: SignerWithAddress;
    let stableToken: Token;
    let syntheticToken: Token;
    let erc20Changer: ERC20Changer;

    [owner, acc, rateChanger, stuff] = await ethers.getSigners();

    stableToken = await new Token__factory(owner).deploy("TEST USDT", "USDT");
    syntheticToken = await new Token__factory(owner).deploy(
      "Super synthetic",
      "SST"
    );
    erc20Changer = await new ERC20Changer__factory(owner).deploy();

    const rateChangerRole = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes("RATE_CHANGERS")
    );

    const stuffRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("STUFF"));

    await erc20Changer.grantRole(rateChangerRole, rateChanger.address);
    await erc20Changer.grantRole(stuffRole, stuff.address);

    return {
      owner,
      acc,
      rateChanger,
      stuff,
      stableToken,
      syntheticToken,
      erc20Changer,
    };
  }

  describe("Contract management", () => {
    it("Should fail change comission because of role", async () => {
      const { erc20Changer, acc } = await loadFixture(
        deployERC20ChangerFixture
      );

      await expect(
        erc20Changer.connect(acc).changeComission(50)
      ).to.be.revertedWithCustomError(erc20Changer, "OnlyStuffAllow");
    });

    it("Should change comission", async () => {
      const { erc20Changer, stuff } = await loadFixture(
        deployERC20ChangerFixture
      );

      await expect(erc20Changer.connect(stuff).changeComission(50))
        .to.emit(erc20Changer, "ComissionWasChanged")
        .withArgs(50);
    });

    it("Should fail pause contract", async () => {
      const { erc20Changer, stuff } = await loadFixture(
        deployERC20ChangerFixture
      );

      await expect(erc20Changer.connect(stuff).pause()).to.be.revertedWithCustomError(
        erc20Changer,
        "OnlyAdminAllow"
      );
    });

    it("Should pause contract", async () => {
      const { erc20Changer, stuff } = await loadFixture(
        deployERC20ChangerFixture
      );

      await expect(erc20Changer.pause()).to.emit(erc20Changer, "Paused");
    });

    it("Should unpause contract", async () => {
      const { erc20Changer, stuff } = await loadFixture(
        deployERC20ChangerFixture
      );

      await erc20Changer.pause();
      await expect(erc20Changer.unpause()).to.emit(erc20Changer, "Unpaused");
    });
  });

  describe("Token management", () => {
    it("Should fail add token because of role", async () => {
      const { erc20Changer, stableToken } = await loadFixture(
        deployERC20ChangerFixture
      );

      await expect(
        erc20Changer.addToken(stableToken.address, true, 5000)
      ).to.be.revertedWithCustomError(erc20Changer, "OnlyStuffAllow");
    });

    it("Should add stable token", async () => {
      const { erc20Changer, stuff, stableToken } = await loadFixture(
        deployERC20ChangerFixture
      );

      await expect(
        erc20Changer.connect(stuff).addToken(stableToken.address, true, 5000)
      )
        .to.emit(erc20Changer, "TokenWasAdded")
        .withArgs(stableToken.address, true, 5000);
    });

    it("Should add synthetic token", async () => {
      const { erc20Changer, stuff, syntheticToken } = await loadFixture(
        deployERC20ChangerFixture
      );

      await expect(
        erc20Changer
          .connect(stuff)
          .addToken(syntheticToken.address, false, 5000)
      )
        .to.emit(erc20Changer, "TokenWasAdded")
        .withArgs(syntheticToken.address, false, 5000);
    });

    it("Should fail remove token because of role", async () => {
      const { erc20Changer, stableToken } = await loadFixture(
        deployERC20ChangerFixture
      );

      await expect(
        erc20Changer.removeToken(stableToken.address, true)
      ).to.be.revertedWithCustomError(erc20Changer, "OnlyStuffAllow");
    });

    it("Should remove stable token", async () => {
      const { erc20Changer, stuff, stableToken } = await loadFixture(
        deployERC20ChangerFixture
      );

      await erc20Changer
        .connect(stuff)
        .addToken(stableToken.address, true, 5000);
      await expect(
        erc20Changer.connect(stuff).removeToken(stableToken.address, true)
      )
        .to.emit(erc20Changer, "TokenWasRemoved")
        .withArgs(stableToken.address, true);
    });

    it("Should remove synthetic token", async () => {
      const { erc20Changer, stuff, syntheticToken } = await loadFixture(
        deployERC20ChangerFixture
      );

      await erc20Changer
        .connect(stuff)
        .addToken(syntheticToken.address, false, 5000);
      await expect(
        erc20Changer.connect(stuff).removeToken(syntheticToken.address, false)
      )
        .to.emit(erc20Changer, "TokenWasRemoved")
        .withArgs(syntheticToken.address, false);
    });

    it("Should fail change token rate", async () => {
      const { erc20Changer, stuff, syntheticToken } = await loadFixture(
        deployERC20ChangerFixture
      );

      await erc20Changer
        .connect(stuff)
        .addToken(syntheticToken.address, false, 5000);

      await expect(
        erc20Changer.changeTokenRate(syntheticToken.address, 6000)
      ).to.be.revertedWithCustomError(erc20Changer, "OnlyRateChangersAllow");
    });

    it("Should change token rate", async () => {
      const { erc20Changer, stuff, rateChanger, syntheticToken } =
        await loadFixture(deployERC20ChangerFixture);

      await erc20Changer
        .connect(stuff)
        .addToken(syntheticToken.address, false, 5000);

      await expect(
        erc20Changer
          .connect(rateChanger)
          .changeTokenRate(syntheticToken.address, 6000)
      )
        .to.emit(erc20Changer, "TokenRateWasChanged")
        .withArgs(syntheticToken.address, 6000);
    });
  });

  describe("Change stable token to synthetic functionality", () => {
    it("Should fail because stable token is not available", async () => {
      const { erc20Changer, stableToken, syntheticToken, acc } =
        await loadFixture(deployERC20ChangerFixture);

      const tokenToChange = ethers.utils.parseUnits("1", 18);

      await expect(
        erc20Changer
          .connect(acc)
          .changeToken(
            stableToken.address,
            syntheticToken.address,
            tokenToChange,
            1
          )
      ).to.be.revertedWithCustomError(
        erc20Changer,
        "StableTokenIsNotAvailable"
      );
    });

    it("Should fail because synthetic token is not available", async () => {
      const { erc20Changer, stableToken, syntheticToken, acc, stuff } =
        await loadFixture(deployERC20ChangerFixture);

      const tokenToChange = ethers.utils.parseUnits("1", 18);

      await erc20Changer
        .connect(stuff)
        .addToken(stableToken.address, true, 5000);

      await expect(
        erc20Changer
          .connect(acc)
          .changeToken(
            stableToken.address,
            syntheticToken.address,
            tokenToChange,
            1
          )
      ).to.be.revertedWithCustomError(
        erc20Changer,
        "SyntheticTokenIsNotAvailable"
      );
    });

    it("Should fail because balance of stable is not enough", async () => {
      const { erc20Changer, stableToken, syntheticToken, acc, stuff } =
        await loadFixture(deployERC20ChangerFixture);

      const tokenToChange = ethers.utils.parseUnits("1", 18);

      await erc20Changer
        .connect(stuff)
        .addToken(stableToken.address, true, 5000);
      await erc20Changer
        .connect(stuff)
        .addToken(syntheticToken.address, false, 5000);

      await expect(
        erc20Changer
          .connect(acc)
          .changeToken(
            stableToken.address,
            syntheticToken.address,
            tokenToChange,
            1
          )
      ).to.be.revertedWithCustomError(
        erc20Changer,
        "BalanceOfStableIsNotEnough"
      );
    });

    it("Should fail because balance of synthetic is not enough", async () => {
      const { erc20Changer, stableToken, syntheticToken, acc, stuff } =
        await loadFixture(deployERC20ChangerFixture);

      const tokenToChange = ethers.utils.parseUnits("1", 18);

      await erc20Changer
        .connect(stuff)
        .addToken(stableToken.address, true, 5000);
      await erc20Changer
        .connect(stuff)
        .addToken(syntheticToken.address, false, 5000);

      await stableToken.mint(acc.address, ethers.utils.parseUnits("5", 18));

      await expect(
        erc20Changer
          .connect(acc)
          .changeToken(
            stableToken.address,
            syntheticToken.address,
            tokenToChange,
            1
          )
      ).to.be.revertedWithCustomError(
        erc20Changer,
        "BalanceOfSyntheticIsNotEnough"
      );
    });

    it("Should change stable token to synthetic", async () => {
      const { erc20Changer, stableToken, syntheticToken, acc, stuff } =
        await loadFixture(deployERC20ChangerFixture);

      const tokenToChange = ethers.utils.parseUnits("1", 18);
      const tokenToMint = ethers.utils.parseUnits("5", 18);

      await erc20Changer
        .connect(stuff)
        .addToken(stableToken.address, true, 5000);
      await erc20Changer
        .connect(stuff)
        .addToken(syntheticToken.address, false, 5000);

      await stableToken.mint(acc.address, tokenToMint);
      await syntheticToken.mint(erc20Changer.address, tokenToMint);
      await stableToken
        .connect(acc)
        .approve(erc20Changer.address, tokenToChange);

      await expect(
        erc20Changer
          .connect(acc)
          .changeToken(
            stableToken.address,
            syntheticToken.address,
            tokenToChange,
            1
          )
      ).to.emit(erc20Changer, "TokensWereChanged");
    });
  });

  describe("Change synthetic token to stable functionality", () => {
    it("Should fail because stable token is not available", async () => {
      const { erc20Changer, stableToken, syntheticToken, acc } =
        await loadFixture(deployERC20ChangerFixture);

      const tokenToChange = ethers.utils.parseUnits("1", 18);

      await expect(
        erc20Changer
          .connect(acc)
          .changeToken(
            stableToken.address,
            syntheticToken.address,
            tokenToChange,
            0
          )
      ).to.be.revertedWithCustomError(
        erc20Changer,
        "StableTokenIsNotAvailable"
      );
    });

    it("Should fail because synthetic token is not available", async () => {
      const { erc20Changer, stableToken, syntheticToken, acc, stuff } =
        await loadFixture(deployERC20ChangerFixture);

      const tokenToChange = ethers.utils.parseUnits("1", 18);

      await erc20Changer
        .connect(stuff)
        .addToken(stableToken.address, true, 5000);

      await expect(
        erc20Changer
          .connect(acc)
          .changeToken(
            stableToken.address,
            syntheticToken.address,
            tokenToChange,
            0
          )
      ).to.be.revertedWithCustomError(
        erc20Changer,
        "SyntheticTokenIsNotAvailable"
      );
    });

    it("Should fail because balance of stable is not enough", async () => {
      const { erc20Changer, stableToken, syntheticToken, acc, stuff } =
        await loadFixture(deployERC20ChangerFixture);

      const tokenToChange = ethers.utils.parseUnits("1", 18);

      await erc20Changer
        .connect(stuff)
        .addToken(stableToken.address, true, 5000);
      await erc20Changer
        .connect(stuff)
        .addToken(syntheticToken.address, false, 5000);

      await expect(
        erc20Changer
          .connect(acc)
          .changeToken(
            stableToken.address,
            syntheticToken.address,
            tokenToChange,
            0
          )
      ).to.be.revertedWithCustomError(
        erc20Changer,
        "BalanceOfStableIsNotEnough"
      );
    });

    it("Should fail because balance of synthetic is not enough", async () => {
      const { erc20Changer, stableToken, syntheticToken, acc, stuff } =
        await loadFixture(deployERC20ChangerFixture);

      const tokenToChange = ethers.utils.parseUnits("1", 18);

      await erc20Changer
        .connect(stuff)
        .addToken(stableToken.address, true, 5000);
      await erc20Changer
        .connect(stuff)
        .addToken(syntheticToken.address, false, 5000);

      await stableToken.mint(
        erc20Changer.address,
        ethers.utils.parseUnits("5", 18)
      );

      await expect(
        erc20Changer
          .connect(acc)
          .changeToken(
            stableToken.address,
            syntheticToken.address,
            tokenToChange,
            0
          )
      ).to.be.revertedWithCustomError(
        erc20Changer,
        "BalanceOfSyntheticIsNotEnough"
      );
    });

    it("Should change stable token to synthetic", async () => {
      const { erc20Changer, stableToken, syntheticToken, acc, stuff } =
        await loadFixture(deployERC20ChangerFixture);

      const tokenToChange = ethers.utils.parseUnits("1", 18);
      const tokenToMint = ethers.utils.parseUnits("5", 18);

      await erc20Changer
        .connect(stuff)
        .addToken(stableToken.address, true, 5000);
      await erc20Changer
        .connect(stuff)
        .addToken(syntheticToken.address, false, 5000);

      await stableToken.mint(erc20Changer.address, tokenToMint);
      await syntheticToken.mint(acc.address, tokenToMint);
      await syntheticToken
        .connect(acc)
        .approve(erc20Changer.address, tokenToChange);

      await expect(
        erc20Changer
          .connect(acc)
          .changeToken(
            stableToken.address,
            syntheticToken.address,
            tokenToChange,
            0
          )
      ).to.emit(erc20Changer, "TokensWereChanged");
    });

    it("Should change stable token to synthetic when stable balance is positive", async () => {
      const { erc20Changer, stableToken, syntheticToken, acc, stuff } =
        await loadFixture(deployERC20ChangerFixture);

      const tokenToChange = ethers.utils.parseUnits("1", 18);
      const tokenToMint = ethers.utils.parseUnits("5", 18);

      await erc20Changer
        .connect(stuff)
        .addToken(stableToken.address, true, 5000);
      await erc20Changer
        .connect(stuff)
        .addToken(syntheticToken.address, false, 5000);

      await stableToken.mint(acc.address, tokenToMint);
      await syntheticToken.mint(erc20Changer.address, tokenToMint);
      await stableToken
        .connect(acc)
        .approve(erc20Changer.address, tokenToChange);

      erc20Changer
        .connect(acc)
        .changeToken(
          stableToken.address,
          syntheticToken.address,
          tokenToChange,
          1
        );

      await stableToken.mint(erc20Changer.address, tokenToMint);
      await syntheticToken.mint(acc.address, tokenToMint);
      await syntheticToken
        .connect(acc)
        .approve(erc20Changer.address, tokenToChange);

      await expect(
        erc20Changer
          .connect(acc)
          .changeToken(
            stableToken.address,
            syntheticToken.address,
            tokenToChange,
            0
          )
      ).to.emit(erc20Changer, "TokensWereChanged");
    });
  });
});
