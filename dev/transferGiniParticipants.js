const Prompt = require('prompt');
const fs     = require('fs');
const Wallet = require('ethereumjs-wallet');
const colors = require('colors/safe');
const Web3   = require('web3');
const GiniContract = require('./GiniContract')
const EthereumTx = require('ethereumjs-tx');

var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('https://rinkeby.infura.io/v3/ae01c2f20b6046b1b351e20a79eba386'));

let participants = fs.readFileSync('./participants.json');
let participantsArray = [];
participantsArray = JSON.parse(participants);

console.log(colors.green(`\n \tEnter the Index Number of Participant to send Gini Token \n`));
console.log(colors.red(`\t \tIndex \t Name`));

participantsArray.forEach((participant, index) => {
    console.log(colors.yellow(`\t \t${index} \t ${participant.name}`));
})
console.log(`\n`);

var schema = {
    properties: {
        walletFilename: {
            description: colors.yellow('Wallet filename'),
            //validator: /^[a-zA-Z0-9\-]+$/,
            //warning: 'Wallet name must be only letters, numbers or dashes',
            required: true,
        },
        password: {
            description: colors.yellow('Wallet password'),
            hidden: true,
            replace: "*",
            required: true,
        },
        // address: {
        //     description: colors.yellow('Target address'),
        //     required: true,
        // },
        amount: {
            description: colors.yellow('Amount (in GINI)'),
            required: true,
        },
        index: {
            description: colors.yellow('Enter Index'),
            required: true
        }
    }
};

Prompt.start();
Prompt.get(schema, function(err, result) {

  var strJson = fs.readFileSync(result.walletFilename, 'utf8');
  var wallet  = Wallet.fromV3(strJson, result.password);

  var nonce, gasPrice;

  var instance = new web3.eth.Contract(GiniContract.abi, GiniContract.address);

  var encodedCall = instance.methods.transfer(participantsArray[result.index].address, result.amount).encodeABI();

  web3.eth.getTransactionCount(wallet.getChecksumAddressString())
  .then((numberOfTxs) => {
    nonce = numberOfTxs;
    return web3.eth.getGasPrice();
  })
  .then((price) => {
   gasPrice = web3.utils.toBN(price);
    var gasLimit = 100000;
    var txParams = {
      nonce:    '0x' + nonce.toString(16),
      gasPrice: '0x' + gasPrice.toString(16),
      gasLimit: '0x' + gasLimit.toString(16),
      data:            encodedCall,
      to:              '0xc639411f111ff9653a329669bab4369de7c8ae29'
    };

    var tx = new EthereumTx(txParams);
    tx.sign(wallet.getPrivateKey());

    var strTx = '0x' + tx.serialize().toString('hex'); // PAY CLOSE ATENTION TO THE '0x'!!!!!

    web3.eth.sendSignedTransaction(strTx)
    .once('transactionHash', function(txid) {
      console.log(colors.green('\n\ttxid: ' + txid + '\n'));
    })
    .catch((ex) => {
      console.log(ex);
    })
  })
});
