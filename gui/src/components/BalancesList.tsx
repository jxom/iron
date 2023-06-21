import {
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
} from "@mui/material";
import { formatUnits } from "viem";
import { erc20ABI, useContractRead } from "wagmi";

import { useInvoke } from "../hooks/tauri";
import { useCurrentNetwork } from "../hooks/useCurrentNetwork";
import { useNativeBalance } from "../hooks/useNativeBalance";
import { useTokensBalances } from "../hooks/useTokensBalances";
import { Address, GeneralSettings } from "../types";
import { CopyToClipboard } from "./CopyToClipboard";
import { CryptoIcon } from "./IconCrypto";
import Panel from "./Panel";

export function BalancesList() {
  return (
    <Panel>
      <Stack>
        <List>
          <BalanceETH />
          <BalancesERC20 />
        </List>
      </Stack>
    </Panel>
  );
}

function BalanceETH() {
  const { currentNetwork } = useCurrentNetwork();
  const { balance } = useNativeBalance();

  if (!currentNetwork) return null;

  return (
    <BalanceItem
      balance={balance}
      decimals={currentNetwork.decimals}
      symbol={currentNetwork.currency}
    />
  );
}

function BalancesERC20() {
  const { balances } = useTokensBalances();
  const { currentNetwork } = useCurrentNetwork();
  const { data: settings } = useInvoke<GeneralSettings>("settings_get");

  const filteredBalances = (balances || [])
    .map<[Address, bigint]>(([c, b]) => [c, BigInt(b)])
    .filter(([, balance]) => (settings?.hideEmptyTokens ? !!balance : true));

  return (
    <>
      {filteredBalances.map(([contract, balance]) => (
        <BalanceERC20
          key={contract}
          contract={contract}
          balance={balance}
          chainId={currentNetwork?.chain_id}
        />
      ))}
    </>
  );
}

function BalanceERC20({
  contract,
  balance,
  chainId,
}: {
  contract: Address;
  balance: bigint;
  chainId?: number;
}) {
  const { data: name } = useContractRead({
    address: contract,
    abi: erc20ABI,
    functionName: "symbol",
    chainId,
  });

  const { data: decimals } = useContractRead({
    address: contract,
    abi: erc20ABI,
    functionName: "decimals",
    chainId,
  });

  if (!name || !decimals) return null;

  return <BalanceItem balance={balance} decimals={decimals} symbol={name} />;
}

interface BalanceItemProps {
  balance: bigint;
  decimals: number;
  symbol: string;
}

function BalanceItem({ balance, decimals, symbol }: BalanceItemProps) {
  // Some tokens respond with 1 decimals, that breaks this truncatedBalance without the Math.ceil
  const truncatedBalance =
    balance - (balance % BigInt(Math.ceil(0.001 * 10 ** decimals)));

  return (
    <ListItem>
      <ListItemAvatar>
        <Avatar>
          <CryptoIcon ticker={symbol} />
        </Avatar>
      </ListItemAvatar>
      <ListItemText secondary={symbol}>
        <CopyToClipboard label={balance.toString()}>
          {formatUnits(truncatedBalance, decimals)}
        </CopyToClipboard>
      </ListItemText>
    </ListItem>
  );
}