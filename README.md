# ERC20Changer

![Coverage](https://camo.githubusercontent.com/2c8b15a3902bc15c0d1e6d70bbf7a1f0f248e2df4b430e25517c7543233530fb/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f436f7665726167652d3130302532352d627269676874677265656e2e737667)


## Installation & tests

Use npm to install all dependencies

```npm
npm install
```

To check tests coverage
```npm
npx hardhat coverage
```


## Usage

Before deploy & verify, please configure appropriate network in hardhat.config.ts

```npm
# Deploy contract
npx hardhat --network YOUR_NETWORK_NAME run scripts/deploy.ts

# Verify contract
npx hardhat --network YOUR_NETWORK_NAME verify ERC20Changer_address

```

## Contributing ^_^
Pull requests are welcome. 
Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)