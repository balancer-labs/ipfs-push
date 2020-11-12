import fetch from 'node-fetch';
import pinataSDK from '@pinata/sdk';
import fleek from '@fleekhq/fleek-storage-js';
import { jsonToGraphQLQuery } from "json-to-graphql-query";

export const ipfsNode = process.env.IPFS_NODE || 'cloudflare-ipfs.com';

export async function ipfsPinFleek(key, body) {
  const config: any = {
    apiKey: process.env.FLEEK_API_KEY,
    apiSecret: process.env.FLEEK_API_SECRET,
    bucket: 'balancer-team-bucket'
  };
  const input = config;
  input.key = key;
  input.data = JSON.stringify(body);
  const result = await fleek.upload(input);
  return result.hashV0;
}

export async function ipfsPinByHashPinata(ipfsHash) {
  const pinata = pinataSDK(
    process.env.PINATA_API_KEY,
    process.env.PINATA_SECRET_API_KEY
  );
  const result = await pinata.pinByHash(ipfsHash, {
    customPinPolicy: {
      regions: [
        { id: 'FRA1', desiredReplicationCount: 2 },
        { id: 'NYC1', desiredReplicationCount: 2 }
      ]
    }
  });
  return result.IpfsHash;
}

export async function ipfsPin(key: string, body) {
  const ipfsHash = await ipfsPinFleek(key, body);
  const result = await ipfsPinByHashPinata(ipfsHash);
  return ipfsHash;
}

export async function subgraphRequest(url, query) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: jsonToGraphQLQuery({ query }) })
  });
  const { data } = await res.json();
  return data || {};
}

export function ipfsGet(gateway, ipfsHash, protocolType = 'ipfs') {
  const url = `https://${ipfsNode}/${protocolType}/${ipfsHash}`;
  return fetch(url).then(res => res.json());
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
