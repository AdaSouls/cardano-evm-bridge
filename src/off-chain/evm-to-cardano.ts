import dotenv from 'dotenv';
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { Web3 } from "web3"
dotenv.config({ path: __dirname + '/.env' });

const evmChainRpc = process.env.EVM_CHAIN_RPC;

const web3 = new Web3(evmChainRpc);

const burnAmount = "3000000";

function BridgeFromEvmToCardano() {
  //const { address } = useAccount()
  const {
    writeContract,
    data: hash,
    error,
    isPending
  } = useWriteContract()

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed
  } = useWaitForTransactionReceipt({
    hash
  })

  try {
    writeContract({
      address: "0x3F45D218A59755DEe95D3262B4C242e874f6786d",
      abi: [
        {
          name: "burn",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [{ name: "to", type: "string" }, { name: "amount", type: "uint256" }],
          outputs: [],
        },
      ],
      functionName: "burn",
      args: ["addr_test1qpsyl7c6xptx2dyz5ww6q866q040yvum2fm7lm68dzchunp8c0w93an8r76x5p2wcdyjxr0p7zgze34c23vm06kycxsqlyd0ad", web3.utils.toBigInt(web3.utils.toWei(burnAmount, "ether"))], // burner, amount
    })
  } catch (e) {
    console.log("Error writing to smart contract: ", e);
  }

}

BridgeFromEvmToCardano();

