
import {
    Keypair,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
  } from "@solana/web3.js";
  import {
    ExtensionType,
    TOKEN_2022_PROGRAM_ID,
    createInitializeMintInstruction,
    getMintLen,
    createInitializeMetadataPointerInstruction,
    getMint,
    getTokenMetadata,
    TYPE_SIZE,
    LENGTH_SIZE,
    getAccount,
    createMintToCheckedInstruction,
    createSetAuthorityInstruction,
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    AuthorityType,
  } from "@solana/spl-token";
  import {
    createInitializeInstruction,
    createUpdateFieldInstruction,
  
    pack,
  } from "@solana/spl-token-metadata";
  import { keypair, payer } from "./keypair.js";
  import { connection } from "./connection.js";
  
  
  //Basic info needed for creation
  const tokenName = 'Christex Bounty';
  const tokenSymbol = 'CB';
  const tokenExternalUrl = 'https://earn.christex.foundation/';
  
  
  // setting up the mint address
  const mint = Keypair.generate();
  const decimals = 9;
  const supply = 1000000;
  
  // Creating the metadata object
  const metadata = {
    mint: mint.publicKey,
    name: tokenName,
    symbol: tokenSymbol,
    uri: tokenExternalUrl,
    additionalMetadata: [['Skills Needs', 'Engineering']],
  };
  
  //calculating the space needed for the metadata
  const metadataExtension = TYPE_SIZE + LENGTH_SIZE;
  const metadataLen = pack(metadata).length;
  const mintAccMetadataPointer = getMintLen([ExtensionType.MetadataPointer])
  
  //rent required for mint account 
  const lamports = await connection.getMinimumBalanceForRentExemption(mintAccMetadataPointer + metadataLen + metadataExtension);
  
  
  //Building the instructions below 
  
  const createAccount = SystemProgram.createAccount({
    // call System Program to create new account
    fromPubkey: payer,
    newAccountPubkey: mint.publicKey,
    space: mintAccMetadataPointer,
    programId: TOKEN_2022_PROGRAM_ID,
    lamports
  });
  
  const initializeMetadataPointer =
    createInitializeMetadataPointerInstruction(
      //initializing the MetadataPointer
      mint.publicKey,
      payer,
      mint.publicKey,
      TOKEN_2022_PROGRAM_ID,
    );
  
  
  const initializeMint = createInitializeMintInstruction(
    //initializing the mint Account
    mint.publicKey,
    decimals,
    payer,
    payer,
    TOKEN_2022_PROGRAM_ID,
  );
  
  
  const initializeMetadata = createInitializeInstruction({
    //initializing the metadata
    programId: TOKEN_2022_PROGRAM_ID,
    metadata: mint.publicKey,
    updateAuthority: payer,
    mint: mint.publicKey,
    mintAuthority: payer,
    name: metadata.name,
    symbol: metadata.symbol,
    uri: metadata.uri,
  });
  
  
  const updateField = createUpdateFieldInstruction({
    //add custom metadata to the mint  
    programId: TOKEN_2022_PROGRAM_ID,
    metadata: mint.publicKey,
    updateAuthority: payer,
    field: metadata.additionalMetadata[0][0],
    value: metadata.additionalMetadata[0][1],
  });
  
  //create ATA amd mint the token to myself 
  const ata = await getAssociatedTokenAddress(mint.publicKey, payer, false, TOKEN_2022_PROGRAM_ID);
  const createATA = createAssociatedTokenAccountInstruction(
    payer,
    ata,
    payer,
    mint.publicKey,
    TOKEN_2022_PROGRAM_ID,
  );
  
  const mintInstruction = createMintToCheckedInstruction(
    mint.publicKey,
    ata,
    payer,
    supply,
    decimals,
    undefined,
    TOKEN_2022_PROGRAM_ID,
  );
  
  const setMintTokenAuthority = createSetAuthorityInstruction(
    mint.publicKey,
    payer,
    AuthorityType.MintTokens,
    null,
    undefined,
    TOKEN_2022_PROGRAM_ID,
  );
  
  
  
  // Add instructions to new transaction
  const transaction = new Transaction().add(
    createAccount,
    initializeMetadataPointer,
    initializeMint,
    initializeMetadata,
    updateField,
    createATA,
    mintInstruction,
    setMintTokenAuthority,
  );
  
  
  // Send transaction
  const transactionSignature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [keypair, mint], // Signers
  );
  
  // logging the mint account and metadata stored in the mint Account
  
  // Fetching the mint
  const mintDetails = await getMint(connection, mint.publicKey, undefined, TOKEN_2022_PROGRAM_ID);
  console.log('Mint is ->', mintDetails);
  
  // Since the mint stores the metadata in itself, we can just get it like this
  const Metadata = await getTokenMetadata(connection, mint.publicKey);
  // Now we can see the metadata coming with the mint
  console.log('Metadata is ->', Metadata);
  
  console.log(
    "\nTransaction Sig :",
    `https://solana.fm/tx/${transactionSignature}?cluster=devnet-solana`,
  );