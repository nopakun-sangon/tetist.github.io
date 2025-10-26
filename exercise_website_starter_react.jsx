// Math drill (addition/subtraction two-digit). Timed, one question at a time.
// Notes: adjustable time via UI; on timeout we auto-check the typed input; blank counts as wrong.

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// utils
const uuid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random()}`);
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const genAddQuestion = () => {
  const a = randInt(10, 99);
  const bMax = Math.max(0, 99 - a);
  const b = randInt(0, bMax);
  return { id: uuid(), prompt: `${a} + ${b} = ?`, answer: String(a + b) };
};

const genSubQuestion = () => {
  const a = randInt(10, 99);
  const b = randInt(0, a);
  return { id: uuid(), prompt: `${a} − ${b} = ?`, answer: String(a - b) };
};

const generateMathDrill = (count = 10) => Array.from({ length: count }, () => (Math.random() < 0.5 ? genAddQuestion() : genSubQuestion()));

function TimedDrill({ count = 10, secondsPerQ = 10, onFinish }) {
  const [questions] = useState(() => generateMathDrill(count));
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(secondsPerQ);
  const [userAnswer, setUserAnswer] = useState("");
  const [results, setResults] = useState([]);

  const current = questions[idx];
  const progressPct = useMemo(() => Math.round((idx / questions.length) * 100), [idx, questions.length]);

  useEffect(() => {
    const t = setInterval(() => setRemaining((r) => (r > 0 ? r - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [idx]);

  useEffect(() => {
    if (remaining === 0) handleSubmit(true); // auto-submit when time up
  }, [remaining]);

  const handleSubmit = (timeout = false) => {
    const q = current;
    const u = String(userAnswer ?? "").trim();
    const correct = !timeout ? u === q.answer : u === q.answer; // on timeout we still check typed input; blank => wrong
    const entry = { id: q.id, prompt: q.prompt, correctAnswer: q.answer, user: u, correct, earned: correct ? 1 : 0 };

    const nextResults = [...results, entry];
    setResults(nextResults);
    setUserAnswer("");
    setRemaining(secondsPerQ);

    if (idx + 1 < questions.length) {
      setIdx(idx + 1);
    } else {
      const score = nextResults.reduce((s, r) => s + r.earned, 0);
      onFinish?.({ results: nextResults, score, total: questions.length });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Badge>ข้อที่ {idx + 1} / {questions.length}</Badge>
        <Badge variant="secondary">เวลา: {remaining}s</Badge>
        <div className="flex-1" />
        <div className="w-40"><Progress value={progressPct} /></div>
      </div>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="text-xl font-semibold text-center">{current.prompt}</div>
          <div className="flex items-center justify-center gap-2">
            <Input
              inputMode="numeric"
              pattern="[0-9]*"
              className="max-w-[180px] text-center text-lg"
              placeholder="ตอบเป็นตัวเลข"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value.replace(/[^0-9]/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit(false)}
              autoFocus
            />
            <Button size="lg" onClick={() => handleSubmit(false)}>ส่งคำตอบ</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MathDrillApp() {
  const [lastResult, setLastResult] = useState(null);
  const [drillMode, setDrillMode] = useState(false);
  const [secondsPerQ, setSecondsPerQ] = useState(10); // UI-adjustable

  // lightweight self-tests
  useEffect(() => {
    try {
      const qs = generateMathDrill(5);
      console.assert(qs.length === 5, "Should generate 5 questions");
      const ok = qs.every((q) => {
        const parts = q.prompt.split(" ");
        if (parts.length < 4) return false;
        const a = parseInt(parts[0], 10);
        const op = parts[1];
        const b = parseInt(parts[2], 10);
        const ans = parseInt(q.answer, 10);
        return (op === "+" && a + b === ans) || (op === "−" && a - b === ans);
      });
      console.assert(ok, "Prompt/answer must be consistent");
    } catch (e) {
      console.error("Self-test failed", e);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold">แบบฝึกหัดคณิต (บวก/ลบ) — จับเวลา</h1>

        <div className="flex items-center gap-3">
          <p className="text-muted-foreground">10 ข้อ • เวลาต่อข้อ {secondsPerQ}s</p>
          <div className="flex items-center gap-2 ml-auto">
            <Input
              type="number"
              min={3}
              max={120}
              value={secondsPerQ}
              onChange={(e) => setSecondsPerQ(Math.max(1, Number(e.target.value || 0)))}
              className="w-24 text-center"
              aria-label="seconds per question"
              title="seconds per question"
            />
            <Badge variant="outline">ปรับเวลาได้</Badge>
          </div>
        </div>

        {!drillMode && !lastResult && (
          <Button onClick={() => { setDrillMode(true); setLastResult(null); }}>เริ่มทำแบบฝึกหัด</Button>
        )}

        {drillMode && (
          <TimedDrill
            count={10}
            secondsPerQ={secondsPerQ}
            onFinish={(r) => { setLastResult(r); setDrillMode(false); }}
          />
        )}

        {lastResult && !drillMode && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">คะแนน</Badge>
                <div className="text-2xl font-bold">{lastResult.score} / {lastResult.total}</div>
              </div>
              <div className="grid gap-3">
                {lastResult.results.map((r, i) => (
                  <Card key={r.id}>
                    <CardContent className="p-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground">#{i + 1}</div>
                        <Badge variant={r.correct ? "default" : "destructive"}>{r.correct ? "ถูก" : "ผิด"}</Badge>
                        <div className="ml-auto text-sm">{r.correct ? "+1" : "+0"}</div>
                      </div>
                      <div className="text-sm">โจทย์: <span className="font-medium">{r.prompt}</span></div>
                      <div className="text-sm">คำตอบของคุณ: <span className="font-mono">{r.user || "(ว่าง)"}</span></div>
                      <div className="text-sm">คำตอบที่ถูก: <span className="font-mono">{r.correctAnswer}</span></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => { setLastResult(null); setDrillMode(true); }}>ทำอีกครั้ง</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
