import AntDesign from '@expo/vector-icons/AntDesign';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  computeReliabilityScore,
  setStockVote,
  type StockVote,
} from '../lib/posts';
import { useThemeColors, type AppColors } from '../lib/theme';

type ReliabilityVoteProps = {
  postId: string;
  reliabilityScore?: number | null;
  inStockVotes?: number;
  soldOutVotes?: number;
  myVote?: StockVote | null;
  compact?: boolean;
};

function scoreColor(score: number | null, COLORS: AppColors): string {
  if (score === null) return COLORS.textSecondary;
  if (score >= 70) return COLORS.good;
  if (score >= 40) return COLORS.mid;
  return COLORS.low;
}

export default function ReliabilityVote({
  postId,
  reliabilityScore = null,
  inStockVotes = 0,
  soldOutVotes = 0,
  myVote = null,
  compact = false,
}: ReliabilityVoteProps) {
  const COLORS = useThemeColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [score, setScore] = useState<number | null>(reliabilityScore);
  const [inStock, setInStock] = useState(inStockVotes);
  const [soldOut, setSoldOut] = useState(soldOutVotes);
  const [vote, setVote] = useState<StockVote | null>(myVote);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setScore(reliabilityScore);
    setInStock(inStockVotes);
    setSoldOut(soldOutVotes);
    setVote(myVote);
  }, [postId, reliabilityScore, inStockVotes, soldOutVotes, myVote]);

  const total = inStock + soldOut;

  const handleVote = async (next: StockVote) => {
    if (busy) return;
    setBusy(true);

    const prev = { score, inStock, soldOut, vote };

    let nextIn = inStock;
    let nextOut = soldOut;
    let nextVote: StockVote | null = next;

    if (vote === next) {
      nextVote = null;
      if (next === 'in_stock') nextIn = Math.max(0, nextIn - 1);
      else nextOut = Math.max(0, nextOut - 1);
    } else {
      if (vote === 'in_stock') nextIn = Math.max(0, nextIn - 1);
      if (vote === 'sold_out') nextOut = Math.max(0, nextOut - 1);
      if (next === 'in_stock') nextIn += 1;
      else nextOut += 1;
    }

    setInStock(nextIn);
    setSoldOut(nextOut);
    setVote(nextVote);
    setScore(computeReliabilityScore(nextIn, nextOut));

    try {
      const result = await setStockVote(postId, next);
      if (result) {
        setInStock(result.inStockVotes);
        setSoldOut(result.soldOutVotes);
        setVote(result.myVote);
        setScore(result.reliabilityScore);
      } else {
        setInStock(prev.inStock);
        setSoldOut(prev.soldOut);
        setVote(prev.vote);
        setScore(prev.score);
      }
    } catch (err) {
      console.error('Error casting stock vote:', err);
      setInStock(prev.inStock);
      setSoldOut(prev.soldOut);
      setVote(prev.vote);
      setScore(prev.score);
    } finally {
      setBusy(false);
    }
  };

  const label =
    score === null
      ? 'No reliability reports yet'
      : `${score}% likely still there · ${total} report${total === 1 ? '' : 's'}`;

  const tone = scoreColor(score, COLORS);

  if (compact) {
    return (
      <View style={styles.compactRow}>
        <AntDesign name="rise" size={11} color={tone} />
        <Text style={[styles.compactText, { color: tone }]}>
          {score === null ? 'Unrated' : `${score}%`}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.scoreLabel, { color: tone }]}>{label}</Text>

      <View style={styles.voteRow}>
        <TouchableOpacity
          style={[styles.voteBtn, vote === 'in_stock' && styles.voteBtnInStock]}
          onPress={() => handleVote('in_stock')}
          activeOpacity={0.8}
          disabled={busy}
        >
          <AntDesign
            name="check-circle"
            size={13}
            color={vote === 'in_stock' ? '#fff' : COLORS.good}
          />
          <Text style={[styles.voteText, vote === 'in_stock' && styles.voteTextActive]}>
            Still there
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.voteBtn, vote === 'sold_out' && styles.voteBtnSoldOut]}
          onPress={() => handleVote('sold_out')}
          activeOpacity={0.8}
          disabled={busy}
        >
          <AntDesign
            name="close-circle"
            size={13}
            color={vote === 'sold_out' ? '#fff' : COLORS.low}
          />
          <Text style={[styles.voteText, vote === 'sold_out' && styles.voteTextActive]}>
            Sold out
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (COLORS: AppColors) => StyleSheet.create({
  wrap: {
    marginTop: 6,
    gap: 6,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  voteRow: {
    flexDirection: 'row',
    gap: 6,
  },
  voteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  voteBtnInStock: {
    backgroundColor: COLORS.good,
    borderColor: COLORS.good,
  },
  voteBtnSoldOut: {
    backgroundColor: COLORS.low,
    borderColor: COLORS.low,
  },
  voteText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  voteTextActive: {
    color: '#fff',
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
