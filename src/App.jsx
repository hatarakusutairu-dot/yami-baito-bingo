import { useState, useEffect, useCallback, useRef } from "react";

// レスポンシブ用のCSS
const globalStyles = `
  * {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
  }

  html, body, #root {
    margin: 0;
    padding: 0;
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* PC用スタイル (768px以上) */
  @media (min-width: 768px) {
    .app-container {
      max-width: 800px !important;
    }
    .menu-container {
      max-width: 500px !important;
    }
    .game-title {
      font-size: 42px !important;
    }
    .mode-button {
      padding: 24px 32px !important;
    }
    .mode-button-title {
      font-size: 28px !important;
    }
    .mode-button-desc {
      font-size: 14px !important;
    }
    .bingo-cell {
      font-size: 13px !important;
    }
    .bingo-cell-icon {
      font-size: 12px !important;
    }
    .call-word {
      font-size: 36px !important;
    }
    .header-title {
      font-size: 24px !important;
    }
    .memory-card {
      min-height: 90px !important;
    }
    .memory-card-word {
      font-size: 16px !important;
    }
    .memory-card-meaning {
      font-size: 11px !important;
    }
  }

  /* タブレット用 (481px-767px) */
  @media (min-width: 481px) and (max-width: 767px) {
    .bingo-cell {
      font-size: 11px !important;
    }
    .memory-card {
      min-height: 80px !important;
    }
  }

  /* スマホ用 (480px以下) */
  @media (max-width: 480px) {
    .app-container {
      padding: 12px !important;
    }
    .game-title {
      font-size: 28px !important;
    }
    .bingo-cell {
      font-size: 9px !important;
      padding: 2px !important;
    }
    .bingo-cell-icon {
      font-size: 8px !important;
    }
    .call-word {
      font-size: 24px !important;
    }
    .header-title {
      font-size: 16px !important;
    }
    .header-btn {
      padding: 6px 10px !important;
      font-size: 12px !important;
    }
    .memory-card {
      min-height: 65px !important;
    }
    .memory-card-word {
      font-size: 11px !important;
    }
    .memory-card-meaning {
      font-size: 8px !important;
    }
  }

  /* 超小型スマホ用 (360px以下) */
  @media (max-width: 360px) {
    .bingo-cell {
      font-size: 8px !important;
    }
    .call-word {
      font-size: 20px !important;
    }
    .mode-button {
      padding: 16px !important;
    }
    .mode-button-title {
      font-size: 20px !important;
    }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.85; }
  }
`;

