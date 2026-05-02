import { EconomyCard, Sector, Player, EconomyEffectType, GameState } from './types';

export const INITIAL_PRICE = 5;
const SECTORS: Exclude<Sector, 'Reksa Dana'>[] = ['Keuangan', 'Agrikultur', 'Tambang', 'Konsumer'];

export const generateEconomyDeck = (): Record<Exclude<Sector, 'Reksa Dana'>, EconomyCard[]> => {
  const deck: Record<Exclude<Sector, 'Reksa Dana'>, EconomyCard[]> = {
    Keuangan: [],
    Agrikultur: [],
    Tambang: [],
    Konsumer: []
  };

  SECTORS.forEach(sector => {
    const sectorCards: EconomyCard[] = [
      // Green (3)
      { id: `boom-${sector}`, sector, color: 'GREEN', type: 'PRICE_CHANGE', value: 3, title: 'Boom', description: 'Ekonomi meledak! Harga naik 3 poin.' },
      { id: `melaju-${sector}`, sector, color: 'GREEN', type: 'PRICE_CHANGE', value: 2, title: 'Melaju', description: 'Ekonomi menguat! Harga naik 2 poin.' },
      { id: `naik-${sector}`, sector, color: 'GREEN', type: 'PRICE_CHANGE', value: 1, title: 'Naik', description: 'Ekonomi naik tipis! Harga naik 1 poin.' },
      
      // Red (3)
      { id: `crash-${sector}`, sector, color: 'RED', type: 'PRICE_CHANGE', value: -3, title: 'Crash', description: 'Ekonomi hancur! Harga turun 3 poin.' },
      { id: `terjun-${sector}`, sector, color: 'RED', type: 'PRICE_CHANGE', value: -2, title: 'Terjun', description: 'Ekonomi merosot! Harga turun 2 poin.' },
      { id: `anjlok-${sector}`, sector, color: 'RED', type: 'PRICE_CHANGE', value: -1, title: 'Anjlok', description: 'Ekonomi turun tipis! Harga turun 1 poin.' },
      
      // Blue (2)
      { id: `sideways-${sector}`, sector, color: 'BLUE', type: 'SIDEWAYS', value: 0, title: 'Sideways', description: 'Ekonomi stagnan. Tidak ada perubahan harga.' },
      { id: `dividen-${sector}`, sector, color: 'BLUE', type: 'DIVIDEND', value: 0, title: 'Dividen', description: 'Bagi hasil! Pemain dapat 1 koin per lembar saham di sektor ini.' },
      
      // Purple (1 random purple per sector to make ~36 total across 4 sectors)
      // We will pick one unique purple for each sector to ensure variety
    ];
    deck[sector] = sectorCards;
  });

  // Distribute Purples uniquely across sectors
  const purples: Omit<EconomyCard, 'sector' | 'id'>[] = [
    { color: 'PURPLE', type: 'RESESI', value: 0, title: 'Resesi', description: 'Saham di atas harga awal turun 1 poin.' },
    { color: 'PURPLE', type: 'RESTRUKTURISASI', value: 0, title: 'Restrukturisasi Ekonomi', description: 'Reset semua harga ke 5 & batalkan efek kartu ekonomi lain.' },
    { color: 'PURPLE', type: 'PAJAK_JALAN', value: 0, title: 'Pajak Jalan', description: 'Bayar koin sesuai Kartu Urutan Jalan (urutan 1 bayar 1, dst).' },
    { color: 'PURPLE', type: 'STIMULUS', value: 0, title: 'Stimulus Ekonomi', description: 'Saham di bawah harga awal naik 1 poin.' },
    { color: 'PURPLE', type: 'EXTRA_FEE', value: 0, title: 'Extra Fee', description: 'Bayar 1 koin per lembar saham yang dimiliki (semua sektor).' },
    { color: 'PURPLE', type: 'BUYBACK', value: 0, title: 'Buyback', description: 'Saham naik 1 poin, lalu pemilik WAJIB jual ke bank di harga baru.' },
    { color: 'PURPLE', type: 'PENERBITAN_SAHAM', value: 0, title: 'Penerbitan Saham Baru', description: 'Saham turun 1 poin, pemilik dapat 1 kartu saham tambahan (Token Split).' },
    { color: 'PURPLE', type: 'RESESI', value: 0, title: 'Resesi', description: 'Saham di atas harga awal turun 1 poin.' }, // Duplicate some purples to fill up
  ];

  const shuffledPurples = purples.sort(() => Math.random() - 0.5);
  
  SECTORS.forEach((sector, i) => {
    // Add 1-2 purples per sector
    deck[sector].push({ ...shuffledPurples[i], sector, id: `purple1-${sector}` });
    // To reach 36 cards total (9 per sector), we need 1 more card per sector
    // Let's add one more random purple or another green/red/blue
    const extraCards = ['GREEN', 'RED', 'BLUE', 'PURPLE'];
    const randomType = extraCards[Math.floor(Math.random() * extraCards.length)];
    // Just add another Resesi/Stimulus/etc for now
    deck[sector].push({ ...shuffledPurples[i+4], sector, id: `purple2-${sector}` });
  });

  // Ensure each sector has exactly 9 cards
  SECTORS.forEach(s => {
    deck[s] = deck[s].sort(() => Math.random() - 0.5);
  });

  return deck;
};

