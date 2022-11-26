
// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

// import Head from 'next/head';
import { useCallback, useEffect, useState } from 'react';

// import styles from '../styles/Home.module.css';



const useSuiWallet = () => {
    const [wallet, setWallet] = useState(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const cb = () => {
            setLoaded(true);
            setWallet(window.suiWallet);
        };
        if (window.suiWallet) {
            cb();
            return;
        }
        window.addEventListener('load', cb);
        return () => {
            window.removeEventListener('load', cb);
        };
    }, []);
    return wallet || (loaded ? false : null);
};

export default function Home() {
    const [walletInstalled, setWalletInstalled] = useState(null);
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [msgNotice, setMsgNotice] = useState(null);
    const [account, setAccount] = useState(null);
    const suiWallet = useSuiWallet();
    useEffect(() => {
        setWalletInstalled(suiWallet && true);
        if (suiWallet) {
            suiWallet.hasPermissions().then(setConnected, setMsgNotice);
        }
    }, [suiWallet]);
    const onConnectClick = useCallback(async () => {
        if (!suiWallet) {
            return;
        }
        setConnecting(true);
        try {
            await suiWallet.requestPermissions();
            setConnected(true);
        } catch (e) {
            setMsgNotice(e);
        } finally {
            setConnecting(false);
        }
    }, [suiWallet]);
    useEffect(() => {
        if (connected && suiWallet) {
            suiWallet
                .getAccounts()
                .then((accounts) => setAccount(accounts[0]), setMsgNotice);
        } else {
            setAccount(null);
        }
    }, [connected, suiWallet]);
    useEffect(() => {
        let timeout;
        if (msgNotice) {
            timeout = setTimeout(() => setMsgNotice(null), 10000);
        }
        return () => clearTimeout(timeout);
    }, [msgNotice]);
    const [creating, setCreating] = useState(false);
    const onCreateClick = useCallback(async () => {
        setCreating(true);

        try {
            const result = await suiWallet.executeMoveCall({
                packageObjectId: '0x15b103fbe7327a568b6a0b6e51ac13faa3c08879',
                module: 'testnet_nft',
                function: 'mint_to_sender',
                typeArguments: [],
                arguments: [],
                gasBudget: 10000,
            });
            const nftID =
                result?.EffectResponse?.effects?.created?.[0]?.reference
                    ?.objectId;
            // eslint-disable-next-line no-console
            console.log('NFT id', nftID);
            setMsgNotice(
                `NFT successfully created.${nftID ? `ID: ${nftID}` : ''}`
            );
        } catch (e) {
            setMsgNotice(e);
        } finally {
            setCreating(false);
        }
    }, [suiWallet]);
    return (
        <div>
            {/* <Head>
                <title>Demo NFT Dapp</title>
                <link rel="icon" href="/favicon.png" />
            </Head> */}

            <main className='flex jc-center fd-c ai-c'>
                {walletInstalled ? (
                    <div className='flex jc-center fd-c ai-c'>
                        {connected ? (
                            <>
                                <h4>Wallet connected</h4>
                                <label>
                                   {account}
                                </label>
                                <div className='flex jc-center fd-c ai-c'>
                                    <h2>Create SuidropsNFT</h2>

                                    <button
                                        type="button"
                                        onClick={onCreateClick}
                                        disabled={creating}
                                    >
                                        Create
                                    </button>
                                </div>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={onConnectClick}
                                disabled={connecting}
                            >
                                Connect
                            </button>
                        )}
                    </div>
                ) : walletInstalled === false ? (
                    <h6>It seems Sui Wallet is not installed.</h6>
                ) : null}
                {msgNotice ? (
                    <div className={(msgNotice, null, 4 === `NFT successfully created.` || msgNotice.message === `NFT successfully created.`) ? "" : "error"} >
                        <pre>
                            {/* {console.log(msgNotice)} */}
                            {msgNotice.message ||
                                JSON.stringify(msgNotice, null, 4)}
                        </pre>
                    </div>
                ) : null}
            </main>
        </div>
    );
}