// 闘バイト危険ワードデータベース
const DANGER_WORDS = [
  // 隠語系（危険度：最大）
  { word: "UD", meaning: "受け子・出し子の隠語。詐欺の実行役を指す", category: "隠語", danger: 3 },
  { word: "叩き（タタキ）", meaning: "強盗・窃盗を意味する隠語。「T」とも表記", category: "隠語", danger: 3 },
  { word: "かけ子", meaning: "特殊詐欺で被害者に電話をかけて騙す役割", category: "隠語", danger: 3 },
  { word: "受け子", meaning: "詐欺で現金やカードを被害者から受け取る役", category: "隠語", danger: 3 },
  { word: "出し子", meaning: "盗んだカードでATMからお金を引き出す役", category: "隠語", danger: 3 },
  { word: "手押し", meaning: "違法薬物の対面取引を意味する隠語", category: "隠語", danger: 3 },
  { word: "炊飯器", meaning: "貴重品・金目の物を指す隠語", category: "隠語", danger: 3 },
  { word: "打ち子", meaning: "パチンコのサクラ。売上横領に加担させられる", category: "隠語", danger: 3 },
  { word: "運び屋", meaning: "違法薬物や詐欺の現金を運ぶ役割", category: "隠語", danger: 3 },
  { word: "猫", meaning: "運び屋の隠語。荷物を運ぶだけと言われる", category: "隠語", danger: 3 },

  // 甘い言葉系（危険度：大）
  { word: "高額報酬", meaning: "異常に高い報酬で人を釣る常套手段", category: "甘い言葉", danger: 2 },
  { word: "即日即金", meaning: "すぐにお金がもらえると誘う危険ワード", category: "甘い言葉", danger: 2 },
  { word: "ホワイト案件", meaning: "安全を強調するほど危険。本当に安全なら書かない", category: "甘い言葉", danger: 2 },
  { word: "リスクなし", meaning: "犯罪にリスクがないわけがない", category: "甘い言葉", danger: 2 },
  { word: "誰でも簡単", meaning: "簡単に高収入は得られない。犯罪の入口", category: "甘い言葉", danger: 2 },
  { word: "日給5万円〜", meaning: "通常のバイトではありえない高額日給", category: "甘い言葉", danger: 2 },
  { word: "短時間で高収入", meaning: "短時間×高収入の組み合わせは危険信号", category: "甘い言葉", danger: 2 },
  { word: "〜するだけ", meaning: "「運ぶだけ」「受け取るだけ」は犯罪の実行役", category: "甘い言葉", danger: 2 },
  { word: "違法ではない", meaning: "わざわざ合法を主張する時点で怪しい", category: "甘い言葉", danger: 2 },
  { word: "絶対捕まらない", meaning: "「捕まる」という言葉が出る時点で犯罪", category: "甘い言葉", danger: 2 },

  // 手口系（危険度：中〜大）
  { word: "テレグラム", meaning: "秘匿性の高いアプリ。犯罪グループが愛用", category: "手口", danger: 2 },
  { word: "シグナル", meaning: "メッセージが消える機能を悪用される", category: "手口", danger: 2 },
  { word: "身分証送って", meaning: "個人情報は脅迫材料にされる", category: "手口", danger: 2 },
  { word: "家族の情報教えて", meaning: "家族を脅して逃げられなくする手口", category: "手口", danger: 3 },
  { word: "DMで連絡ください", meaning: "SNSのDMは闇バイト勧誘の入口", category: "手口", danger: 1 },
  { word: "仕事紹介します", meaning: "SNSでの突然の仕事紹介は要注意", category: "手口", danger: 1 },
  { word: "SIM案件", meaning: "携帯の不正契約（名義貸し）の隠語", category: "隠語", danger: 3 },
  { word: "トクリュウ", meaning: "匿名・流動型犯罪グループの略称", category: "知識", danger: 2 },
  { word: "荷物を運ぶだけ", meaning: "中身は違法薬物や詐欺の現金の可能性", category: "甘い言葉", danger: 2 },
  { word: "コールセンター業務", meaning: "架け子（詐欺電話）の偽装求人", category: "甘い言葉", danger: 2 },
];

// シャッフル関数
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// 危険度に応じた色
const getDangerColor = (danger) => {
  if (danger === 3) return { bg: "#ff1744", text: "#fff", glow: "rgba(255,23,68,0.5)" };
  if (danger === 2) return { bg: "#ff9100", text: "#fff", glow: "rgba(255,145,0,0.5)" };
  return { bg: "#ffd600", text: "#1a1a2e", glow: "rgba(255,214,0,0.5)" };
};

const getCategoryIcon = (cat) => {
  if (cat === "隠語") return "🔐";
  if (cat === "甘い言葉") return "🍬";
  if (cat === "手口") return "⚠️";
  return "📚";
};

