// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

import "./interfaces/IERC20Changer.sol";


/// @title ERC20Changer is a contract to change ERC20 to ERC20
/// @author nashgc@gmail.com
/// @notice Just change ERC20 which available on the platform
contract ERC20Changer is IERC20Changer, AccessControl, Pausable {

    /// @dev Roles that manage the platform
    bytes32 public constant RATE_CHANGERS = keccak256("RATE_CHANGERS");
    bytes32 public constant STUFF = keccak256("STUFF");

    /// @dev Platform comission in base points
    uint16 comissionBP = 30;

    /// @dev Synthetic token info
    struct TokenInfo {
        mapping(address => uint) stableBalance;
        uint rateBP;
        bool available;
    }

    /// @dev Stable & Synthetic token storages
    mapping(address => bool) stable;
    mapping(address => TokenInfo) synthetic;

    /// @dev Special type to manage outgoing token type
    enum OutCoin {
        Stable,
        Synthetic
    }

    /// @dev Just setup the admin role
    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @dev Only user with role "admin" is allow
    modifier onlyAdmin() {
        if (!hasRole(DEFAULT_ADMIN_ROLE, msg.sender))
            revert OnlyAdminAllow();
        _;
    }

    /// @dev Only user with role "rate changers" is allow 
    modifier onlyRateChangers() {
        if (!hasRole(RATE_CHANGERS, msg.sender))
            revert OnlyRateChangersAllow();
        _;
    }

    /// @dev Only user with role "stuff" is allow 
    modifier onlyStuff() {
        if (!hasRole(STUFF, msg.sender))
            revert OnlyStuffAllow();
        _;
    }

    /// @notice Change tokens
    /// @param _stable  an address of a stable token
    /// @param _synthetic an address of a synthetic token
    /// @param _amountIn incomming amount of tokens
    /// @param _outCoin token type that user get
    function changeToken(
        address _stable, 
        address _synthetic,
        uint _amountIn,
        OutCoin _outCoin
    ) 
        external 
        whenNotPaused
    {
        if (!stable[_stable])
            revert StableTokenIsNotAvailable(_stable);

        if (!synthetic[_synthetic].available)
            revert SyntheticTokenIsNotAvailable(_synthetic);

        if (_outCoin == OutCoin.Stable) {
            (uint outSum, uint comission) = calculateStableOutWithCommission(
                _amountIn, synthetic[_synthetic].rateBP
            );

            if (outSum > IERC20(_stable).balanceOf(address(this)))
                revert BalanceOfStableIsNotEnough(_stable, outSum);

            if (_amountIn > IERC20(_synthetic).balanceOf(msg.sender))
                revert BalanceOfSyntheticIsNotEnough(_synthetic, _amountIn);

            IERC20(_synthetic).transferFrom(msg.sender, address(this), _amountIn);
            IERC20(_stable).transfer(msg.sender, outSum);
            IERC20(_stable).transfer(address(this), comission);

            if (synthetic[_synthetic].stableBalance[_stable] > outSum) {
                synthetic[_synthetic].stableBalance[_stable] -= outSum;
            } else {
                synthetic[_synthetic].stableBalance[_stable] = 0;
            }

            emit TokensWereChanged(
                _stable, 
                _synthetic, 
                uint8(_outCoin), 
                _amountIn, 
                outSum, 
                comission
            );
        } 
        
        if (_outCoin == OutCoin.Synthetic) {
            (uint outSum, uint comission) = calculateSyntheticOutWithCommission(
                _amountIn, synthetic[_synthetic].rateBP
            );

            if (_amountIn > IERC20(_stable).balanceOf(msg.sender))
                revert BalanceOfStableIsNotEnough(_stable, _amountIn);

            if (outSum > IERC20(_synthetic).balanceOf(address(this)))
                revert BalanceOfSyntheticIsNotEnough(_synthetic, outSum);

            IERC20(_stable).transferFrom(msg.sender, address(this), _amountIn);
            IERC20(_synthetic).transfer(msg.sender, outSum);
            IERC20(_synthetic).transfer(address(this), comission);
            synthetic[_synthetic].stableBalance[_stable] += _amountIn;

            emit TokensWereChanged(
                _stable, 
                _synthetic, 
                uint8(_outCoin), 
                _amountIn,
                outSum, 
                comission
            );
        }
    }

    /// @notice Add token on the platform
    /// @dev Only "stuff" can add the token
    /// @param _token an address of a token
    /// @param _stable true if token stable, false if token synthetic 
    /// @param _rateBP rate of token in base points
    function addToken(
        address _token, 
        bool _stable, 
        uint16 _rateBP
    ) 
        external 
        onlyStuff
        whenNotPaused
    {

        if (_stable) {
            stable[_token] = true;
        } else {
            synthetic[_token].rateBP = _rateBP;
            synthetic[_token].available = true;
        }

        emit TokenWasAdded(_token, _stable, _rateBP);
    }

    /// @notice Remove token from the platform
    /// @dev Only "stuff" can remove the token
    /// @param _token an address of a token
    /// @param _stable true if token stable, false if token synthetic 
    function removeToken(
        address _token, 
        bool _stable
    ) 
        external 
        onlyStuff
        whenNotPaused
    {
        if (_stable) {
            delete stable[_token];
        } else {
            delete synthetic[_token];
        }

        emit TokenWasRemoved(_token, _stable);
    }

    /// @notice Change token rate on the platform
    /// @dev Only "rate changers" can change token rate
    /// @param _token an address of a token
    /// @param _rateBP rate of token in base points
    function changeTokenRate(
        address _token, 
        uint16 _rateBP
    ) 
        external 
        onlyRateChangers
        whenNotPaused
    {
        synthetic[_token].rateBP = _rateBP;

        emit TokenRateWasChanged(_token, _rateBP);
    }

    /// @notice Change comission on the platform
    /// @dev Only "stuff" can change comission
    /// @param _comissionBP comission of the platform in base point
    function changeComission(uint16 _comissionBP) 
        external 
        onlyStuff
        whenNotPaused
    {
        comissionBP = _comissionBP;
        emit ComissionWasChanged(_comissionBP);
    }

    /// @notice Pause the platform
    /// @dev Only "admin" can pause the platform
    function pause() external onlyAdmin whenNotPaused {
        _pause();
    }

    /// @notice Unpause the platform
    /// @dev Only "admin" can unpause the platform
    function unpause() external onlyAdmin whenPaused {
        _unpause();
    }

    /// @notice Calculate sum of stable tokens for user with platform commission
    /// @param _amount imcomming tokens
    /// @param _rate to change
    function calculateStableOutWithCommission(
        uint _amount, 
        uint _rate
    ) 
        internal 
        view 
        returns(uint, uint)    
    {
        uint summ = _amount * _rate / 10000;
        uint comission = summ * comissionBP / 10000;
        return (summ - comission, comission);
    }

    /// @notice Calculate sum of synthetic tokens for user with platform commission
    /// @param _amount imcomming tokens
    /// @param _rate to change
    function calculateSyntheticOutWithCommission(
        uint _amount, 
        uint _rate
    ) 
        internal 
        view 
        returns(uint, uint)    
    {
        uint summ = _amount / _rate * 10000;
        uint comission = summ * comissionBP / 10000;
        return (summ - comission, comission);
    }
}