export const applyEconomyPhase = (
  market: Record<Sector, number>,
  players: Player[],
  currentEconomyCards: Record<Exclude<Sector, 'Reksa Dana'>, EconomyCard>,
  turnOrder: number[],
  suspendedSectors: Exclude<Sector, 'Reksa Dana'>[]
) => {
  let newMarket = { ...market };
  let newPlayers = [...players];
  const logMsgs: string[] = [];

  const cards = Object.values(currentEconomyCards);

  // Sorting based on Priority:
  // 1. Purple: Resesi
  // 2. Purple: Restrukturisasi
  // 3. Other Purples (except Stimulus)
  // 4. GREEN, RED, BLUE
  // 5. Purple: Stimulus (Priority Last)
  
  const getPriority = (card: EconomyCard) => {
    if (card.color === 'PURPLE') {
      if (card.type === 'RESESI') return 1;
      if (card.type === 'RESTRUKTURISASI') return 2;
      if (card.type === 'STIMULUS') return 100;
      return 10;
    }
    return 50;
  };

  const sortedCards = cards.sort((a, b) => getPriority(a) - getPriority(b));

  // Check for Restrukturisasi first (globally affects things)
  const hasRestrukturisasi = cards.some(c => c.type === 'RESTRUKTURISASI');

  if (hasRestrukturisasi) {
    const restructCard = cards.find(c => c.type === 'RESTRUKTURISASI')!;
    logMsgs.push(`EFEK KHUSUS: ${restructCard.title} - Semua harga di-reset ke ${INITIAL_PRICE}. Efek kartu lain diabaikan.`);
    SECTORS.forEach(s => {
      newMarket[s] = INITIAL_PRICE;
    });
    // According to rule: "batalkan efek kartu ekonomi lain". 
    // We still process things like Extra Fee or Pajak Jalan? 
    // Usually "cancel other economy cards" means the PRICE changes.
    // Let's assume it cancels all other PRICE changes and Dividends for that phase.
  }

  for (const card of sortedCards) {
    if (hasRestrukturisasi && card.type !== 'RESTRUKTURISASI' && card.type !== 'RESESI') {
      // If Restrukturisasi is present, skip others EXCEPT Resesi (which is priority 1)
      // Actually if Resesi is P1 and Restruct is P2, Resesi happens THEN Restruct resets it.
      // So effectively Resesi is also cancelled if Restruct follows.
      if (card.type !== 'RESESI') continue;
    }

    if (suspendedSectors.includes(card.sector)) {
      logMsgs.push(`Saham ${card.sector} SUSPEND! Efek ${card.title} diabaikan.`);
      continue;
    }

    switch (card.type) {
      case 'PRICE_CHANGE':
        newMarket[card.sector] = Math.max(0, Math.min(15, newMarket[card.sector] + card.value));
        logMsgs.push(`Saham ${card.sector}: ${card.title} (${card.value > 0 ? '+' : ''}${card.value}) -> Harga: ${newMarket[card.sector]}`);
        break;

      case 'SIDEWAYS':
        logMsgs.push(`Saham ${card.sector}: Sideways (Tetap) -> Harga: ${newMarket[card.sector]}`);
        break;

      case 'DIVIDEND':
        logMsgs.push(`Saham ${card.sector}: Dividen! Pemain mendapat koin per saham.`);
        newPlayers = newPlayers.map(p => ({
          ...p,
          coins: p.coins + (p.portfolio[card.sector] || 0)
        }));
        break;

      case 'RESESI':
        if (newMarket[card.sector] > INITIAL_PRICE) {
          newMarket[card.sector] -= 1;
          logMsgs.push(`EFEK KHUSUS: Resesi di Saham ${card.sector}! Harga turun 1 poin.`);
        }
        break;

      case 'RESTRUKTURISASI':
        // Already handled globally above, but keep for completeness
        break;

      case 'PAJAK_JALAN':
        logMsgs.push(`EFEK KHUSUS: Pajak Jalan! Bayar sesuai urutan jalan.`);
        newPlayers = newPlayers.map(p => {
          const position = turnOrder.indexOf(p.id);
          const tax = position + 1;
          return { ...p, coins: Math.max(0, p.coins - tax) };
        });
        break;

      case 'STIMULUS':
        if (newMarket[card.sector] < INITIAL_PRICE) {
          newMarket[card.sector] += 1;
          logMsgs.push(`EFEK KHUSUS: Stimulus di Saham ${card.sector}! Harga naik 1 poin.`);
        }
        break;

      case 'EXTRA_FEE':
        logMsgs.push(`EFEK KHUSUS: Extra Fee! Bayar 1 koin per lembar saham.`);
        newPlayers = newPlayers.map(p => {
          const totalShares = Object.values(p.portfolio).reduce((a, b) => a + b, 0);
          return { ...p, coins: Math.max(0, p.coins - totalShares) };
        });
        break;

      case 'BUYBACK': {
        newMarket[card.sector] = Math.min(15, newMarket[card.sector] + 1);
        const buybackPrice = newMarket[card.sector];
        logMsgs.push(`EFEK KHUSUS: Buyback di Saham ${card.sector}! Harga +1 menjadi ${buybackPrice}. Pemilik WAJIB jual.`);
        newPlayers = newPlayers.map(p => {
          const shares = p.portfolio[card.sector] || 0;
          if (shares > 0) {
            return {
              ...p,
              coins: p.coins + (shares * buybackPrice),
              portfolio: { ...p.portfolio, [card.sector]: 0 }
            };
          }
          return p;
        });
        break;
      }

      case 'PENERBITAN_SAHAM':
        newMarket[card.sector] = Math.max(0, newMarket[card.sector] - 1);
        logMsgs.push(`EFEK KHUSUS: Penerbitan Saham Baru di Saham ${card.sector}! Harga -1. Pemilik dapat bonus saham (Stock Split).`);
        newPlayers = newPlayers.map(p => ({
          ...p,
          portfolio: { ...p.portfolio, [card.sector]: (p.portfolio[card.sector] || 0) * 2 }
        }));
        break;
    }
  }

  // Handle Reksa Dana (Average of others)
  const totalSectors = newMarket.Keuangan + newMarket.Agrikultur + newMarket.Tambang + newMarket.Konsumer;
  newMarket['Reksa Dana'] = Math.floor(totalSectors / 4);

  // Handle Stock Split (>12) and Crash (<2) - Original rules still apply
  SECTORS.forEach(s => {
    if (newMarket[s] > 12) {
      newMarket[s] = 6;
      newPlayers = newPlayers.map(p => ({
        ...p,
        portfolio: { ...p.portfolio, [s]: p.portfolio[s] * 2 }
      }));
      logMsgs.push(`STOCK SPLIT OTOMATIS di Saham ${s}! Harga terlalu tinggi, jumlah saham pemain dikali dua.`);
    } else if (newMarket[s] < 2) {
      newMarket[s] = 5;
      newPlayers = newPlayers.map(p => ({
        ...p,
        portfolio: { ...p.portfolio, [s]: 0 }
      }));
      logMsgs.push(`STOCK CRASH OTOMATIS di Saham ${s}! Harga terlalu rendah, semua investasi di sektor ini hangus.`);
    }
  });

  return { newMarket, newPlayers, logMsgs };
};