// =========== ビンゴモード ===========
function BingoGame({ onBack }) {
  const [board, setBoard] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [calledWords, setCalledWords] = useState([]);
  const [currentCall, setCurrentCall] = useState(null);
  const [showMeaning, setShowMeaning] = useState(false);
  const [bingoLines, setBingoLines] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [deck, setDeck] = useState([]);
  const [deckIndex, setDeckIndex] = useState(0);
  const [callCount, setCallCount] = useState(0);

  useEffect(() => {
    resetGame();
  }, []);

  const resetGame = () => {
    const shuffled = shuffle(DANGER_WORDS);
    const boardWords = shuffled.slice(0, 25).map((w, i) => ({
      ...w,
      id: i,
    }));
    // Center is FREE
    boardWords[12] = { word: "FREE", meaning: "フリーマス", category: "free", danger: 0, id: 12 };
    setBoard(boardWords);
    setSelected(new Set([12]));
    setDeck(shuffle(DANGER_WORDS));
    setDeckIndex(0);
    setCalledWords([]);
    setCurrentCall(null);
    setShowMeaning(false);
    setBingoLines([]);
    setGameOver(false);
    setCallCount(0);
  };

  const checkBingo = (sel) => {
    const lines = [];
    // rows
    for (let r = 0; r < 5; r++) {
      if ([0,1,2,3,4].every(c => sel.has(r * 5 + c))) {
        lines.push([0,1,2,3,4].map(c => r * 5 + c));
      }
    }
    // cols
    for (let c = 0; c < 5; c++) {
      if ([0,1,2,3,4].every(r => sel.has(r * 5 + c))) {
        lines.push([0,1,2,3,4].map(r => r * 5 + c));
      }
    }
    // diags
    if ([0,6,12,18,24].every(i => sel.has(i))) lines.push([0,6,12,18,24]);
    if ([4,8,12,16,20].every(i => sel.has(i))) lines.push([4,8,12,16,20]);
    return lines;
  };

  const callNext = () => {
    if (gameOver) return;
    setShowMeaning(false);
    if (deckIndex >= deck.length) return;
    const word = deck[deckIndex];
    setCurrentCall(word);
    setCalledWords(prev => [...prev, word]);
    setDeckIndex(prev => prev + 1);
    setCallCount(prev => prev + 1);
  };

  const toggleCell = (idx) => {
    if (gameOver) return;
    if (idx === 12) return;
    const cell = board[idx];
    if (!calledWords.find(w => w.word === cell.word) && cell.category !== "free") return;

    const newSel = new Set(selected);
    if (newSel.has(idx)) {
      newSel.delete(idx);
    } else {
      newSel.add(idx);
    }
    setSelected(newSel);

    const lines = checkBingo(newSel);
    if (lines.length > 0) {
      setBingoLines(lines);
      setGameOver(true);
    }
  };

  const isBingoCell = (idx) => bingoLines.some(line => line.includes(idx));

  return (
    <div className="app-container" style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a1a2e 100%)", padding: "16px", color: "#e0e0e0" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
          <button className="header-btn" onClick={onBack} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>
            ← 戻る
          </button>
          <div style={{ textAlign: "center", flex: 1, minWidth: 200 }}>
            <h2 className="header-title" style={{ margin: 0, fontSize: 20, color: "#ff6b6b", fontFamily: "'Noto Sans JP', sans-serif", letterSpacing: 2 }}>
              🚨 闇バイトビンゴ 🚨
            </h2>
            <p style={{ margin: 0, fontSize: 11, color: "#888", marginTop: 2 }}>危険ワードが揃ったら…あなたは犯罪者！</p>
          </div>
          <button className="header-btn" onClick={resetGame} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>
            🔄 リセット
          </button>
        </div>

        {/* Call Area */}
        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 16, marginBottom: 16, border: "1px solid rgba(255,255,255,0.1)", textAlign: "center" }}>
          {currentCall ? (
            <>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>📢 コール #{callCount}</div>
              <div className="call-word" style={{
                fontSize: 28, fontWeight: 800, color: getDangerColor(currentCall.danger).bg,
                textShadow: `0 0 20px ${getDangerColor(currentCall.danger).glow}`,
                fontFamily: "'Noto Sans JP', sans-serif"
              }}>
                {getCategoryIcon(currentCall.category)} {currentCall.word}
              </div>
              <button
                onClick={() => setShowMeaning(!showMeaning)}
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#ccc", padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, marginTop: 8 }}
              >
                {showMeaning ? "意味を隠す" : "💡 意味を見る"}
              </button>
              {showMeaning && (
                <div style={{ marginTop: 8, fontSize: 13, color: "#ffab40", background: "rgba(255,171,64,0.1)", borderRadius: 8, padding: "8px 12px" }}>
                  {currentCall.meaning}
                </div>
              )}
            </>
          ) : (
            <div style={{ color: "#666", fontSize: 14 }}>「次のワード」を押してゲーム開始！</div>
          )}
          <button
            onClick={callNext}
            disabled={gameOver}
            style={{
              marginTop: 12, padding: "10px 32px", fontSize: 16, fontWeight: 700,
              background: gameOver ? "#333" : "linear-gradient(135deg, #ff1744, #d500f9)",
              color: "#fff", border: "none", borderRadius: 10, cursor: gameOver ? "default" : "pointer",
              boxShadow: gameOver ? "none" : "0 4px 20px rgba(255,23,68,0.4)",
              transition: "all 0.2s"
            }}
          >
            {gameOver ? "ゲーム終了" : "📣 次のワード"}
          </button>
        </div>

        {/* Bingo Result */}
        {gameOver && (
          <div style={{
            background: "linear-gradient(135deg, rgba(255,23,68,0.2), rgba(213,0,249,0.2))",
            borderRadius: 12, padding: 16, marginBottom: 16, textAlign: "center",
            border: "2px solid #ff1744",
            animation: "pulse 1s infinite"
          }}>
            <div style={{ fontSize: 32 }}>🚨 BINGO!! 🚨</div>
            <div style={{ fontSize: 16, color: "#ff6b6b", fontWeight: 700, marginTop: 4 }}>
              危険ワードが揃いました！
            </div>
            <div style={{ fontSize: 13, color: "#ccc", marginTop: 8 }}>
              {callCount}回目のコールでビンゴ成立。<br />
              実際にこれらのワードに出会ったら<strong style={{ color: "#ff1744" }}>絶対に関わらない</strong>こと！
            </div>
          </div>
        )}

        {/* Board */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6,
          background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: 6,
          maxWidth: 500, margin: "0 auto"
        }}>
          {board.map((cell, idx) => {
            const isSelected = selected.has(idx);
            const isBingo = isBingoCell(idx);
            const isFree = idx === 12;
            const isCalled = calledWords.some(w => w.word === cell.word) || isFree;
            const dangerStyle = getDangerColor(cell.danger);

            return (
              <button
                key={idx}
                className="bingo-cell"
                onClick={() => toggleCell(idx)}
                style={{
                  aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  background: isBingo
                    ? "linear-gradient(135deg, #ff1744, #d500f9)"
                    : isSelected
                      ? `linear-gradient(135deg, ${dangerStyle.bg}dd, ${dangerStyle.bg}88)`
                      : isCalled
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(255,255,255,0.03)",
                  border: isBingo ? "2px solid #fff" : isSelected ? `2px solid ${dangerStyle.bg}` : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8, cursor: isFree ? "default" : "pointer",
                  color: isSelected || isBingo ? "#fff" : isCalled ? "#ddd" : "#555",
                  padding: 4, transition: "all 0.2s",
                  boxShadow: isBingo ? `0 0 20px ${dangerStyle.glow}` : isSelected ? `0 0 10px ${dangerStyle.glow}` : "none",
                  fontSize: 11, minHeight: 60
                }}
              >
                {isFree ? (
                  <span style={{ fontSize: 14, fontWeight: 800 }}>FREE</span>
                ) : (
                  <>
                    <span className="bingo-cell-icon" style={{ fontSize: 10, opacity: 0.7 }}>{getCategoryIcon(cell.category)}</span>
                    <span style={{ fontSize: cell.word.length > 6 ? 9 : 11, fontWeight: 700, lineHeight: 1.2, textAlign: "center", wordBreak: "break-all" }}>
                      {cell.word}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Called History */}
        {calledWords.length > 0 && (
          <div style={{ marginTop: 16, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>📋 コール履歴（{calledWords.length}語）</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {calledWords.map((w, i) => (
                <span key={i} style={{
                  fontSize: 10, padding: "2px 8px", borderRadius: 4,
                  background: `${getDangerColor(w.danger).bg}22`,
                  color: getDangerColor(w.danger).bg,
                  border: `1px solid ${getDangerColor(w.danger).bg}44`
                }}>
                  {w.word}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div style={{ marginTop: 16, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 12, fontSize: 11, color: "#888" }}>
          <strong style={{ color: "#aaa" }}>📖 遊び方</strong>
          <div style={{ marginTop: 4 }}>
            ①「次のワード」でワードを引く → ② ボード上に同じワードがあればタップ → ③ 縦・横・斜めが揃ったらビンゴ！<br/>
            💡 ワードの意味ボタンで解説が見られます。<strong style={{ color: "#ff6b6b" }}>揃えば揃うほど犯罪に近づく</strong>ことを体感しよう。
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.85 } }`}</style>
    </div>
  );
}

// =========== 神経衰弱モード ===========
function MemoryGame({ onBack }) {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState(new Set());
  const [attempts, setAttempts] = useState(0);
  const [showResult, setShowResult] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [pairCount, setPairCount] = useState(8);
  const lockRef = useRef(false);

  const initGame = useCallback((count) => {
    const words = shuffle(DANGER_WORDS).slice(0, count);
    const pairs = words.flatMap((w, i) => [
      { ...w, pairId: i, type: "word", cardId: i * 2 },
      { ...w, pairId: i, type: "meaning", cardId: i * 2 + 1 }
    ]);
    setCards(shuffle(pairs));
    setFlipped([]);
    setMatched(new Set());
    setAttempts(0);
    setShowResult(null);
    setGameComplete(false);
    lockRef.current = false;
  }, []);

  useEffect(() => {
    initGame(pairCount);
  }, [pairCount, initGame]);

  const handleFlip = (idx) => {
    if (lockRef.current) return;
    if (flipped.includes(idx)) return;
    if (matched.has(cards[idx].pairId)) return;

    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      lockRef.current = true;
      setAttempts(a => a + 1);
      const [a, b] = newFlipped;
      if (cards[a].pairId === cards[b].pairId && cards[a].type !== cards[b].type) {
        // Match!
        const newMatched = new Set(matched);
        newMatched.add(cards[a].pairId);
        setShowResult({ success: true, word: cards[a] });
        setTimeout(() => {
          setMatched(newMatched);
          setFlipped([]);
          setShowResult(null);
          lockRef.current = false;
          if (newMatched.size === pairCount) {
            setGameComplete(true);
          }
        }, 1800);
      } else {
        setShowResult({ success: false });
        setTimeout(() => {
          setFlipped([]);
          setShowResult(null);
          lockRef.current = false;
        }, 1200);
      }
    }
  };

  const cols = pairCount <= 6 ? 3 : 4;

  return (
    <div className="app-container" style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a1a 0%, #0a1a2e 50%, #1a0a2e 100%)", padding: "16px", color: "#e0e0e0" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <button className="header-btn" onClick={onBack} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>
            ← 戻る
          </button>
          <div style={{ textAlign: "center", flex: 1, minWidth: 200 }}>
            <h2 className="header-title" style={{ margin: 0, fontSize: 20, color: "#448aff", fontFamily: "'Noto Sans JP', sans-serif", letterSpacing: 2 }}>
              🧠 闇バイト神経衰弱 🧠
            </h2>
            <p style={{ margin: 0, fontSize: 11, color: "#888", marginTop: 2 }}>危険ワードと意味をマッチさせよう</p>
          </div>
          <button className="header-btn" onClick={() => initGame(pairCount)} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>
            🔄
          </button>
        </div>

        {/* Difficulty */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 12 }}>
          {[6, 8, 10].map(n => (
            <button key={n} onClick={() => setPairCount(n)} style={{
              padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700,
              background: pairCount === n ? "linear-gradient(135deg, #448aff, #536dfe)" : "rgba(255,255,255,0.08)",
              color: pairCount === n ? "#fff" : "#888",
              boxShadow: pairCount === n ? "0 2px 10px rgba(68,138,255,0.3)" : "none"
            }}>
              {n}ペア
            </button>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 12, fontSize: 13, color: "#888" }}>
          <span>🎯 {matched.size}/{pairCount} ペア</span>
          <span>🔄 {attempts} 回</span>
        </div>

        {/* Result Flash */}
        {showResult && showResult.success && (
          <div style={{
            background: "rgba(0,230,118,0.1)", borderRadius: 10, padding: 10, marginBottom: 10,
            border: "1px solid rgba(0,230,118,0.3)", textAlign: "center"
          }}>
            <div style={{ fontSize: 14, color: "#00e676", fontWeight: 700 }}>
              ✅ マッチ！「{showResult.word.word}」
            </div>
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>{showResult.word.meaning}</div>
          </div>
        )}

        {/* Game Complete */}
        {gameComplete && (
          <div style={{
            background: "linear-gradient(135deg, rgba(0,230,118,0.15), rgba(68,138,255,0.15))",
            borderRadius: 12, padding: 16, marginBottom: 12, textAlign: "center",
            border: "2px solid #00e676"
          }}>
            <div style={{ fontSize: 28 }}>🎉 クリア！ 🎉</div>
            <div style={{ fontSize: 14, color: "#00e676", fontWeight: 700, marginTop: 4 }}>
              全{pairCount}ペア完成！（{attempts}回）
            </div>
            <div style={{ fontSize: 12, color: "#ccc", marginTop: 8 }}>
              これらの危険ワードを覚えて、自分を守ろう！
            </div>
          </div>
        )}

        {/* Cards Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 8,
          maxWidth: 550,
          margin: "0 auto"
        }}>
          {cards.map((card, idx) => {
            const isFlipped = flipped.includes(idx);
            const isMatched = matched.has(card.pairId);
            const dangerStyle = getDangerColor(card.danger);

            return (
              <button
                key={idx}
                className="memory-card"
                onClick={() => handleFlip(idx)}
                style={{
                  aspectRatio: card.type === "meaning" ? "auto" : "1",
                  minHeight: card.type === "meaning" ? 80 : 70,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  borderRadius: 10, cursor: isMatched ? "default" : "pointer",
                  border: isMatched ? `2px solid #00e67666` : isFlipped ? `2px solid ${dangerStyle.bg}` : "1px solid rgba(255,255,255,0.08)",
                  background: isMatched
                    ? "rgba(0,230,118,0.08)"
                    : isFlipped
                      ? card.type === "word"
                        ? `linear-gradient(135deg, ${dangerStyle.bg}cc, ${dangerStyle.bg}66)`
                        : "rgba(68,138,255,0.15)"
                      : "rgba(255,255,255,0.04)",
                  color: isMatched ? "#00e67688" : isFlipped ? "#fff" : "#333",
                  padding: 8,
                  transition: "all 0.3s",
                  boxShadow: isFlipped && !isMatched ? `0 0 15px ${dangerStyle.glow}` : "none",
                  opacity: isMatched ? 0.5 : 1,
                  transform: isFlipped || isMatched ? "rotateY(0deg)" : "rotateY(0deg)",
                }}
              >
                {(isFlipped || isMatched) ? (
                  <>
                    <span style={{ fontSize: 10, opacity: 0.7, marginBottom: 2 }}>
                      {card.type === "word" ? getCategoryIcon(card.category) : "📝"}
                    </span>
                    <span className={card.type === "word" ? "memory-card-word" : "memory-card-meaning"} style={{
                      fontSize: card.type === "word" ? (card.word.length > 6 ? 12 : 14) : 10,
                      fontWeight: card.type === "word" ? 800 : 500,
                      lineHeight: 1.3, textAlign: "center",
                      wordBreak: "break-all"
                    }}>
                      {card.type === "word" ? card.word : card.meaning}
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: 24 }}>❓</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Instructions */}
        <div style={{ marginTop: 16, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 12, fontSize: 11, color: "#888" }}>
          <strong style={{ color: "#aaa" }}>📖 遊び方</strong>
          <div style={{ marginTop: 4 }}>
            カードを2枚めくって、<strong style={{ color: "#448aff" }}>危険ワード</strong>とその<strong style={{ color: "#448aff" }}>意味</strong>のペアを見つけよう！<br/>
            少ない回数でクリアを目指そう。闇バイトの手口を覚えて自分を守ろう！
          </div>
        </div>
      </div>
    </div>
  );
}

// =========== 単語一覧モード ===========
function WordList({ onBack }) {
  const [filter, setFilter] = useState("all");
  const categories = ["all", "隠語", "甘い言葉", "手口", "知識"];
  const filtered = filter === "all" ? DANGER_WORDS : DANGER_WORDS.filter(w => w.category === filter);

  return (
    <div className="app-container" style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #0a1a2e 100%)", padding: "16px", color: "#e0e0e0" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
          <button className="header-btn" onClick={onBack} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>
            ← 戻る
          </button>
          <h2 className="header-title" style={{ margin: 0, fontSize: 20, color: "#7c4dff" }}>📚 危険ワード一覧</h2>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} style={{
              padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: filter === cat ? "linear-gradient(135deg, #7c4dff, #536dfe)" : "rgba(255,255,255,0.08)",
              color: filter === cat ? "#fff" : "#888"
            }}>
              {cat === "all" ? "すべて" : cat}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((w, i) => {
            const d = getDangerColor(w.danger);
            return (
              <div key={i} style={{
                background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 16px",
                borderLeft: `4px solid ${d.bg}`, display: "flex", gap: 14, alignItems: "flex-start"
              }}>
                <div style={{ minWidth: 40, textAlign: "center" }}>
                  <div style={{ fontSize: 20 }}>{getCategoryIcon(w.category)}</div>
                  <div style={{ fontSize: 9, color: d.bg, marginTop: 2 }}>
                    {"⚡".repeat(w.danger)}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: d.bg }}>{w.word}</div>
                  <div style={{ fontSize: 13, color: "#aaa", marginTop: 4, lineHeight: 1.5 }}>{w.meaning}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 20, background: "rgba(255,23,68,0.08)", borderRadius: 12, padding: 16, fontSize: 13, color: "#ff6b6b", border: "1px solid rgba(255,23,68,0.2)" }}>
          <strong>⚡ 危険度の見方</strong>
          <div style={{ marginTop: 6, color: "#ccc", lineHeight: 1.6 }}>
            <span style={{ color: "#ff1744" }}>⚡⚡⚡</span> = 犯罪に直結する隠語・手口<br />
            <span style={{ color: "#ff9100" }}>⚡⚡</span> = 勧誘でよく使われる危険ワード<br />
            <span style={{ color: "#ffd600" }}>⚡</span> = 注意すべき表現
          </div>
        </div>
      </div>
    </div>
  );
}

// =========== メインアプリ ===========
export default function App() {
  const [mode, setMode] = useState("menu");

  // グローバルスタイルを注入
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = globalStyles;
    document.head.appendChild(styleEl);
    return () => styleEl.remove();
  }, []);

  if (mode === "bingo") return <BingoGame onBack={() => setMode("menu")} />;
  if (mode === "memory") return <MemoryGame onBack={() => setMode("menu")} />;
  if (mode === "list") return <WordList onBack={() => setMode("menu")} />;

  return (
    <div className="app-container" style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 40%, #0a1a2e 70%, #0a0a1a 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 20, color: "#e0e0e0", fontFamily: "'Noto Sans JP', sans-serif"
    }}>
      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🚨</div>
        <h1 className="game-title" style={{
          fontSize: 32, fontWeight: 900, margin: 0,
          background: "linear-gradient(135deg, #ff1744, #ff6b6b, #d500f9)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          letterSpacing: 4, lineHeight: 1.3
        }}>
          闇バイトビンゴ
        </h1>
        <p style={{ color: "#888", fontSize: 14, marginTop: 12, maxWidth: 400, lineHeight: 1.7, margin: "12px auto 0" }}>
          ゲームで学ぶ闇バイトの危険ワード<br />
          <span style={{ color: "#ff6b6b" }}>知ることが、自分を守る第一歩</span>
        </p>
      </div>

      {/* Mode Select */}
      <div className="menu-container" style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 400, padding: "0 16px" }}>
        <button
          className="mode-button"
          onClick={() => setMode("bingo")}
          style={{
            padding: "20px 24px", borderRadius: 16, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg, rgba(255,23,68,0.15), rgba(213,0,249,0.15))",
            border: "1px solid rgba(255,23,68,0.3)",
            color: "#fff", textAlign: "left", transition: "all 0.2s"
          }}
        >
          <div className="mode-button-title" style={{ fontSize: 24, marginBottom: 6 }}>🎯 ビンゴモード</div>
          <div className="mode-button-desc" style={{ fontSize: 13, color: "#aaa", lineHeight: 1.5 }}>
            危険ワードが5つ揃ったらビンゴ＝犯罪者！<br/>
            クラス全体で盛り上がれるモード
          </div>
        </button>

        <button
          className="mode-button"
          onClick={() => setMode("memory")}
          style={{
            padding: "20px 24px", borderRadius: 16, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg, rgba(68,138,255,0.15), rgba(83,109,254,0.15))",
            border: "1px solid rgba(68,138,255,0.3)",
            color: "#fff", textAlign: "left", transition: "all 0.2s"
          }}
        >
          <div className="mode-button-title" style={{ fontSize: 24, marginBottom: 6 }}>🧠 神経衰弱モード</div>
          <div className="mode-button-desc" style={{ fontSize: 13, color: "#aaa", lineHeight: 1.5 }}>
            危険ワードとその意味をマッチング！<br/>
            個人・ペア学習に最適
          </div>
        </button>

        <button
          className="mode-button"
          onClick={() => setMode("list")}
          style={{
            padding: "20px 24px", borderRadius: 16, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg, rgba(124,77,255,0.15), rgba(101,31,255,0.15))",
            border: "1px solid rgba(124,77,255,0.3)",
            color: "#fff", textAlign: "left", transition: "all 0.2s"
          }}
        >
          <div className="mode-button-title" style={{ fontSize: 24, marginBottom: 6 }}>📚 危険ワード一覧</div>
          <div className="mode-button-desc" style={{ fontSize: 13, color: "#aaa", lineHeight: 1.5 }}>
            全30語の危険ワードと意味を確認<br/>
            授業の解説・振り返りに
          </div>
        </button>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 48, textAlign: "center", fontSize: 11, color: "#666", maxWidth: 340, lineHeight: 1.7, padding: "0 16px" }}>
        ⚠️ このアプリは教育目的で制作されています。<br/>
        闇バイトに関わってしまった場合は<br/>
        <strong style={{ color: "#ff6b6b" }}>警察相談専用電話 #9110</strong> に相談してください。
      </div>
    </div>
  );
}
