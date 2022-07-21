// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface IERC20Changer {

    /// @notice Only user with role "admin" is allow
    error OnlyAdminAllow();

    /// @notice Only user with role "rate changers" is allow 
    error OnlyRateChangersAllow();

    /// @notice Only user with role "stuff" is allow 
    error OnlyStuffAllow();

    /// @notice Stable token is not available to change
    /// @param _stable an address of a token
    error StableTokenIsNotAvailable(address _stable);

    /// @notice Synthetic token is not available to change
    /// @param _synthetic an address of a token
    error SyntheticTokenIsNotAvailable(address _synthetic);

    /// @notice Balance of stable token is not enough for change
    /// @param _stable an address of a token
    /// @param _sumOfTokens summ of tokens
    error BalanceOfStableIsNotEnough(address _stable, uint _sumOfTokens);

    /// @notice Balance of synthetic token is not enough for change
    /// @param _synthetic an address of a token
    /// @param _sumOfTokens summ of tokens
    error BalanceOfSyntheticIsNotEnough(address _synthetic, uint _sumOfTokens);

    /// @notice Token were successfully changed
    /// @param _stable  an address of a token
    /// @param _synthetic an address of a token
    /// @param _outCoin token type that user get
    /// @param _amountIn incomming amount of tokens
    /// @param _outSum sum that user get
    /// @param _comission that platform get
    event TokensWereChanged(
        address _stable, 
        address _synthetic, 
        uint8 _outCoin, 
        uint _amountIn, 
        uint _outSum, 
        uint _comission
    );

    /// @notice Token was successfully added
    /// @param _token an address of a token
    /// @param _stable true if token stable, false if token synthetic 
    /// @param _rateBP rate of token in base points
    event TokenWasAdded(address _token, bool _stable, uint16 _rateBP);

    /// @notice Token was successfully removed
    /// @param _token an address of a token
    /// @param _stable true if token stable, false if token synthetic 
    event TokenWasRemoved(address _token, bool _stable);

    /// @notice Comission was successfully change on the platform
    /// @param _comissionBP comission of the platform in base point
    event ComissionWasChanged(uint _comissionBP);

    /// @notice Token rate was changed
    /// @param _token an address of a token
    /// @param _rateBP rate of token in base points
    event TokenRateWasChanged(address _token, uint _rateBP);
}