import Head from "next/head";
import { Contract, providers, utils } from "ethers";
import Web3Modal from "web3modal";
import styles from "../styles/Home.module.css";
import { useEffect, useRef, useState } from "react";
import { NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI } from "../constants";

export default function Home() {
  const web3ModalRef = useRef();
  const [walletConnected, setWalletConnected] = useState(false);
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [presaleEnded, setPresaleEnded] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [numTokensMinted, setNumTokensMinted] = useState(0);

  const getNumbeMintedTokens = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider,
      );

      const numTokenIds = await nftContract.tokenIds();
      console.log(numTokenIds);
      setNumTokensMinted(numTokenIds.toString());
    } catch (error) {
      console.error(error);
    }
  };
  const presaleMint = async () => {
    try {
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer,
      );

      const txn = await nftContract.presaleMint({
        value: utils.parseEther("0.01"),
      });
      await txn.wait();

      window.alert("you successfully minted a cryptoDev");
    } catch (error) {
      console.error(error);
    }
  };
  const publicMint = async () => {
    try {
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer,
      );

      const txn = await nftContract.mint({
        value: utils.parseEther("0.01"),
      });
      await txn.wait();

      window.alert("you successfully minted a cryptoDev");
    } catch (error) {
      console.error(error);
    }
  };
  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner();
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider,
      );

      const _owner = await nftContract.owner();
      const userAddress = await signer.getAddress();

      console.log("owner", _owner);
      if (_owner.toLowerCase() === userAddress.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const startPresale = async () => {
    try {
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer,
      );

      const txn = await nftContract.startPresale();
      await txn.wait();

      setPresaleStarted(true);
    } catch (error) {
      console.error(error);
    }
  };

  const checkIfPresaleStarted = async () => {
    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider,
      );

      const isPresaleStarted = await nftContract.presaleStarted();
      setPresaleStarted(isPresaleStarted);

      return isPresaleStarted;
    } catch (error) {
      console.error(error);
    }
  };

  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider,
      );

      const presaleEndTime = await nftContract.presaleEnded();
      const currentTime = Date.now() / 1000;

      const hasPrealeEnded = presaleEndTime.lt(Math.floor(currentTime));

      setPresaleEnded(hasPrealeEnded);
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.error(error);
    }
  };

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();

    if (chainId !== 4) {
      window.alert("Please switch to the Rinkey network");
      throw new Error("Incorrect network");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  const onPageLoad = async () => {
    await connectWallet();
    await getOwner();

    const presaleStarted = await checkIfPresaleStarted();
    if (presaleStarted) {
      await checkIfPresaleEnded();
    }
    await getNumbeMintedTokens();

    setInterval(async () => {
      await getNumbeMintedTokens();
    }, 5 * 1000);

    setInterval(async () => {
      const presaleStarted = await checkIfPresaleStarted();
      if (presaleStarted) {
        await checkIfPresaleEnded();
      }
    }, 5 * 1000);
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "ropsten",
        providerOptions: {},
        disableInjectedProvider: false,
      });

      onPageLoad();
    }
  }, []);

  const renderBody = () => {
    if (!walletConnected) {
      return (
        <div className={styles.main}>
          <button onClick={connectWallet} className={styles.button}>
            Connect Wallet
          </button>
        </div>
      );
    }

    if (isOwner && !presaleStarted) {
      return (
        <button onClick={startPresale} className={styles.button}>
          Start Presale
        </button>
      );
    }

    if (!presaleStarted) {
      return (
        <div>
          <span className={styles.description}>
            Presale has not started yet. come back later!
          </span>
        </div>
      );
    }

    if (presaleStarted && !presaleEnded) {
      return (
        <>
          <span className={styles.description}>
            Preasle has started if you address is whitelited you cna mint a
            crypto dev
          </span>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint
          </button>
        </>
      );
    }
    if (presaleEnded) {
      return (
        <>
          <span className={styles.description}>
            Preasle has ended you can mint a cryptodev in public sale crypto dev
          </span>
          <button className={styles.button} onClick={publicMint}>
            public Mint
          </button>
        </>
      );
    }
  };
  return (
    <>
      <Head>
        <title>Crypto Devs NFT</title>
      </Head>
      <div className={styles.main}>
        <span className={styles.description}>
          {numTokensMinted}/20 NTF as Mint
        </span>
        {renderBody()}
      </div>
    </>
  );
}
